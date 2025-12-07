// src/app/api/auth/complete-tour/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { tourCompleted: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error completing tour:', error);
    return NextResponse.json(
      { error: 'Failed to complete tour' },
      { status: 500 }
    );
  }
}