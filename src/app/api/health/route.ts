import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isHealthy as isRedisHealthy } from '@/lib/redis';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export async function GET() {
  try {
    // Check DB
    await prisma.$queryRaw`SELECT 1`;
    
    // Check Redis
    const redisOk = await isRedisHealthy();

    return NextResponse.json({ 
      status: 'ok', 
      database: 'connected',
      redis: redisOk ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    return NextResponse.json({ status: 'error', details: String(error) }, { status: 500 });
  }
}