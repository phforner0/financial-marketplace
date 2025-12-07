import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ total: 0, active: 0 });
  }

  try {
    const alerts = await prisma.alert.findMany({
      where: { user: { email: session.user.email } }
    });

    const active = alerts.filter(a => a.status === 'ACTIVE').length;

    return NextResponse.json({ 
      total: alerts.length, 
      active 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to count alerts' }, { status: 500 });
  }
}