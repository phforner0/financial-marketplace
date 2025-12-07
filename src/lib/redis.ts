// src/lib/redis.ts
import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/* ============================================
   CACHE LAYERS (TTL in seconds)
   ============================================ */

export const CACHE_TTL = {
  // Hot data (30s)
  QUOTE: 30,
  ORDERBOOK: 30,
  
  // Warm data (5min)
  MARKET_OVERVIEW: 300,
  TOP_MOVERS: 300,
  NEWS_FEED: 300,
  
  // Cold data (1h)
  COMPANY_INFO: 3600,
  HISTORICAL_DATA: 3600,
  ANALYST_RATINGS: 3600,
  
  // Static (24h)
  SYMBOL_SEARCH: 86400,
  GLOSSARY: 86400,
} as const;

/* ============================================
   CACHE KEYS
   ============================================ */

export const CACHE_KEYS = {
  // Quotes
  quote: (symbol: string) => `quote:${symbol}`,
  quoteMultiple: (symbols: string[]) => `quotes:${symbols.sort().join(',')}`,
  
  // Market data
  marketOverview: () => 'market:overview',
  indices: () => 'market:indices',
  topMovers: (timeframe: string) => `market:movers:${timeframe}`,
  mostActive: () => 'market:active',
  
  // Symbol info
  symbolInfo: (symbol: string) => `symbol:info:${symbol}`,
  symbolSearch: (query: string) => `symbol:search:${query.toLowerCase()}`,
  
  // News
  news: (symbol?: string) => symbol ? `news:${symbol}` : 'news:all',
  
  // User-specific (include userId)
  userPortfolio: (userId: string) => `user:${userId}:portfolio`,
  userWatchlists: (userId: string) => `user:${userId}:watchlists`,
  userAlerts: (userId: string) => `user:${userId}:alerts`,
  
  // Rate limiting
  rateLimit: (identifier: string, action: string) => `ratelimit:${action}:${identifier}`,
} as const;

/* ============================================
   CORE CACHE FUNCTIONS
   ============================================ */

/**
 * Get value from cache
 */
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const value = await redis.get<T>(key);
    return value;
  } catch (error) {
    console.error(`Redis GET error for key ${key}:`, error);
    return null;
  }
}

/**
 * Set value in cache with TTL
 */
export async function setCached<T>(
  key: string,
  value: T,
  ttl: number
): Promise<void> {
  try {
    await redis.set(key, value, { ex: ttl });
  } catch (error) {
    console.error(`Redis SET error for key ${key}:`, error);
  }
}

/**
 * Delete value from cache
 */
export async function deleteCached(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (error) {
    console.error(`Redis DEL error for key ${key}:`, error);
  }
}

/**
 * Delete multiple keys by pattern
 */
export async function deletePattern(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error(`Redis pattern delete error for ${pattern}:`, error);
  }
}

/**
 * Check if key exists
 */
export async function exists(key: string): Promise<boolean> {
  try {
    const result = await redis.exists(key);
    return result === 1;
  } catch (error) {
    console.error(`Redis EXISTS error for key ${key}:`, error);
    return false;
  }
}

/* ============================================
   CACHE-ASIDE PATTERN
   ============================================ */

/**
 * Get from cache or fetch from source
 */
export async function getOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number
): Promise<T> {
  // Try to get from cache
  const cached = await getCached<T>(key);
  if (cached !== null) {
    return cached;
  }
  
  // Fetch from source
  const fresh = await fetcher();
  
  // Store in cache
  await setCached(key, fresh, ttl);
  
  return fresh;
}

/* ============================================
   RATE LIMITING
   ============================================ */

/**
 * Rate limit with sliding window
 * Returns true if rate limit exceeded
 */
export async function isRateLimited(
  identifier: string,
  action: string,
  maxRequests: number,
  windowSeconds: number
): Promise<boolean> {
  const key = CACHE_KEYS.rateLimit(identifier, action);
  
  try {
    const count = await redis.incr(key);
    
    // Set expiry on first request
    if (count === 1) {
      await redis.expire(key, windowSeconds);
    }
    
    return count > maxRequests;
  } catch (error) {
    console.error('Rate limit check error:', error);
    return false; // Fail open
  }
}

/**
 * Get remaining rate limit
 */
export async function getRateLimitRemaining(
  identifier: string,
  action: string,
  maxRequests: number
): Promise<number> {
  const key = CACHE_KEYS.rateLimit(identifier, action);
  
  try {
    const count = await redis.get<number>(key);
    return Math.max(0, maxRequests - (count || 0));
  } catch (error) {
    console.error('Rate limit check error:', error);
    return maxRequests; // Fail open
  }
}

/* ============================================
   BULK OPERATIONS
   ============================================ */

/**
 * Get multiple values at once
 */
export async function mget<T extends unknown[]>(keys: string[]): Promise<(T | null)[]> {
    try {
      const results = await redis.mget<T>(...keys);
      
      if (!results) {
        return keys.map(() => null);
      }
      
      // Redis mget retorna array, mas pode ter valores null
      return results as (T | null)[];
    } catch (error) {
      console.error('Redis MGET error:', error);
      return keys.map(() => null);
    }
  }
  
  /**
   * Set multiple values at once
   */
  export async function mset(entries: Record<string, unknown>): Promise<void> {
    try {
      // Note: Upstash Redis mset doesn't support TTL
      // Use pipeline for TTL support
      const pipeline = redis.pipeline();
      Object.entries(entries).forEach(([key, value]) => {
        pipeline.set(key, value);
      });
      await pipeline.exec();
    } catch (error) {
      console.error('Redis MSET error:', error);
    }
  }

/* ============================================
   INVALIDATION HELPERS
   ============================================ */

/**
 * Invalidate user-specific cache
 */
export async function invalidateUserCache(userId: string): Promise<void> {
  await Promise.all([
    deleteCached(CACHE_KEYS.userPortfolio(userId)),
    deleteCached(CACHE_KEYS.userWatchlists(userId)),
    deleteCached(CACHE_KEYS.userAlerts(userId)),
  ]);
}

/**
 * Invalidate symbol cache
 */
export async function invalidateSymbolCache(symbol: string): Promise<void> {
  await Promise.all([
    deleteCached(CACHE_KEYS.quote(symbol)),
    deleteCached(CACHE_KEYS.symbolInfo(symbol)),
    deleteCached(CACHE_KEYS.news(symbol)),
  ]);
}

/**
 * Invalidate market overview cache
 */
export async function invalidateMarketCache(): Promise<void> {
  await Promise.all([
    deleteCached(CACHE_KEYS.marketOverview()),
    deleteCached(CACHE_KEYS.indices()),
    deletePattern('market:movers:*'),
    deleteCached(CACHE_KEYS.mostActive()),
  ]);
}

/* ============================================
   HEALTH CHECK
   ============================================ */

/**
 * Check if Redis is healthy
 */
export async function isHealthy(): Promise<boolean> {
  try {
    await redis.ping();
    return true;
  } catch (error) {
    console.error('Redis health check failed:', error);
    return false;
  }
}

export default redis;