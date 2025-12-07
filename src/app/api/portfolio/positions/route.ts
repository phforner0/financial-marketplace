import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { marketAPI } from '@/lib/market-api';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    // 1. Busca portfolio e posições do DB
    const portfolio = await prisma.portfolio.findFirst({
      where: { 
        user: { email: session.user.email },
        type: 'PAPER'
      },
      include: { positions: true }
    });

    if (!portfolio || portfolio.positions.length === 0) {
      return NextResponse.json([]);
    }

    // 2. Busca preços atuais em tempo real (Brapi/Tiingo)
    const symbols = portfolio.positions.map(p => p.symbol);
    const quotes = await marketAPI.getQuotes(symbols);
    
    // Mapa para acesso rápido
    const priceMap = new Map(quotes.map(q => [q.symbol, q]));

    // 3. Calcula P/L atualizado
    const positionsWithLiveMetrics = portfolio.positions.map(pos => {
        const liveQuote = priceMap.get(pos.symbol);
        const currentPrice = liveQuote?.price || pos.avgPrice || 0; // Fallback se falhar API
        const marketValue = currentPrice * pos.qty;
        const profitLoss = marketValue - (pos.avgPrice || 0) * pos.qty;
        const profitLossPercent = pos.avgPrice ? (profitLoss / ((pos.avgPrice * pos.qty) || 1)) * 100 : 0;

        return {
            ...pos,
            currentPrice,
            value: marketValue,
            profitLoss,
            profitLossPercent
        };
    });

    return NextResponse.json(positionsWithLiveMetrics);

  } catch (error) {
    console.error('Portfolio Positions Error:', error);
    return NextResponse.json({ error: 'Failed to fetch positions' }, { status: 500 });
  }
}