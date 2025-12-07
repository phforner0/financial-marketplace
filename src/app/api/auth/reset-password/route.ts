// 3. src/app/api/auth/reset-password/route.ts
// ========================================
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
    try {
      const { token, password } = await req.json();
  
      // Validate token
      const verificationToken = await prisma.verificationToken.findUnique({
        where: { token }
      });
  
      if (!verificationToken || verificationToken.expires < new Date()) {
        return NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 400 }
        );
      }
  
      // Hash new password
      const passwordHash = await bcrypt.hash(password, 12);
  
      // Update user password
      await prisma.user.update({
        where: { email: verificationToken.identifier },
        data: { passwordHash }
      });
  
      // Delete used token
      await prisma.verificationToken.delete({
        where: { token }
      });
  
      return NextResponse.json({ success: true });
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to reset password' },
        { status: 500 }
      );
    }
  }