// src/app/api/markets/heatmap/route.ts
import { NextResponse } from 'next/server';
import { marketAPI } from '@/lib/market-api';

export const dynamic = 'force-dynamic';
export const revalidate = 300;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '1D';

    // Lista expandida de ativos para o heatmap
    const symbols = [
      // US Tech Giants
      'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA',
      // US Finance
      'JPM', 'BAC', 'GS', 'WFC', 'C',
      // US Consumer
      'WMT', 'HD', 'MCD', 'NKE', 'SBUX',
      // US Healthcare
      'JNJ', 'UNH', 'PFE', 'ABBV',
      // BR Blue Chips (Brapi precisa do sufixo .SA)
      'PETR4.SA', 'VALE3.SA', 'ITUB4.SA', 'BBDC4.SA', 'ABEV3.SA',
      'WEGE3.SA', 'RENT3.SA', 'MGLU3.SA', 'B3SA3.SA'
    ];

    console.log('🔍 Fetching heatmap data for symbols:', symbols);

    // Busca as cotações
    const quotes = await marketAPI.getQuotes(symbols);
    
    console.log('📊 Quotes received:', quotes.length);

    // Filtra apenas quotes válidos
    const validQuotes = quotes.filter(q => 
      q && q.symbol && q.price > 0 && !isNaN(q.changePercent)
    );

    console.log('✅ Valid quotes:', validQuotes.length);

    // Mapeia para o formato do heatmap com setores
    const heatmapData = validQuotes.map(q => {
      let sector = 'Technology';
      const symbol = q.symbol.replace('.SA', '');

      // US Stocks
      if (['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA'].includes(symbol)) {
        sector = 'Technology';
      } else if (['TSLA'].includes(symbol)) {
        sector = 'Automotive';
      } else if (['JPM', 'BAC', 'GS', 'WFC', 'C'].includes(symbol)) {
        sector = 'Finance';
      } else if (['WMT', 'HD', 'MCD', 'NKE', 'SBUX'].includes(symbol)) {
        sector = 'Consumer';
      } else if (['JNJ', 'UNH', 'PFE', 'ABBV'].includes(symbol)) {
        sector = 'Healthcare';
      }
      // BR Stocks
      else if (['PETR4', 'VALE3'].includes(symbol)) {
        sector = 'Energy & Materials';
      } else if (['ITUB4', 'BBDC4', 'B3SA3'].includes(symbol)) {
        sector = 'Finance';
      } else if (['ABEV3', 'MGLU3', 'RENT3'].includes(symbol)) {
        sector = 'Consumer';
      } else if (['WEGE3'].includes(symbol)) {
        sector = 'Industrial';
      }

      return {
        symbol: symbol,
        name: symbol,
        sector: sector,
        marketCap: q.volume || 1000000,
        changePercent: q.changePercent,
        price: q.price
      };
    });

    console.log('📈 Heatmap data prepared:', heatmapData.length, 'items');

    return NextResponse.json(heatmapData);
  } catch (error) {
    console.error('❌ Heatmap API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate heatmap', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}