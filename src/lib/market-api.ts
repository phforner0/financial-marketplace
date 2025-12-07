// src/lib/market-api.ts - OTIMIZADO PARA REDUZIR CONSUMO DE API

import axios, { AxiosInstance, AxiosError } from 'axios';
import { getCached, setCached, CACHE_KEYS, CACHE_TTL } from './redis';

// ============================================
// RATE LIMIT TRACKER - MELHORADO
// ============================================
const rateLimitTracker = {
  tiingo: {
    lastReset: Date.now(),
    requestCount: 0,
    maxPerHour: 30, // ⚠️ REDUZIDO DE 50 PARA 30 (MAIS CONSERVADOR)
    isLimited: false,
    blockUntil: 0 // Timestamp para bloquear requests
  }
};

function checkRateLimit(service: 'tiingo'): boolean {
  const tracker = rateLimitTracker[service];
  const now = Date.now();
  const hourInMs = 60 * 60 * 1000;
  
  // Se estiver bloqueado, verifica se já passou 1 hora
  if (tracker.blockUntil > now) {
    console.warn(`⚠️ Tiingo bloqueado até ${new Date(tracker.blockUntil).toLocaleTimeString()}`);
    return false;
  }
  
  // Reset contador a cada hora
  if (now - tracker.lastReset > hourInMs) {
    tracker.lastReset = now;
    tracker.requestCount = 0;
    tracker.isLimited = false;
    tracker.blockUntil = 0;
    console.log('✅ Rate limit resetado');
  }
  
  // Verifica se atingiu limite
  if (tracker.requestCount >= tracker.maxPerHour) {
    tracker.isLimited = true;
    tracker.blockUntil = tracker.lastReset + hourInMs;
    console.warn(`❌ Rate limit atingido (${tracker.requestCount}/${tracker.maxPerHour}). Próximo reset: ${new Date(tracker.blockUntil).toLocaleTimeString()}`);
    return false;
  }
  
  tracker.requestCount++;
  console.log(`📊 Tiingo requests: ${tracker.requestCount}/${tracker.maxPerHour}`);
  return true;
}

// Circuit Breaker State
let circuitState: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
let failureCount = 0;
let lastFailureTime = 0;
let halfOpenSuccesses = 0;
const FAILURE_THRESHOLD = 5;
const CIRCUIT_TIMEOUT = 60000;
const HALF_OPEN_SUCCESS_THRESHOLD = 3;

// Brapi Client
const brapiClient = axios.create({
  baseURL: 'https://brapi.dev/api',
  params: { token: process.env.BRAPI_TOKEN },
  timeout: 8000,
});

