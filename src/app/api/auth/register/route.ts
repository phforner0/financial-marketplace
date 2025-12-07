// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { sendVerificationEmail } from '@/lib/email'; // ← Usar novo helper

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = registerSchema.parse(body);

    // Verifica se usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 12);

    // Cria usuário
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      }
    });

    // Gera token de verificação
    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 horas

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        type: 'EMAIL_VERIFICATION',
        expires
      }
    });

    // Envia email de verificação (mock em desenvolvimento)
    await sendVerificationEmail(email, token);

    return NextResponse.json({
      success: true,
      message: 'Registration successful. Please check your email.',
      userId: user.id
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}