// 6. src/app/api/user/onboarding/route.ts
// ========================================
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
  
      const body = await req.json();
      const { experience, objective, risk, horizon, interests } = body;
  
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          experience,
          objective,
          riskTolerance: risk,
          horizon,
          interests,
          onboardingCompleted: true
        }
      });
  
      // Create default watchlist
      await prisma.watchlist.create({
        data: {
          userId: session.user.id,
          name: 'My First Watchlist',
          description: 'Stocks I\'m interested in'
        }
      });
  
      // Create default portfolio
      await prisma.portfolio.create({
        data: {
          userId: session.user.id,
          name: 'My Portfolio',
          type: 'PAPER',
          isDefault: true,
          cash: 100000, // $100k paper money
          totalValue: 100000
        }
      });
  
      return NextResponse.json({ success: true });
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to save onboarding data' },
        { status: 500 }
      );
    }
  }