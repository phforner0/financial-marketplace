// src/app/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function HomePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return; // Aguarda verificação
    
    if (session) {
      // Usuário autenticado
      if (!session.user.onboardingCompleted) {
        router.replace('/auth/onboarding');
      } else if (!session.user.tourCompleted) {
        router.replace('/auth/tour');
      } else {
        router.replace('/dashboard');
      }
    } else {
      // Não autenticado
      router.replace('/auth/login');
    }
  }, [session, status, router]);

  // Loading state
  if (status === 'loading') {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#0a0a0a',
        color: '#ffffff'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #2a2a2a',
            borderTop: '4px solid #10b981',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return null;
}