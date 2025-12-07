// src/app/auth/magic-link-callback/page.tsx
'use client';

import { useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';

// Componente interno que usa useSearchParams
function MagicLinkCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email');
  const callback = searchParams.get('callback') || '/dashboard';

  useEffect(() => {
    if (!email) {
      router.push('/auth/login?error=invalid_email');
      return;
    }

    signIn('credentials', {
      email,
      password: '',
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

// Componente principal exportado
export default function MagicLinkCallbackPage() {
  return (
    <Suspense fallback={
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
    }>
      <MagicLinkCallbackContent />
    </Suspense>
  );
}