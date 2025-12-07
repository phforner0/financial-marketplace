import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// DELETE: Remover Watchlist
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verifica se pertence ao usuário antes de deletar
  const watchlist = await prisma.watchlist.findFirst({
    where: { 
      id: params.id,
      user: { email: session.user.email }
    }
  });

  if (!watchlist) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.watchlist.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}