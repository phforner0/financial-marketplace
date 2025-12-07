import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ total: 0, totalAssets: 0 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        watchlists: {
          include: {
            items: true
          }
        }
      }
    });

    if (!user) return NextResponse.json({ total: 0, totalAssets: 0 });

    const totalWatchlists = user.watchlists.length;
    // Conta o total de ativos somando os itens de todas as listas
    const totalAssets = user.watchlists.reduce((acc, list) => acc + list.items.length, 0);

    return NextResponse.json({ 
      total: totalWatchlists, 
      totalAssets 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to count watchlists' }, { status: 500 });
  }
}