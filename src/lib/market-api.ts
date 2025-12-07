// src/lib/market-api.ts (CORRIGIDO - Rate Limit Handler)

import axios, { AxiosInstance, AxiosError } from 'axios';
import { getCached, setCached, CACHE_KEYS, CACHE_TTL } from './redis';

// Circuit Breaker State
let circuitState: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
let failureCount = 0;
let lastFailureTime = 0;
let halfOpenSuccesses = 0;
const FAILURE_THRESHOLD = 5;
const CIRCUIT_TIMEOUT = 60000;
const HALF_OPEN_SUCCESS_THRESHOLD = 3;

// ✅ RATE LIMIT TRACKING
const rateLimitTracker = {
  tiingo: {
    lastReset: Date.now(),
    requestCount: 0,
    maxPerHour: 50, // Limite conservador
    isLimited: false
  }
};

function checkRateLimit(service: 'tiingo'): boolean {
  const tracker = rateLimitTracker[service];
  const now = Date.now();
  const hourInMs = 60 * 60 * 1000;
  
  // Reset contador a cada hora
  if (now - tracker.lastReset > hourInMs) {
    tracker.lastReset = now;
    tracker.requestCount = 0;
    tracker.isLimited = false;
  }
  
  // Verifica se atingiu limite
  if (tracker.requestCount >= tracker.maxPerHour) {
    tracker.isLimited = true;
    console.warn(`⚠️ Rate limit reached for ${service}. Blocking further requests.`);
    return false;
  }
  
  tracker.requestCount++;
  return true;
}

