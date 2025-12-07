// src/app/auth/verify-email/page.tsx
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button/Button';
import styles from '../Auth.module.css';

type VerificationStatus = 'verifying' | 'success' | 'error';

// Componente interno que usa useSearchParams
function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<VerificationStatus>('verifying');
  const [error, setError] = useState('');
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing verification token');
      setStatus('error');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          
          setTimeout(() => {
            if (data.needsOnboarding) {
              router.push('/auth/onboarding');
            } else {
              router.push('/dashboard');
            }
          }, 3000);
        } else {
          setError(data.error || 'Verification failed');
          setStatus('error');
        }
      } catch (err) {
        setError('Something went wrong. Please try again.');
        setStatus('error');
      }
    };

    const timer = setTimeout(verifyEmail, 1500);
    return () => clearTimeout(timer);
  }, [token, router]);

  const handleResend = async () => {
    setResending(true);
    
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        alert('✅ Verification email sent! Check your inbox.');
      } else {
        const data = await response.json();
        alert(`❌ ${data.error || 'Failed to resend email'}`);
      }
    } catch (err) {
      alert('❌ Something went wrong. Please try again.');
    } finally {
      setResending(false);
    }
  };

  if (status === 'verifying') {
    return (
      <div className={styles.verificationContainer}>
        <div className={styles.spinner} />
        
        <div className={styles.header}>
          <h1 className={styles.title}>Verifying...</h1>
          <p className={styles.subtitle}>
            Please wait while we verify your email address
          </p>
        </div>

        <div className={`${styles.alert} ${styles.alertInfo}`}>
          <span className={styles.alertIcon}>ℹ️</span>
          <span className={styles.alertContent}>
            This should only take a moment
          </span>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className={styles.verificationContainer}>
        <div className={styles.successIcon}>✓</div>
        
        <div className={styles.header}>
          <h1 className={styles.title}>Email Verified!</h1>
          <p className={styles.subtitle}>
            Your email has been successfully verified.<br />
            You can now access all features.
          </p>
        </div>

        <div className={`${styles.alert} ${styles.alertSuccess}`}>
          <span className={styles.alertIcon}>🎉</span>
          <span className={styles.alertContent}>
            Redirecting you to the dashboard...
          </span>
        </div>

        <div className={styles.form}>
          <Link href="/dashboard" style={{ width: '100%' }}>
            <Button variant="primary" fullWidth>
              Continue to Dashboard
            </Button>
          </Link>
          
          <Link href="/auth/onboarding" style={{ width: '100%' }}>
            <Button variant="ghost" fullWidth>
              Complete Your Profile
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className={styles.verificationContainer}>
      <div className={styles.errorIcon}>✕</div>
      
      <div className={styles.header}>
        <h1 className={styles.title}>Verification Failed</h1>
        <p className={styles.subtitle}>
          {error || 'The verification link is invalid or has expired'}
        </p>
      </div>

      <div className={`${styles.alert} ${styles.alertError}`}>
        <span className={styles.alertIcon}>⚠️</span>
        <span className={styles.alertContent}>
          Verification links expire after 24 hours for security reasons.
        </span>
      </div>

      <div className={styles.form}>
        <Button 
          variant="primary" 
          fullWidth 
          onClick={handleResend}
          loading={resending}
        >
          Resend Verification Email
        </Button>
        
        <Link href="/auth/login" style={{ width: '100%' }}>
          <Button variant="ghost" fullWidth>
            Back to Login
          </Button>
        </Link>
      </div>

      <div className={styles.footer}>
        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-tertiary)' }}>
          Need help?{' '}
          <Link href="/support" className={styles.linkButton}>
            Contact Support
          </Link>
        </span>
      </div>
    </div>
  );
}

// Componente principal exportado
export default function VerifyEmailPage() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <Suspense fallback={
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            padding: 'var(--space-xl)' 
          }}>
            <div className={styles.spinner} />
          </div>
        }>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  );
}