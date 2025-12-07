import { NextResponse } from 'next/server';
import { marketAPI } from '@/lib/market-api';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const results = await marketAPI.searchSymbols(q);
    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}