function resetRateLimit(service: 'tiingo') {
  rateLimitTracker[service].isLimited = false;
  rateLimitTracker[service].requestCount = 0;
}

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
      
      // ✅ Detecta 429 e bloqueia mais requests
      if (error.response?.status === 429) {
        console.error('❌ Rate limit 429 detected. Blocking Tiingo requests.');
        rateLimitTracker.tiingo.isLimited = true;
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

// Circuit Breaker Check
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
    console.log(`Circuit breaker: HALF_OPEN success ${halfOpenSuccesses}/${HALF_OPEN_SUCCESS_THRESHOLD}`);
    
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

export interface NewsArticle {
  id: number;
  headline: string;
  summary: string;
  source: string;
  url: string;
  image: string;
  datetime: number;
  category: string;
  related: string[];
}

// ✅ GET QUOTE (CORRIGIDO)
export async function getQuote(symbol: string): Promise<Quote | null> {
  const cacheKey = CACHE_KEYS.quote(symbol);
  
  try {
    const cached = await getCached<Quote>(cacheKey);
    if (cached) {
      console.log(`✅ Cache hit for ${symbol}`);
      return cached;
    }
    
    checkCircuitBreaker();
    
    const isBr = isBrazilianSymbol(symbol);
    let quote: Quote;

    if (isBr) {
      // BR usa Brapi (sem rate limit tão rígido)
      const { data } = await brapiClient.get(`/quote/${symbol}`, {
        params: { fundamental: 'true' }
      });
      
      if (!data.results || data.results.length === 0) {
        recordFailure();
        return null;
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
      // ✅ US usa Tiingo (com rate limit check)
      if (!checkRateLimit('tiingo') || rateLimitTracker.tiingo.isLimited) {
        console.warn(`⚠️ Skipping Tiingo request for ${symbol} due to rate limit`);
        
        // Retorna cache stale se existir
        const staleCache = await getCached<Quote>(cacheKey);
        if (staleCache) {
          console.log(`📦 Returning stale cache for ${symbol}`);
          return staleCache;
        }
        
        return null;
      }
      
      const { data } = await tiingoClient.get(`/iex/${symbol}`);
      
      if (!data || data.length === 0) {
        recordFailure();
        return null;
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

    await setCached(cacheKey, quote, CACHE_TTL.QUOTE);
    recordSuccess();
    return quote;

  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error);
    recordFailure();
    
    const staleCache = await getCached<Quote>(cacheKey);
    if (staleCache) {
      console.log(`📦 Returning stale cache for ${symbol}`);
      return staleCache;
    }
    
    return null;
  }
}

// ✅ GET QUOTES (BATCH - CORRIGIDO)
export async function getQuotes(symbols: string[]): Promise<Quote[]> {
  const brSymbols = symbols.filter(isBrazilianSymbol);
  const usSymbols = symbols.filter(s => !isBrazilianSymbol(s));

  const quotes: Quote[] = [];

  // 1. Batch Brapi (SEM RATE LIMIT RÍGIDO)
  if (brSymbols.length > 0) {
    console.log(`🇧🇷 Fetching ${brSymbols.length} BR symbols from Brapi`);
    
    for (const symbol of brSymbols) {
      try {
        const quote = await getQuote(symbol);
        if (quote) quotes.push(quote);
        await new Promise(resolve => setTimeout(resolve, 100)); // Delay entre requests
      } catch (e) {
        console.error(`Failed to fetch ${symbol}:`, e);
      }
    }
  }

  // 2. Batch Tiingo (COM RATE LIMIT CHECK)
  if (usSymbols.length > 0) {
    // ✅ VERIFICA RATE LIMIT ANTES DE FAZER BATCH
    if (!checkRateLimit('tiingo') || rateLimitTracker.tiingo.isLimited) {
      console.warn(`⚠️ Skipping Tiingo batch request for ${usSymbols.length} symbols due to rate limit`);
      
      // Tenta buscar do cache individual
      for (const symbol of usSymbols) {
        const cached = await getCached<Quote>(CACHE_KEYS.quote(symbol));
        if (cached) {
          console.log(`📦 Using cached ${symbol}`);
          quotes.push(cached);
        }
      }
      
      return quotes;
    }
    
    console.log(`🇺🇸 Fetching ${usSymbols.length} US symbols from Tiingo`);
    
    try {
      const { data } = await tiingoClient.get(`/iex/?tickers=${usSymbols.join(',')}`);
      
      if (Array.isArray(data)) {
        data.forEach((tData: any) => {
          const price = tData.last || tData.tngoLast;
          const prevClose = tData.prevClose;
          quotes.push({
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
          });
        });
      }
    } catch (error: any) {
      if (error.response?.status === 429) {
        console.error('❌ Tiingo rate limit hit in batch request');
        rateLimitTracker.tiingo.isLimited = true;
      }
      console.error('Error batch Tiingo', error.message);
    }
  }

  return quotes;
}

// ✅ GET COMPANY PROFILE
export async function getCompanyProfile(symbol: string): Promise<CompanyProfile | null> {
  const cacheKey = CACHE_KEYS.symbolInfo(symbol);
  const cached = await getCached<CompanyProfile>(cacheKey);
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
        console.warn(`⚠️ Skipping Tiingo profile for ${symbol} due to rate limit`);
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

// ✅ SEARCH SYMBOLS
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

    await setCached(cacheKey, results, CACHE_TTL.SYMBOL_SEARCH);
    return results;

  } catch (error) {
    console.error('Error searching symbols:', error);
    return [];
  }
}

// ✅ MARKET NEWS
export async function getMarketNews(): Promise<NewsArticle[]> {
  const cacheKey = CACHE_KEYS.news();
  const cached = await getCached<NewsArticle[]>(cacheKey);
  if (cached) return cached;
  
  if (!checkRateLimit('tiingo') || rateLimitTracker.tiingo.isLimited) {
    console.warn('⚠️ Skipping news request due to rate limit');
    return [];
  }
  
  try {
    const { data } = await tiingoClient.get('/tiingo/news', { params: { limit: 15 } });
    
    const news = data.map((article: any) => ({
      id: article.id,
      headline: article.title,
      summary: article.description,
      source: article.source,
      url: article.url,
      image: '',
      datetime: new Date(article.publishedDate).getTime() / 1000,
      category: 'general',
      related: article.tickers
    }));

    await setCached(cacheKey, news, CACHE_TTL.NEWS_FEED);
    return news;
  } catch (error) {
    return [];
  }
}

// ✅ MARKET INDICES (CORRIGIDO - USA APENAS BRAPI PARA ÍNDICES BR)
export async function getMarketIndices() {
  const cacheKey = CACHE_KEYS.indices();
  const cached = await getCached(cacheKey);
  if (cached) {
    console.log('✅ Returning cached indices');
    return cached;
  }

  try {
    console.log('📊 Fetching fresh indices data');
    
    // ✅ Busca índices brasileiros via Brapi (^BVSP)
    const brapiSymbols = ['^BVSP'];
    const brapiQuotes: Quote[] = [];
    
    for (const symbol of brapiSymbols) {
      const quote = await getQuote(symbol);
      if (quote) brapiQuotes.push(quote);
    }
    
    // ✅ Busca proxies US se rate limit permitir
    let usQuotes: Quote[] = [];
    if (!rateLimitTracker.tiingo.isLimited) {
      usQuotes = await getQuotes(['SPY', 'QQQ', 'DIA']);
    } else {
      console.warn('⚠️ Skipping US indices due to Tiingo rate limit');
    }
    
    const indices = {
      ibovespa: brapiQuotes.find(q => q.symbol === '^BVSP') || null,
      sp500: usQuotes.find(q => q.symbol === 'SPY') || null,
      nasdaq: usQuotes.find(q => q.symbol === 'QQQ') || null,
      dow: usQuotes.find(q => q.symbol === 'DIA') || null,
    };

    console.log('✅ Indices fetched:', Object.keys(indices).filter(k => indices[k as keyof typeof indices]));

    await setCached(cacheKey, indices, CACHE_TTL.MARKET_OVERVIEW);
    return indices;
  } catch (error) {
    console.error('❌ Error fetching indices:', error);
    return { ibovespa: null, sp500: null, nasdaq: null, dow: null };
  }
}

export async function getTopMovers() {
  return { gainers: [], losers: [] };
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