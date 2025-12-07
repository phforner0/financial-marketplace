// src/lib/market-api.ts (MELHORADO)

import axios, { AxiosInstance, AxiosError } from 'axios';
import { getCached, setCached, CACHE_KEYS, CACHE_TTL } from './redis';

// Circuit Breaker State
let circuitState: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
let failureCount = 0;
let lastFailureTime = 0;
const FAILURE_THRESHOLD = 5;
const CIRCUIT_TIMEOUT = 60000; // 1 minuto

// Brapi Client com Retry
const brapiClient = axios.create({
  baseURL: 'https://brapi.dev/api',
  params: { token: process.env.BRAPI_TOKEN },
  timeout: 8000,
});

// Tiingo Client com Retry
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
      
      if (!config || !config.retry) {
        config.retry = 0;
      }
      
      // Retry em erros de rede ou 5xx
      if (
        config.retry < 3 &&
        (error.code === 'ECONNABORTED' || 
         error.code === 'ERR_NETWORK' ||
         (error.response && error.response.status >= 500))
      ) {
        config.retry += 1;
        
        // Exponential backoff
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
      return true;
    }
    throw new Error('Circuit breaker is OPEN - API temporarily unavailable');
  }
  return true;
}

function recordSuccess() {
  if (circuitState === 'HALF_OPEN') {
    console.log('Circuit breaker: Transitioning to CLOSED');
    circuitState = 'CLOSED';
  }
  failureCount = 0;
}

function recordFailure() {
  failureCount++;
  lastFailureTime = Date.now();
  
  if (failureCount >= FAILURE_THRESHOLD) {
    console.log('Circuit breaker: Transitioning to OPEN');
    circuitState = 'OPEN';
  }
}

/* ============================================
   HELPERS & TYPES
   ============================================ */

/**
 * Detecta se o ativo é Brasileiro (B3) ou Americano.
 * Lógica: Se terminar em .SA ou terminar com número (ex: PETR4, ALPA4, BOVA11), é BR.
 */
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

/* ============================================
   FUNÇÕES DE COTAÇÃO (HYBRID)
   ============================================ */

// Get Quote com Circuit Breaker e Stale Cache Fallback
export async function getQuote(symbol: string): Promise<Quote | null> {
  const cacheKey = CACHE_KEYS.quote(symbol);
  
  try {
    // 1. Tenta cache fresh
    const cached = await getCached<Quote>(cacheKey);
    if (cached) return cached;
    
    // 2. Circuit breaker check
    checkCircuitBreaker();
    
    const isBr = isBrazilianSymbol(symbol);
    let quote: Quote;

    if (isBr) {
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

    // 3. Cache sucesso
    await setCached(cacheKey, quote, CACHE_TTL.QUOTE);
    recordSuccess();
    return quote;

  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error);
    recordFailure();
    
    // 4. Fallback: retorna cache stale se existir
    const staleCache = await getCached<Quote>(cacheKey);
    if (staleCache) {
      console.log(`Returning stale cache for ${symbol}`);
      return { ...staleCache, isStale: true } as any;
    }
    
    return null;
  }
}

export async function getQuotes(symbols: string[]): Promise<Quote[]> {
  // Separa símbolos BR de US para fazer requisições em lote eficientes
  const brSymbols = symbols.filter(isBrazilianSymbol);
  const usSymbols = symbols.filter(s => !isBrazilianSymbol(s));

  const quotes: Quote[] = [];

  // 1. Batch Brapi
  if (brSymbols.length > 0) {
    try {
      const { data } = await brapiClient.get(`/quote/${brSymbols.join(',')}`);
      if (data.results) {
        data.results.forEach((stock: any) => {
          quotes.push({
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
          });
        });
      }
    } catch (e) { console.error('Error batch Brapi', e); }
  }

  // 2. Batch Tiingo
  if (usSymbols.length > 0) {
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
    } catch (e) { console.error('Error batch Tiingo', e); }
  }

  return quotes;
}

/* ============================================
   DADOS DA EMPRESA / PERFIL
   ============================================ */

