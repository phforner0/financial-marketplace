// src/app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/email'; // ← Usar novo helper

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    const user = await prisma.user.findUnique({
      where: { email }
    });

    // Sempre retorna sucesso (segurança - não revela se email existe)
    if (!user) {
      return NextResponse.json({ success: true });
    }

    // Gera reset token
    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        type: 'PASSWORD_RESET',
        expires
      }
    });

    // Envia email (mock em desenvolvimento)
    await sendPasswordResetEmail(email, token);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}