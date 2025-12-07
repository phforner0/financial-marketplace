// src/app/api/portfolio/route.ts - VERSÃO COMPLETA COM MÉTRICAS REAIS
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { marketAPI } from '@/lib/market-api';

export const dynamic = 'force-dynamic';

interface PortfolioMetrics {
  id: string;
  totalValue: number;
  cash: number;
  invested: number;
  todayChange: number;
  todayChangePercent: number;
  totalReturn: number;
  totalReturnPercent: number;
  positions: Array<{
    id: string;
    symbol: string;
    qty: number;
    avgPrice: number;
    currentPrice: number;
    marketValue: number;
    unrealizedPL: number;
    unrealizedPLPercent: number;
    dayChange: number;
    dayChangePercent: number;
    allocation: number;
  }>;
  allocation: {
    byAssetType: Record<string, number>;
    bySector: Record<string, { value: number; symbols: string[] }>;
  };
  performance: {
    bestDay: { date: string; change: number; changePercent: number };
    worstDay: { date: string; change: number; changePercent: number };
    winRate: number;
    totalTrades: number;
    bestPerformer: { symbol: string; return: number };
    worstPerformer: { symbol: string; return: number };
    biggestHolding: { symbol: string; value: number };
  };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Busca Portfolio + Positions + Transactions
    const portfolio = await prisma.portfolio.findFirst({
      where: { 
        user: { email: session.user.email },
        type: 'PAPER'
      },
      include: { 
        positions: {
          where: { qty: { gt: 0 } }
        }
      }
    });

    if (!portfolio) {
      return NextResponse.json({
        id: null,
        totalValue: 0,
        cash: 0,
        invested: 0,
        todayChange: 0,
        todayChangePercent: 0,
        totalReturn: 0,
        totalReturnPercent: 0,
        positions: [],
        allocation: { byAssetType: {}, bySector: {} },
        performance: {
          bestDay: null,
          worstDay: null,
          winRate: 0,
          totalTrades: 0,
          bestPerformer: null,
          worstPerformer: null,
          biggestHolding: null
        }
      });
    }

    // 2. Busca cotações em tempo real
    const symbols = portfolio.positions.map(p => p.symbol);
    const quotes = await marketAPI.getQuotes(symbols);
    const quoteMap = new Map(quotes.map(q => [q.symbol, q]));

    // 3. Calcula métricas de cada posição
    let totalMarketValue = 0;
    let totalDayChange = 0;
    let totalInvested = 0;

    const enrichedPositions = portfolio.positions.map(pos => {
      const quote = quoteMap.get(pos.symbol);
      const currentPrice = quote?.price || pos.currentPrice || pos.avgPrice || 0;
      const dayChange = quote?.change || 0;
      
      const marketValue = currentPrice * pos.qty;
      const costBasis = (pos.avgPrice || 0) * pos.qty;
      const unrealizedPL = marketValue - costBasis;
      const unrealizedPLPercent = costBasis > 0 ? (unrealizedPL / costBasis) * 100 : 0;
      
      const positionDayChange = dayChange * pos.qty;
      const dayChangePercent = (currentPrice - dayChange) > 0 
        ? (dayChange / (currentPrice - dayChange)) * 100 
        : 0;

      totalMarketValue += marketValue;
      totalDayChange += positionDayChange;
      totalInvested += costBasis;

      return {
        id: pos.id,
        symbol: pos.symbol,
        qty: pos.qty,
        avgPrice: pos.avgPrice || 0,
        currentPrice,
        marketValue,
        unrealizedPL,
        unrealizedPLPercent,
        dayChange: positionDayChange,
        dayChangePercent,
        allocation: 0 // Será calculado depois
      };
    });

    // 4. Calcula alocação percentual
    enrichedPositions.forEach(pos => {
      pos.allocation = totalMarketValue > 0 
        ? (pos.marketValue / totalMarketValue) * 100 
        : 0;
    });

    // 5. Calcula alocação por tipo de ativo
    const allocationByType: Record<string, number> = {
      STOCKS: 0,
      CRYPTO: 0,
      ETF: 0,
      CASH: portfolio.cash || 0
    };

    portfolio.positions.forEach(pos => {
      const marketValue = enrichedPositions.find(p => p.id === pos.id)?.marketValue || 0;
      const type = pos.assetType || 'STOCKS';
      allocationByType[type] = (allocationByType[type] || 0) + marketValue;
    });

