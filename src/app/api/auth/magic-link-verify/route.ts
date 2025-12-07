// src/app/api/auth/magic-link-verify/route.ts (NOVO ARQUIVO)
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signIn } from 'next-auth/react';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(
        new URL('/auth/login?error=invalid_token', req.url)
      );
    }

    // Validar token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken || verificationToken.expires < new Date()) {
      return NextResponse.redirect(
        new URL('/auth/login?error=expired_token', req.url)
      );
    }

    if (verificationToken.type !== 'MAGIC_LINK') {
      return NextResponse.redirect(
        new URL('/auth/login?error=invalid_token_type', req.url)
      );
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier },
    });

    if (!user) {
      return NextResponse.redirect(
        new URL('/auth/login?error=user_not_found', req.url)
      );
    }

    // Deletar token
    await prisma.verificationToken.delete({
      where: { token },
    });

    // Criar sessão (redirecionar para página que faz signIn)
    const callbackUrl = user.onboardingCompleted 
      ? '/dashboard' 
      : '/auth/onboarding';

    return NextResponse.redirect(
      new URL(`/auth/magic-link-callback?email=${user.email}&callback=${callbackUrl}`, req.url)
    );
  } catch (error) {
    console.error('Magic link verify error:', error);
    return NextResponse.redirect(
      new URL('/auth/login?error=verification_failed', req.url)
    );
  }
}