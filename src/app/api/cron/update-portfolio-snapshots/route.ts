// src/app/api/cron/update-portfolio-snapshots/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { marketAPI } from '@/lib/market-api';
import { startOfDay } from 'date-fns';

export const dynamic = 'force-dynamic';

/**
 * Cron Job para criar snapshots diários dos portfolios
 * Deve rodar todo dia às 00:00 UTC (após o fechamento do mercado)
 * Configurar no vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/update-portfolio-snapshots",
 *     "schedule": "0 0 * * *"
 *   }]
 * }
 */
export async function GET() {
  try {
    console.log('🔄 Starting portfolio snapshots update...');

    // Busca todos os portfolios ativos
    const portfolios = await prisma.portfolio.findMany({
      where: { 
        type: 'PAPER' // Por enquanto só paper trading
      },
      include: {
        positions: {
          where: { qty: { gt: 0 } }
        },
        snapshots: {
          orderBy: { date: 'desc' },
          take: 1 // Pega último snapshot para comparação
        }
      }
    });

    console.log(`📊 Found ${portfolios.length} portfolios to update`);

    let successCount = 0;
    let errorCount = 0;

    for (const portfolio of portfolios) {
      try {
        // Verifica se já existe snapshot para hoje
        const today = startOfDay(new Date());
        const existingSnapshot = await prisma.portfolioSnapshot.findUnique({
          where: {
            portfolioId_date: {
              portfolioId: portfolio.id,
              date: today
            }
          }
        });

        if (existingSnapshot) {
          console.log(`⏭️  Snapshot já existe para portfolio ${portfolio.id}`);
          continue;
        }

        // Busca cotações atualizadas
        const symbols = portfolio.positions.map(p => p.symbol);
        const quotes = await marketAPI.getQuotes(symbols);
        const quoteMap = new Map(quotes.map(q => [q.symbol, q]));

        // Calcula valor total do portfolio
        let totalMarketValue = 0;
        
        for (const position of portfolio.positions) {
          const quote = quoteMap.get(position.symbol);
          const currentPrice = quote?.price || position.currentPrice || position.avgPrice || 0;
          const marketValue = currentPrice * position.qty;
          totalMarketValue += marketValue;

          // Atualiza preço atual da posição
          await prisma.position.update({
            where: { id: position.id },
            data: { currentPrice }
          });
        }

        const totalValue = (portfolio.cash || 0) + totalMarketValue;

        // Calcula P/L comparado com snapshot anterior
        const prevSnapshot = portfolio.snapshots[0];
        const pnl = prevSnapshot 
          ? totalValue - prevSnapshot.totalValue 
          : 0;
        
        const pnlPercent = prevSnapshot && prevSnapshot.totalValue > 0
          ? (pnl / prevSnapshot.totalValue) * 100
          : 0;

        // Cria novo snapshot
        await prisma.portfolioSnapshot.create({
          data: {
            portfolioId: portfolio.id,
            date: today,
            totalValue,
            cash: portfolio.cash || 0,
            pnl,
            pnlPercent
          }
        });

        // Atualiza totalValue no portfolio
        await prisma.portfolio.update({
          where: { id: portfolio.id },
          data: { totalValue }
        });

        successCount++;
        console.log(`✅ Snapshot criado para portfolio ${portfolio.id}: ${totalValue.toFixed(2)}`);

      } catch (error) {
        errorCount++;
        console.error(`❌ Erro ao processar portfolio ${portfolio.id}:`, error);
      }
    }

    console.log(`
      ✨ Snapshots update completed!
      ✅ Success: ${successCount}
      ❌ Errors: ${errorCount}
    `);

    return NextResponse.json({
      success: true,
      processed: portfolios.length,
      successCount,
      errorCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Cron Job Failed:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}