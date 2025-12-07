// src/app/api/auth/magic-link/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendMagicLinkEmail } from '@/lib/email'; // ← Usar novo helper

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Gera magic link token
    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        type: 'MAGIC_LINK',
        expires
      }
    });

    // Envia email (mock em desenvolvimento)
    await sendMagicLinkEmail(email, token);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Magic link error:', error);
    return NextResponse.json(
      { error: 'Failed to send magic link' },
      { status: 500 }
    );
  }
}