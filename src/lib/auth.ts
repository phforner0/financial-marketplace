// src/lib/auth.ts
import type { NextAuthOptions } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import type { Adapter } from 'next-auth/adapters';

// Providers dinâmicos - só adiciona Google se credenciais existirem
const providers: any[] = [
  // Email/Password
  CredentialsProvider({
    name: 'credentials',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        throw new Error('Invalid credentials');
      }

      const user = await prisma.user.findUnique({
        where: { email: credentials.email },
      });

      if (!user || !user.passwordHash) {
        throw new Error('Invalid credentials');
      }

      const isValid = await bcrypt.compare(
        credentials.password,
        user.passwordHash
      );

      if (!isValid) {
        throw new Error('Invalid credentials');
      }

      if (!user.isActive) {
        throw new Error('Account is disabled');
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.avatar,
      };
    },
  }),
];

// Adiciona Google OAuth apenas se credenciais existirem
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    })
  );
} else {
  console.warn('⚠️ Google OAuth not configured - add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env');
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  
  providers,

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: '/auth/login',
    signOut: '/logout',
    error: '/auth/login',
    verifyRequest: '/auth/verify-email',
  },

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        
        // Fetch additional user data
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            id: true,
            email: true,
            name: true,
            username: true,
            avatar: true,
            isPremium: true,
            onboardingCompleted: true,
            tourCompleted: true,
          },
        });
        
        if (dbUser) {
          token.username = dbUser.username;
          token.isPremium = dbUser.isPremium;
          token.onboardingCompleted = dbUser.onboardingCompleted;
          token.tourCompleted = dbUser.tourCompleted;
        }
      }

      // Handle session update
      if (trigger === 'update' && session) {
        return { ...token, ...session };
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.username = (token.username as string) || null;
        session.user.isPremium = (token.isPremium as boolean) || false;
        session.user.onboardingCompleted = (token.onboardingCompleted as boolean) || false;
        session.user.tourCompleted = (token.tourCompleted as boolean) || false;
      }

      return session;
    },
  },

  events: {
    async signIn({ user, account, isNewUser }) {
      // Track sign-in event
      console.log(`User signed in: ${user.email} (new: ${isNewUser})`);
      
      // If new OAuth user, mark email as verified
      if (isNewUser && account?.provider !== 'credentials') {
        await prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: new Date() },
        });
      }
    },
  },

  debug: process.env.NODE_ENV === 'development',
};