import { NextResponse } from 'next/server';
import { marketAPI } from '@/lib/market-api';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export async function GET() {
  try {
    const indices = await marketAPI.getMarketIndices();
    return NextResponse.json(indices);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch indices' }, { status: 500 });
  }
}