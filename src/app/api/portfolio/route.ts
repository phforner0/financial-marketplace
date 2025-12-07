import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Busca o portfolio principal do usuário
  const portfolio = await prisma.portfolio.findFirst({
    where: { 
      user: { email: session.user.email },
      type: 'PAPER' // MVP foca em Paper Trading
    },
    include: { positions: true }
  });

  if (!portfolio) {
    // Se não existir, cria um default
    // Nota: Normalmente isso ficaria no cadastro, mas aqui é um fail-safe
    return NextResponse.json({ totalValue: 0, cash: 0, positions: [] });
  }

  // Calcula totais
  // Nota: Em produção, você atualizaria os preços das posições aqui usando marketAPI
  const positionsValue = portfolio.positions.reduce((acc, pos) => acc + (pos.currentPrice || 0) * pos.qty, 0);
  const totalValue = (portfolio.cash || 0) + positionsValue;

  return NextResponse.json({
    id: portfolio.id,
    totalValue,
    cash: portfolio.cash,
    todayChange: 0, // Placeholder: requer cálculo complexo de histórico
    todayChangePercent: 0,
    positions: portfolio.positions
  });
}