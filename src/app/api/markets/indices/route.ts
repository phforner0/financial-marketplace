import { NextResponse } from 'next/server';
import { marketAPI } from '@/lib/market-api';

export const revalidate = 60; // Cache por 60 segundos no CDN da Vercel

export async function GET() {
  try {
    const indices = await marketAPI.getMarketIndices();
    return NextResponse.json(indices);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch indices' }, { status: 500 });
  }
}