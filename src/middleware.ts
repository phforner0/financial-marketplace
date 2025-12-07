// src/middleware.ts - ADICIONAR rate limiting
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isRateLimited } from './lib/redis';

// Rate limits por rota
const RATE_LIMITS = {
  '/api/markets': { max: 100, window: 60 }, // 100 req/min
  '/api/broker/orders': { max: 10, window: 60 }, // 10 req/min
  '/api/auth': { max: 20, window: 300 }, // 20 req/5min
} as const;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Verificar se rota precisa rate limiting
  const rateLimit = Object.entries(RATE_LIMITS).find(([path]) => 
    pathname.startsWith(path)
  );
  
  if (rateLimit) {
    const [path, { max, window }] = rateLimit;
    
    // Usar IP ou user ID como identificador
    const identifier = request.ip || 
                      request.headers.get('x-forwarded-for') || 
                      'anonymous';
    
    const limited = await isRateLimited(
      identifier,
      path,
      max,
      window
    );
    
    if (limited) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded', 
          retryAfter: window,
        },
        { 
          status: 429,
          headers: {
            'Retry-After': window.toString(),
            'X-RateLimit-Limit': max.toString(),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/markets/:path*',
    '/api/broker/:path*',
    '/api/auth/:path*',
  ],
};