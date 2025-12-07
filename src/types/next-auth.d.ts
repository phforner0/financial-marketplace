// src/types/next-auth.d.ts
import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      username?: string | null;
      image?: string | null;
      isPremium: boolean;
      onboardingCompleted: boolean;
      tourCompleted: boolean;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    username?: string | null;
    isPremium?: boolean;
    onboardingCompleted?: boolean;
    tourCompleted?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    username?: string | null;
    isPremium?: boolean;
    onboardingCompleted?: boolean;
    tourCompleted?: boolean;
  }
}