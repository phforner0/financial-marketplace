// src/app/auth/magic-link-callback/page.tsx (NOVO ARQUIVO)
'use client';

import { useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function MagicLinkCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email');
  const callback = searchParams.get('callback') || '/dashboard';

  useEffect(() => {
    if (!email) {
      router.push('/auth/login?error=invalid_email');
      return;
    }

    // Auto sign-in via magic link
    signIn('credentials', {
      email,
      password: '', // Magic link não precisa de senha
      redirect: false,
    }).then((result) => {
      if (result?.ok) {
        router.push(callback);
      } else {
        console.error('Magic link sign-in failed:', result?.error);
        router.push('/auth/login?error=magic_link_failed');
      }
    }).catch((error) => {
      console.error('Magic link error:', error);
      router.push('/auth/login?error=magic_link_error');
    });
  }, [email, callback, router]);

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
        <p>Signing you in...</p>
      </div>
    </div>
  );
}