// Tiingo Client
const tiingoClient = axios.create({
  baseURL: 'https://api.tiingo.com',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Token ${process.env.TIINGO_API_KEY}`
  },
  timeout: 8000,
});

// Retry Interceptor
function addRetryInterceptor(client: AxiosInstance) {
  client.interceptors.response.use(
    response => response,
    async (error: AxiosError) => {
      const config = error.config as any;
      
      if (error.response?.status === 429) {
        console.error('❌ Rate limit 429 detectado. Bloqueando Tiingo por 1 hora.');
        rateLimitTracker.tiingo.isLimited = true;
        rateLimitTracker.tiingo.blockUntil = Date.now() + 60 * 60 * 1000;
        return Promise.reject(error);
      }
      
      if (!config || !config.retry) {
        config.retry = 0;
      }
      
      if (
        config.retry < 3 &&
        (error.code === 'ECONNABORTED' || 
         error.code === 'ERR_NETWORK' ||
         (error.response && error.response.status >= 500))
      ) {
        config.retry += 1;
        const delay = Math.min(1000 * Math.pow(2, config.retry), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
        return client.request(config);
      }
      
      return Promise.reject(error);
    }
  );
}

addRetryInterceptor(brapiClient);
addRetryInterceptor(tiingoClient);

function checkCircuitBreaker(): boolean {
  if (circuitState === 'OPEN') {
    const now = Date.now();
    if (now - lastFailureTime > CIRCUIT_TIMEOUT) {
      console.log('Circuit breaker: Transitioning to HALF_OPEN');
      circuitState = 'HALF_OPEN';
      failureCount = 0;
      halfOpenSuccesses = 0;
      return true;
    }
    throw new Error('Circuit breaker is OPEN - API temporarily unavailable');
  }
  return true;
}

function recordSuccess() {
  if (circuitState === 'HALF_OPEN') {
    halfOpenSuccesses++;
    if (halfOpenSuccesses >= HALF_OPEN_SUCCESS_THRESHOLD) {
      console.log('Circuit breaker: Transitioning to CLOSED');
      circuitState = 'CLOSED';
      halfOpenSuccesses = 0;
    }
  } else if (circuitState === 'CLOSED') {
    failureCount = 0;
  }
}

function recordFailure() {
  failureCount++;
  lastFailureTime = Date.now();
  
  if (circuitState === 'HALF_OPEN') {
    console.log('Circuit breaker: Failure in HALF_OPEN, reopening');
    circuitState = 'OPEN';
    halfOpenSuccesses = 0;
    return;
  }
  
  if (failureCount >= FAILURE_THRESHOLD) {
    console.log('Circuit breaker: Transitioning to OPEN');
    circuitState = 'OPEN';
  }
}

function isBrazilianSymbol(symbol: string): boolean {
  return symbol.endsWith('.SA') || /\d$/.test(symbol);
}

export interface Quote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  volume: number;
  timestamp: number;
  logo?: string;
}

export interface CompanyProfile {
  symbol: string;
  name: string;
  exchange: string;
  industry: string;
  sector: string;
  marketCap: number;
  description: string;
  ceo: string;
  founded: string;
  employees: number;
  website: string;
  logo: string;
}

export interface SearchResult {
  symbol: string;
  description: string;
  type: string;
  exchange: string;
  country: 'BR' | 'US';
}

// ============================================
// GET QUOTE - PRIORIZA CACHE
// ============================================
export async function getQuote(symbol: string): Promise<Quote | null> {
  const cacheKey = CACHE_KEYS.quote(symbol);
  
  try {
    // SEMPRE TENTA CACHE PRIMEIRO
    const cached = await getCached<Quote>(cacheKey);
    if (cached) {
      // Cache válido até 5 minutos - aceita cache antigo se API limitada
      const cacheAge = Date.now() - cached.timestamp;
      const maxAge = 5 * 60 * 1000; // 5 minutos
      
      if (cacheAge < maxAge) {
        console.log(`✅ Cache válido para ${symbol} (${Math.round(cacheAge/1000)}s)`);
        return cached;
      }
      
      // Cache expirado, mas se API estiver limitada, retorna mesmo assim
      if (rateLimitTracker.tiingo.isLimited) {
        console.log(`📦 Usando cache expirado para ${symbol} (API limitada)`);
        return cached;
      }
    }
    
    checkCircuitBreaker();
    
    const isBr = isBrazilianSymbol(symbol);
    let quote: Quote;

    if (isBr) {
      // BR usa Brapi (sem rate limit rígido)
      const { data } = await brapiClient.get(`/quote/${symbol}`, {
        params: { fundamental: 'true' }
      });
      
      if (!data.results || data.results.length === 0) {
        recordFailure();
        return cached || null; // Retorna cache se existir
      }
      
      const stock = data.results[0];
      quote = {
        symbol: stock.symbol,
        price: stock.regularMarketPrice,
        change: stock.regularMarketChange || 0,
        changePercent: stock.regularMarketChangePercent || 0,
        high: stock.regularMarketDayHigh,
        low: stock.regularMarketDayLow,
        open: stock.regularMarketOpen,
        previousClose: stock.regularMarketPreviousClose,
        volume: stock.regularMarketVolume,
        timestamp: Date.now(),
        logo: stock.logourl
      };
    } else {
      // US usa Tiingo COM RATE LIMIT
      if (!checkRateLimit('tiingo') || rateLimitTracker.tiingo.isLimited) {
        console.warn(`⚠️ Pulando request Tiingo para ${symbol} (rate limit)`);
        return cached || null;
      }
      
      const { data } = await tiingoClient.get(`/iex/${symbol}`);
      
      if (!data || data.length === 0) {
        recordFailure();
        return cached || null;
      }
      
      const tData = data[0];
      const price = tData.last || tData.tngoLast;
      const prevClose = tData.prevClose;
      
      quote = {
        symbol: tData.ticker.toUpperCase(),
        price: price,
        change: price - prevClose,
        changePercent: prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0,
        high: tData.high || price,
        low: tData.low || price,
        open: tData.open || price,
        previousClose: prevClose,
        volume: tData.volume || 0,
        timestamp: Date.now(),
      };
    }

    // Cache por 2 minutos (reduzido de 30s para economizar requests)
    await setCached(cacheKey, quote, 120);
    recordSuccess();
    return quote;

  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error);
    recordFailure();
    
    const staleCache = await getCached<Quote>(cacheKey);
    if (staleCache) {
      console.log(`📦 Retornando cache expirado para ${symbol}`);
      return staleCache;
    }
    
    return null;
  }
}

// ============================================
// GET QUOTES (BATCH) - OTIMIZADO
// ============================================
export async function getQuotes(symbols: string[]): Promise<Quote[]> {
  const quotes: Quote[] = [];
  
  // 1. Tenta buscar TUDO do cache primeiro
  const cachePromises = symbols.map(symbol => 
    getCached<Quote>(CACHE_KEYS.quote(symbol))
  );
  
  const cachedResults = await Promise.all(cachePromises);
  const cachedQuotes = cachedResults.filter(Boolean) as Quote[];
  
  // Símbolos que não estão em cache
  const uncachedSymbols = symbols.filter((symbol, i) => !cachedResults[i]);
  
  console.log(`📊 Cache: ${cachedQuotes.length}/${symbols.length} | Buscar: ${uncachedSymbols.length}`);
  
  quotes.push(...cachedQuotes);
  
  if (uncachedSymbols.length === 0) {
    return quotes; // Tudo veio do cache!
  }
  
  // 2. Separa BR e US
  const brSymbols = uncachedSymbols.filter(isBrazilianSymbol);
  const usSymbols = uncachedSymbols.filter(s => !isBrazilianSymbol(s));

  // 3. Busca BR (sem limite rígido)
  if (brSymbols.length > 0) {
    console.log(`🇧🇷 Buscando ${brSymbols.length} símbolos BR`);
    
    for (const symbol of brSymbols) {
      try {
        const quote = await getQuote(symbol);
        if (quote) quotes.push(quote);
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (e) {
        console.error(`Failed to fetch ${symbol}:`, e);
      }
    }
  }

  // 4. Busca US COM LIMITE
  if (usSymbols.length > 0) {
    // ⚠️ VERIFICAÇÃO CRÍTICA
    if (!checkRateLimit('tiingo') || rateLimitTracker.tiingo.isLimited) {
      console.warn(`⚠️ Pulando batch Tiingo (${usSymbols.length} símbolos) - rate limit`);
      return quotes; // Retorna apenas os BR
    }
    
    console.log(`🇺🇸 Buscando ${usSymbols.length} símbolos US`);
    
    try {
      // BATCH REQUEST (economiza requests!)
      const { data } = await tiingoClient.get(`/iex/?tickers=${usSymbols.join(',')}`);
      
      if (Array.isArray(data)) {
        data.forEach((tData: any) => {
          const price = tData.last || tData.tngoLast;
          const prevClose = tData.prevClose;
          const quote: Quote = {
            symbol: tData.ticker.toUpperCase(),
            price: price,
            change: price - prevClose,
            changePercent: prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0,
            high: tData.high || price,
            low: tData.low || price,
            open: tData.open || price,
            previousClose: prevClose,
            volume: tData.volume || 0,
            timestamp: Date.now(),
          };
          
          quotes.push(quote);
          
          // Cache individual
          setCached(CACHE_KEYS.quote(quote.symbol), quote, 120);
        });
      }
    } catch (error: any) {
      if (error.response?.status === 429) {
        console.error('❌ Tiingo rate limit no batch');
        rateLimitTracker.tiingo.isLimited = true;
        rateLimitTracker.tiingo.blockUntil = Date.now() + 60 * 60 * 1000;
      }
      console.error('Erro batch Tiingo:', error.message);
    }
  }

  return quotes;
}

// ============================================
// COMPANY PROFILE - PRIORIZA CACHE
// ============================================
export async function getCompanyProfile(symbol: string): Promise<CompanyProfile | null> {
  const cacheKey = CACHE_KEYS.symbolInfo(symbol);
  const cached = await getCached<CompanyProfile>(cacheKey);
  
  // Cache de 1 hora - muito mais longo
  if (cached) return cached;

  const isBr = isBrazilianSymbol(symbol);
  
  try {
    let profile: CompanyProfile;

    if (isBr) {
      const { data } = await brapiClient.get(`/quote/${symbol}`, { params: { fundamental: 'true' } });
      if (!data.results?.[0]) return null;
      
      const stock = data.results[0];
      profile = {
        symbol: stock.symbol,
        name: stock.longName || stock.shortName || stock.symbol,
        exchange: 'B3',
        industry: '',
        sector: '',
        marketCap: stock.marketCap || 0,
        description: stock.summaryProfile?.longBusinessSummary || 'No description available.',
        ceo: '',
        founded: '',
        employees: 0,
        website: stock.summaryProfile?.website || '',
        logo: stock.logourl || '',
      };
    } else {
      if (!checkRateLimit('tiingo') || rateLimitTracker.tiingo.isLimited) {
        console.warn(`⚠️ Pulando profile Tiingo para ${symbol}`);
        return null;
      }
      
      const { data } = await tiingoClient.get(`/daily/${symbol}`);
      if (!data) return null;

      profile = {
        symbol: data.ticker,
        name: data.name || data.ticker,
        exchange: data.exchangeCode || 'US',
        industry: '',
        sector: '',
        marketCap: 0,
        description: data.description || '',
        ceo: '',
        founded: data.startDate || '',
        employees: 0,
        website: '',
        logo: '', 
      };
    }

    await setCached(cacheKey, profile, CACHE_TTL.COMPANY_INFO);
    return profile;
  } catch (error) {
    console.error(`Error fetching profile for ${symbol}:`, error);
    return null;
  }
}

// ============================================
// SEARCH SYMBOLS - CACHE LONGO
// ============================================
export async function searchSymbols(query: string): Promise<SearchResult[]> {
  const cacheKey = CACHE_KEYS.symbolSearch(query);
  const cached = await getCached<SearchResult[]>(cacheKey);
  if (cached) return cached;

  try {
    const [brapiRes, tiingoRes] = await Promise.allSettled([
      brapiClient.get(`/quote/list`, { params: { search: query, limit: 5 } }),
      (checkRateLimit('tiingo') && !rateLimitTracker.tiingo.isLimited) 
        ? tiingoClient.get(`/tiingo/utilities/search`, { params: { query: query, limit: 5 } })
        : Promise.reject(new Error('Rate limit'))
    ]);

    let results: SearchResult[] = [];

    if (brapiRes.status === 'fulfilled' && brapiRes.value.data.stocks) {
      const brResults = brapiRes.value.data.stocks.map((item: any) => ({
        symbol: item.stock,
        description: item.name,
        type: 'Stock',
        exchange: 'B3',
        country: 'BR' as const
      }));
      results = [...results, ...brResults];
    }

    if (tiingoRes.status === 'fulfilled' && Array.isArray(tiingoRes.value.data)) {
      const usResults = tiingoRes.value.data.map((item: any) => ({
        symbol: item.ticker,
        description: item.name,
        type: item.assetType || 'Stock',
        exchange: item.exchangeCode,
        country: 'US' as const
      }));
      results = [...results, ...usResults];
    }

    // Cache de busca por 24h
    await setCached(cacheKey, results, CACHE_TTL.SYMBOL_SEARCH);
    return results;

  } catch (error) {
    console.error('Error searching symbols:', error);
    return [];
  }
}

// ============================================
// MARKET INDICES - USA PROXIES E CACHE
// ============================================
export async function getMarketIndices() {
  const cacheKey = CACHE_KEYS.indices();
  const cached = await getCached(cacheKey);
  if (cached) {
    console.log('✅ Retornando índices do cache');
    return cached;
  }

  try {
    console.log('📊 Buscando índices frescos');
    
    // Ibovespa via Brapi
    const brapiQuotes: Quote[] = [];
    const ibovQuote = await getQuote('^BVSP');
    if (ibovQuote) brapiQuotes.push(ibovQuote);
    
    // Proxies US - SE rate limit permitir
    let usQuotes: Quote[] = [];
    if (!rateLimitTracker.tiingo.isLimited && checkRateLimit('tiingo')) {
      usQuotes = await getQuotes(['SPY', 'QQQ', 'DIA']);
    } else {
      console.warn('⚠️ Pulando índices US (rate limit)');
    }
    
    const indices = {
      ibovespa: brapiQuotes.find(q => q.symbol === '^BVSP') || null,
      sp500: usQuotes.find(q => q.symbol === 'SPY') || null,
      nasdaq: usQuotes.find(q => q.symbol === 'QQQ') || null,
      dow: usQuotes.find(q => q.symbol === 'DIA') || null,
    };

    // Cache por 5 minutos
    await setCached(cacheKey, indices, 300);
    return indices;
  } catch (error) {
    console.error('❌ Erro buscando índices:', error);
    return { ibovespa: null, sp500: null, nasdaq: null, dow: null };
  }
}

export async function getTopMovers() {
  return { gainers: [], losers: [] };
}

export async function getMarketNews() {
  return [];
}

export async function getBasicFinancials(symbol: string) {
  return null;
}

export const marketAPI = {
  getQuote,
  getQuotes,
  getCompanyProfile,
  getMarketIndices,
  getTopMovers,
  getMarketNews,
  searchSymbols,
  getBasicFinancials,
};

export default marketAPI;