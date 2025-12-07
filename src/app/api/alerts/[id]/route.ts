import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// DELETE: Remover Alerta
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const alert = await prisma.alert.findFirst({
    where: { 
      id: params.id,
      user: { email: session.user.email }
    }
  });

  if (!alert) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.alert.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}

// PATCH: Atualizar Alerta (Pausar/Editar)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  
  await prisma.alert.updateMany({
    where: { 
      id: params.id,
      user: { email: session.user.email }
    },
    data: body // Cuidado: validar campos em produção
  });

  return NextResponse.json({ success: true });
}