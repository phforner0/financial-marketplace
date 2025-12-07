// src/app/api/market/quote/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getQuote } from '@/lib/market-api';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      );
    }

    const quote = await getQuote(symbol.toUpperCase());

    if (!quote) {
      return NextResponse.json(
        { error: 'Quote not found for symbol: ' + symbol },
        { status: 404 }
      );
    }

    return NextResponse.json({ quote }, { status: 200 });
  } catch (error) {
    console.error('Error in quote route:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}