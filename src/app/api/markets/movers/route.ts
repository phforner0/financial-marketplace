// src/app/api/markets/movers/route.ts
import { NextResponse } from 'next/server';
import { marketAPI } from '@/lib/market-api';

export const dynamic = 'force-dynamic';
export const revalidate = 300;

export async function GET() {
  try {
    // Lista de ações para análise de movers (mix US + BR)
    const symbols = [
      // US Stocks
      'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META',
      'JPM', 'BAC', 'WMT', 'HD', 'DIS', 'NFLX', 'AMD', 'INTC',
      'COIN', 'MARA', 'PLTR', 'SOFI', 'RIVN',
      // BR Stocks (com .SA)
      'PETR4.SA', 'VALE3.SA', 'ITUB4.SA', 'BBDC4.SA', 'ABEV3.SA',
      'WEGE3.SA', 'MGLU3.SA', 'RENT3.SA', 'B3SA3.SA', 'EGIE3.SA'
    ];

    console.log('🔍 Fetching movers data...');

    const quotes = await marketAPI.getQuotes(symbols);
    
    console.log('📊 Quotes received:', quotes.length);

    // Filtra quotes válidos
    const validQuotes = quotes.filter(q => 
      q && 
      q.symbol && 
      q.price > 0 && 
      !isNaN(q.changePercent) &&
      q.changePercent !== 0
    );

    console.log('✅ Valid quotes:', validQuotes.length);

    // Ordena por variação percentual
    const sorted = [...validQuotes].sort((a, b) => b.changePercent - a.changePercent);

    const gainers = sorted.slice(0, 5).map(q => ({
      symbol: q.symbol.replace('.SA', ''),
      name: q.symbol.replace('.SA', ''),
      price: q.price,
      change: q.change,
      changePercent: q.changePercent,
      volume: q.volume,
      marketCap: q.volume || 0
    }));

    const losers = sorted.slice(-5).reverse().map(q => ({
      symbol: q.symbol.replace('.SA', ''),
      name: q.symbol.replace('.SA', ''),
      price: q.price,
      change: q.change,
      changePercent: q.changePercent,
      volume: q.volume,
      marketCap: q.volume || 0
    }));

    console.log('📈 Top Gainers:', gainers.map(g => `${g.symbol}: ${g.changePercent.toFixed(2)}%`));
    console.log('📉 Top Losers:', losers.map(l => `${l.symbol}: ${l.changePercent.toFixed(2)}%`));

    return NextResponse.json({ gainers, losers });
  } catch (error) {
    console.error('❌ Movers API Error:', error);
    return NextResponse.json(
      { 
        gainers: [], 
        losers: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}