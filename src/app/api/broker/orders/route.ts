import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { marketAPI } from '@/lib/market-api';

// POST: Criar Ordem (Buy/Sell)
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { symbol, side, qty, type } = body; // side: 'BUY' | 'SELL'

    if (!symbol || !qty || !side) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { portfolios: true }
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Pega portfolio de papel
    let portfolio = user.portfolios.find(p => p.type === 'PAPER');
    if (!portfolio) {
        // Cria se não existir
        portfolio = await prisma.portfolio.create({
            data: { userId: user.id, name: 'Paper Portfolio', type: 'PAPER', cash: 100000 }
        });
    }

    // 1. Pega preço atual
    const quote = await marketAPI.getQuote(symbol);
    if (!quote) return NextResponse.json({ error: 'Market closed or symbol invalid' }, { status: 400 });

    const price = quote.price;
    const totalCost = price * qty;

    // 2. Validações
    if (side === 'BUY') {
        if ((portfolio.cash || 0) < totalCost) {
            return NextResponse.json({ error: 'Insufficient funds' }, { status: 400 });
        }
    } else if (side === 'SELL') {
        // Verifica se tem a posição
        const position = await prisma.position.findUnique({
            where: { portfolioId_symbol: { portfolioId: portfolio.id, symbol } }
        });
        if (!position || position.qty < qty) {
            return NextResponse.json({ error: 'Insufficient shares' }, { status: 400 });
        }
    }

    // 3. Executa a transação (Simulação Atômica)
    const result = await prisma.$transaction(async (tx) => {
        // Atualiza Cash
        const cashChange = side === 'BUY' ? -totalCost : totalCost;
        await tx.portfolio.update({
            where: { id: portfolio!.id },
            data: { cash: { increment: cashChange } }
        });

        // Cria/Atualiza Posição
        const existingPos = await tx.position.findUnique({
            where: { portfolioId_symbol: { portfolioId: portfolio!.id, symbol } }
        });

        if (side === 'BUY') {
            if (existingPos) {
                // Preço médio ponderado
                const newQty = existingPos.qty + qty;
                const newAvg = ((existingPos.avgPrice || 0) * existingPos.qty + totalCost) / newQty;
                await tx.position.update({
                    where: { id: existingPos.id },
                    data: { qty: newQty, avgPrice: newAvg }
                });
            } else {
                await tx.position.create({
                    data: {
                        portfolioId: portfolio!.id,
                        symbol,
                        qty,
                        avgPrice: price,
                        assetType: 'STOCK'
                    }
                });
            }
        } else {
            // SELL
            const newQty = existingPos!.qty - qty;
            if (newQty === 0) {
                await tx.position.delete({ where: { id: existingPos!.id } });
            } else {
                await tx.position.update({
                    where: { id: existingPos!.id },
                    data: { qty: newQty }
                });
            }
        }

        // Registra Transação
        const transaction = await tx.transaction.create({
            data: {
                userId: user!.id,
                portfolioId: portfolio!.id,
                type: side,
                symbol,
                qty,
                price,
                amount: totalCost,
                description: `${side} ${qty} ${symbol} @ $${price}`
            }
        });

        return transaction;
    });

    return NextResponse.json({ success: true, transaction: result });

  } catch (error) {
    console.error('Trade Error:', error);
    return NextResponse.json({ error: 'Trade failed' }, { status: 500 });
  }
}