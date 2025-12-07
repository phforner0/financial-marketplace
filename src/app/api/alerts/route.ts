import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const alerts = await prisma.alert.findMany({
    where: { user: { email: session.user.email } },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json(alerts);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { symbol, type, priceThreshold, directionUp } = body;

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });

  const alert = await prisma.alert.create({
    data: {
      userId: user!.id,
      symbol: symbol.toUpperCase(),
      type: type || 'PRICE',
      priceThreshold: parseFloat(priceThreshold),
      directionUp,
      status: 'ACTIVE'
    }
  });

  return NextResponse.json(alert);
}