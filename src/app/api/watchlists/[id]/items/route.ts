// src/app/api/watchlists/[id]/items/route.ts (NOVO ARQUIVO)
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST: Adicionar item à watchlist
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { symbol, assetType } = await req.json();

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      );
    }

    // Verificar ownership
    const watchlist = await prisma.watchlist.findFirst({
      where: {
        id: params.id,
        user: { email: session.user.email },
      },
      include: { items: true },
    });

    if (!watchlist) {
      return NextResponse.json(
        { error: 'Watchlist not found' },
        { status: 404 }
      );
    }

    // Verificar se já existe
    const exists = watchlist.items.some(item => item.symbol === symbol);
    if (exists) {
      return NextResponse.json(
        { error: 'Symbol already in watchlist' },
        { status: 400 }
      );
    }

    // Adicionar item
    const item = await prisma.watchlistItem.create({
      data: {
        watchlistId: params.id,
        symbol,
        assetType: assetType || 'STOCK',
        order: watchlist.items.length,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error('Add item error:', error);
    return NextResponse.json(
      { error: 'Failed to add item' },
      { status: 500 }
    );
  }
}

// DELETE: Remover item da watchlist (via query param ?symbol=XYZ)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      );
    }

    // Verificar ownership
    const watchlist = await prisma.watchlist.findFirst({
      where: {
        id: params.id,
        user: { email: session.user.email },
      },
    });

    if (!watchlist) {
      return NextResponse.json(
        { error: 'Watchlist not found' },
        { status: 404 }
      );
    }

    // Remover item
    await prisma.watchlistItem.deleteMany({
      where: {
        watchlistId: params.id,
        symbol,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove item error:', error);
    return NextResponse.json(
      { error: 'Failed to remove item' },
      { status: 500 }
    );
  }
}