export async function getCompanyProfile(symbol: string): Promise<CompanyProfile | null> {
  const cacheKey = CACHE_KEYS.symbolInfo(symbol);
  const cached = await getCached<CompanyProfile>(cacheKey);
  if (cached) return cached;

  const isBr = isBrazilianSymbol(symbol);
  
  try {
    let profile: CompanyProfile;

    if (isBr) {
      // Na Brapi, o endpoint /quote já traz dados fundamentais básicos se fundamental=true
      // Não há endpoint separado de "profile" melhor no free tier
      const { data } = await brapiClient.get(`/quote/${symbol}`, { params: { fundamental: 'true' } });
      if (!data.results?.[0]) return null;
      
      const stock = data.results[0];
      // Brapi retorna summaryProfile se disponível
      profile = {
        symbol: stock.symbol,
        name: stock.longName || stock.shortName || stock.symbol,
        exchange: 'B3',
        industry: '', // Brapi free às vezes não preenche detalhado aqui
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
      // Tiingo Endpoint Meta (Daily)
      const { data } = await tiingoClient.get(`/daily/${symbol}`);
      if (!data) return null;

      profile = {
        symbol: data.ticker,
        name: data.name || data.ticker,
        exchange: data.exchangeCode || 'US',
        industry: '', // Tiingo Meta free é limitado
        sector: '',
        marketCap: 0, // Tiingo não manda MarketCap no endpoint meta free simples
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

/* ============================================
   BUSCA DE SÍMBOLOS (SEARCH)
   ============================================ */

export async function searchSymbols(query: string): Promise<SearchResult[]> {
  const cacheKey = CACHE_KEYS.symbolSearch(query);
  const cached = await getCached<SearchResult[]>(cacheKey);
  if (cached) return cached;

  // Executa busca em paralelo nas duas APIs
  try {
    const [brapiRes, tiingoRes] = await Promise.allSettled([
      brapiClient.get(`/quote/list`, { params: { search: query, limit: 5 } }),
      tiingoClient.get(`/tiingo/utilities/search`, { params: { query: query, limit: 5 } })
    ]);

    let results: SearchResult[] = [];

    // Processa Brapi
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

    // Processa Tiingo
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

/* ============================================
   NOTÍCIAS & MERCADO
   ============================================ */

// Usamos Tiingo principalmente para notícias pois tem cobertura global melhor em API
export async function getMarketNews(): Promise<NewsArticle[]> {
  const cacheKey = CACHE_KEYS.news();
  const cached = await getCached<NewsArticle[]>(cacheKey);
  if (cached) return cached;
  
  try {
    const { data } = await tiingoClient.get('/tiingo/news', { params: { limit: 15 } });
    
    const news = data.map((article: any) => ({
      id: article.id,
      headline: article.title,
      summary: article.description,
      source: article.source,
      url: article.url,
      image: '', // Tiingo não retorna imagem
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

// Índices: Mistura proxies BR e US
export async function getMarketIndices() {
  const cacheKey = CACHE_KEYS.indices();
  const cached = await getCached(cacheKey);
  if (cached) return cached;

  // IBOV (Brapi) + SPY/QQQ (Tiingo)
  try {
    const [ibovQuote] = await getQuotes(['^BVSP']); // Brapi entende ^BVSP
    const usQuotes = await getQuotes(['SPY', 'QQQ']); // Tiingo
    
    const indices = {
      ibovespa: ibovQuote || null,
      sp500: usQuotes.find(q => q.symbol === 'SPY') || null,
      nasdaq: usQuotes.find(q => q.symbol === 'QQQ') || null,
    };

    await setCached(cacheKey, indices, CACHE_TTL.MARKET_OVERVIEW);
    return indices;
  } catch (error) {
    return null;
  }
}

// Placeholder: Brapi e Tiingo free não possuem endpoints dedicados de "Top Gainers" fáceis
export async function getTopMovers() {
  return { gainers: [], losers: [] };
}

// Placeholder: Fundamentos profundos são pagos em ambos
export async function getBasicFinancials(symbol: string) {
  // Poderíamos extrair algo do getQuote da Brapi, mas para consistência retornamos null
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