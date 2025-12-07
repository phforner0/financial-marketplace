// src/app/api/portfolio/history/route.ts - HISTÓRICO PARA GRÁFICOS
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { startOfDay, subDays, subMonths, subYears } from 'date-fns';

export const dynamic = 'force-dynamic';

interface HistoryDataPoint {
  date: string;
  totalValue: number;
  cash: number;
  invested: number;
  pnl: number;
  pnlPercent: number;
  benchmark?: number; // S&P 500 para comparação
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const timeframe = searchParams.get('timeframe') || '1M';

  try {
    const portfolio = await prisma.portfolio.findFirst({
      where: { 
        user: { email: session.user.email },
        type: 'PAPER'
      }
    });

    if (!portfolio) {
      return NextResponse.json([]);
    }

    // Determina data de início baseado no timeframe
    let startDate = new Date();
    switch (timeframe) {
      case '1D':
        startDate = subDays(new Date(), 1);
        break;
      case '1W':
        startDate = subDays(new Date(), 7);
        break;
      case '1M':
        startDate = subMonths(new Date(), 1);
        break;
      case '3M':
        startDate = subMonths(new Date(), 3);
        break;
      case '6M':
        startDate = subMonths(new Date(), 6);
        break;
      case '1Y':
        startDate = subYears(new Date(), 1);
        break;
      case 'ALL':
        startDate = new Date(2020, 0, 1); // Início arbitrário
        break;
    }

    // Busca snapshots no período
    const snapshots = await prisma.portfolioSnapshot.findMany({
      where: {
        portfolioId: portfolio.id,
        date: { gte: startOfDay(startDate) }
      },
      orderBy: { date: 'asc' }
    });

    // Se não há snapshots, cria um ponto com o valor atual
    if (snapshots.length === 0) {
      return NextResponse.json([{
        date: new Date().toISOString(),
        totalValue: portfolio.totalValue || 0,
        cash: portfolio.cash || 0,
        invested: (portfolio.totalValue || 0) - (portfolio.cash || 0),
        pnl: 0,
        pnlPercent: 0
      }]);
    }

    // Converte snapshots para formato do gráfico
    const initialValue = snapshots[0]?.totalValue || 0;

    const historyData: HistoryDataPoint[] = snapshots.map(snapshot => {
      const pnl = (snapshot.pnl || 0);
      const pnlPercent = (snapshot.pnlPercent || 0);

      return {
        date: snapshot.date.toISOString(),
        totalValue: snapshot.totalValue,
        cash: snapshot.cash,
        invested: snapshot.totalValue - snapshot.cash,
        pnl,
        pnlPercent
      };
    });

    // TODO: Buscar dados do S&P 500 para benchmark
    // Por enquanto, gera benchmark simulado (+10% anual)
    const benchmarkMultiplier = 1.10; // 10% ao ano
    historyData.forEach((point, i) => {
      const daysElapsed = i + 1;
      const dailyReturn = Math.pow(benchmarkMultiplier, daysElapsed / 365);
      point.benchmark = initialValue * dailyReturn;
    });

    return NextResponse.json(historyData);

  } catch (error) {
    console.error('Portfolio History Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio history' },
      { status: 500 }
    );
  }
}