import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET: Listar Watchlists
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const watchlists = await prisma.watchlist.findMany({
    where: { user: { email: session.user.email } },
    include: { items: true }
  });

  return NextResponse.json(watchlists);
}

// POST: Criar Watchlist
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { name } = body;

  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });

  const watchlist = await prisma.watchlist.create({
    data: {
      name,
      userId: user!.id,
      items: { create: [] }
    }
  });

  return NextResponse.json(watchlist);
}