// src/lib/env.ts (NOVO ARQUIVO)
import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url(),
  
  // Auth
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),
  
  // Market APIs (opcionais mas warning se ausentes)
  BRAPI_TOKEN: z.string().optional(),
  TIINGO_API_KEY: z.string().optional(),
  
  // Redis
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string(),
  
  // App
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'production', 'test']),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  
  if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(JSON.stringify(parsed.error.format(), null, 2));
    process.exit(1);
  }
  
  // Warnings para opcionais importantes
  if (!parsed.data.BRAPI_TOKEN && !parsed.data.TIINGO_API_KEY) {
    console.warn('⚠️ No market data API configured (BRAPI_TOKEN or TIINGO_API_KEY)');
  }
  
  return parsed.data;
}

export const env = validateEnv();