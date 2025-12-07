// src/app/api/cron/check-alerts/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getQuote } from '@/lib/market-api';

// Configuração para Vercel Cron
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    // 1. Buscar alertas ativos
    // No schema o status é Enum 'ACTIVE'
    const activeAlerts = await prisma.alert.findMany({
      where: {
        status: 'ACTIVE',
        // Opcional: filtrar por data de expiração se necessário
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      include: {
        user: {
          select: { email: true, id: true } // Pegamos email para notificação futura
        }
      }
    });

    const triggeredResults = [];

    // 2. Processar cada alerta
    for (const alert of activeAlerts) {
      if (!alert.symbol) continue;

      // Busca cotação em tempo real
      const quote = await getQuote(alert.symbol);
      
      // Se falhar ou API cair, pula sem travar o cron
      if (!quote) continue;

      let triggered = false;
      const currentPrice = quote.price;

      // === LÓGICA CORRIGIDA BASEADA NO SCHEMA ===
      
      // Tipo 1: Alerta de Preço (PRICE)
      if (alert.type === 'PRICE' && alert.priceThreshold !== null) {
        // Se directionUp for true, dispara quando preço SUBIR acima do threshold
        if (alert.directionUp === true && currentPrice >= alert.priceThreshold) {
          triggered = true;
        }
        // Se directionUp for false, dispara quando preço CAIR abaixo do threshold
        else if (alert.directionUp === false && currentPrice <= alert.priceThreshold) {
          triggered = true;
        }
      }

      // Tipo 2: Alerta de Variação (PERCENTAGE) - Exemplo básico
      // (Requer lógica para saber o preço inicial de comparação, usando changePercent do dia por enquanto)
      else if (alert.type === 'PERCENTAGE' && alert.percentChange !== null) {
        if (Math.abs(quote.changePercent) >= alert.percentChange) {
           triggered = true;
        }
      }

      // 3. Ações se disparado
      if (triggered) {
        console.log(`🔥 Alert Triggered: ${alert.symbol} @ ${currentPrice}`);

        // A. Registrar no Histórico
        await prisma.alertHistory.create({
          data: {
            alertId: alert.id,
            triggeredAt: new Date(),
            price: currentPrice, // Campo 'price' existe no AlertHistory do seu schema
            // volume: quote.volume, // Opcional se quiser salvar volume
            metadata: { 
              triggerPrice: currentPrice,
              threshold: alert.priceThreshold,
              type: alert.type,
              direction: alert.directionUp ? 'UP' : 'DOWN'
            } 
          }
        });

        // B. Atualizar Status do Alerta
        // Se não for recorrente, marca como TRIGGERED
        if (!alert.recurring) {
          await prisma.alert.update({
            where: { id: alert.id },
            data: { status: 'TRIGGERED' } 
          });
        } else {
          // Se for recorrente, apenas atualiza lastTriggered
          await prisma.alert.update({
            where: { id: alert.id },
            data: { 
              lastTriggered: new Date(),
              triggerCount: { increment: 1 }
            }
          });
        }

        triggeredResults.push({
          alertId: alert.id,
          symbol: alert.symbol,
          price: currentPrice,
          user: alert.user.email
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: activeAlerts.length,
      triggeredCount: triggeredResults.length,
      triggered: triggeredResults
    });

  } catch (error) {
    console.error('Cron Job Failed:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}