    // 6. Busca informações de setor para alocação
    const allocationBySector: Record<string, { value: number; symbols: string[] }> = {};
    
    for (const pos of enrichedPositions) {
      const symbolInfo = await marketAPI.getCompanyProfile(pos.symbol);
      const sector = symbolInfo?.sector || 'Other';
      
      if (!allocationBySector[sector]) {
        allocationBySector[sector] = { value: 0, symbols: [] };
      }
      
      allocationBySector[sector].value += pos.marketValue;
      allocationBySector[sector].symbols.push(pos.symbol);
    }

    // 7. Busca snapshots para calcular performance histórica
    const snapshots = await prisma.portfolioSnapshot.findMany({
      where: { portfolioId: portfolio.id },
      orderBy: { date: 'desc' },
      take: 365 // 1 ano de histórico
    });

    let bestDay = { date: '', change: 0, changePercent: 0 };
    let worstDay = { date: '', change: 0, changePercent: 0 };

    snapshots.forEach((snapshot, i) => {
      if (i === 0) return; // Skip primeiro
      
      const prevSnapshot = snapshots[i - 1];
      const change = snapshot.totalValue - prevSnapshot.totalValue;
      const changePercent = prevSnapshot.totalValue > 0 
        ? (change / prevSnapshot.totalValue) * 100 
        : 0;

      if (change > bestDay.change) {
        bestDay = {
          date: snapshot.date.toISOString(),
          change,
          changePercent
        };
      }

      if (change < worstDay.change) {
        worstDay = {
          date: snapshot.date.toISOString(),
          change,
          changePercent
        };
      }
    });

    // 8. Calcula estatísticas de trading
    const transactions = await prisma.transaction.findMany({
      where: { 
        userId: portfolio.userId,
        type: { in: ['BUY', 'SELL'] }
      },
      orderBy: { executedAt: 'desc' }
    });

    const totalTrades = transactions.length;
    const profitableTrades = transactions.filter(t => {
      // Lógica simplificada - em produção seria mais complexa
      return t.type === 'SELL' && (t.amount || 0) > 0;
    }).length;

    const winRate = totalTrades > 0 ? (profitableTrades / totalTrades) * 100 : 0;

    // 9. Identifica melhores/piores performers
    const sortedByReturn = [...enrichedPositions].sort(
      (a, b) => b.unrealizedPLPercent - a.unrealizedPLPercent
    );

    const bestPerformer = sortedByReturn[0] 
      ? { symbol: sortedByReturn[0].symbol, return: sortedByReturn[0].unrealizedPLPercent }
      : null;

    const worstPerformer = sortedByReturn[sortedByReturn.length - 1]
      ? { symbol: sortedByReturn[sortedByReturn.length - 1].symbol, return: sortedByReturn[sortedByReturn.length - 1].unrealizedPLPercent }
      : null;

    const biggestHolding = enrichedPositions.length > 0
      ? enrichedPositions.reduce((max, pos) => pos.marketValue > max.marketValue ? pos : max)
      : null;

    // 10. Calcula métricas totais
    const totalValue = (portfolio.cash || 0) + totalMarketValue;
    const totalReturn = totalMarketValue - totalInvested + (portfolio.realizedPL || 0);
    const totalReturnPercent = totalInvested > 0 
      ? (totalReturn / totalInvested) * 100 
      : 0;

    const todayChangePercent = (totalMarketValue - totalDayChange) > 0
      ? (totalDayChange / (totalMarketValue - totalDayChange)) * 100
      : 0;

    // 11. Monta resposta completa
    const response: PortfolioMetrics = {
      id: portfolio.id,
      totalValue,
      cash: portfolio.cash || 0,
      invested: totalInvested,
      todayChange: totalDayChange,
      todayChangePercent,
      totalReturn,
      totalReturnPercent,
      positions: enrichedPositions,
      allocation: {
        byAssetType: allocationByType,
        bySector: allocationBySector
      },
      performance: {
        bestDay: bestDay.change !== 0 ? bestDay : null,
        worstDay: worstDay.change !== 0 ? worstDay : null,
        winRate,
        totalTrades,
        bestPerformer,
        worstPerformer,
        biggestHolding: biggestHolding 
          ? { symbol: biggestHolding.symbol, value: biggestHolding.marketValue }
          : null
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Portfolio API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio data' },
      { status: 500 }
    );
  }
}