import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  try {
    const whereClause: any = {
      user: { email: session.user.email }
    };

    if (symbol) {
      whereClause.symbol = symbol;
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      orderBy: { executedAt: 'desc' },
      take: 50 // Limite para paginação simples
    });

    return NextResponse.json(transactions);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}