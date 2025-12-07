import { NextResponse } from 'next/server';
import { marketAPI } from '@/lib/market-api';

// Cache de 5 minutos
export const dynamic = 'force-dynamic';
export const revalidate = 300;

export async function GET() {
  try {
    // Como não temos endpoint de "market movers" gratuito, simulamos com uma lista fixa
    const symbols = ['NVDA', 'TSLA', 'AMD', 'PLTR', 'COIN', 'MARA', 'AAPL', 'MSFT', 'AMZN', 'GOOGL'];
    const quotes = await marketAPI.getQuotes(symbols);

    const sorted = quotes.sort((a, b) => b.changePercent - a.changePercent);
    
    return NextResponse.json({
      gainers: sorted.slice(0, 5),
      losers: sorted.reverse().slice(0, 5) // Inverte para pegar os piores
    });
  } catch (e) {
    return NextResponse.json({ gainers: [], losers: [] });
  }
}