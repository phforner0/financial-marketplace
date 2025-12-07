/* eslint-disable react/no-unescaped-entities */
// src/app/auth/login/page.tsx
'use client';

import React, { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import styles from '../Auth.module.css';

// Componente interno que usa useSearchParams
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password. Please try again.');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/user/me');
      const user = await response.json();

      if (!user.onboardingCompleted) {
        router.push('/auth/onboarding');
      } else if (!user.tourCompleted) {
        router.push('/dashboard?tour=true');
      } else {
        router.push(callbackUrl);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signIn('google', { callbackUrl });
    } catch (err) {
      setError('Google sign-in failed. Please try again.');
      setLoading(false);
    }
  };

  const handleMagicLink = async () => {
    if (!formData.email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });

      if (response.ok) {
        alert(`✅ Magic link sent to ${formData.email}! Check your inbox.`);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to send magic link');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {error && (
        <div className={`${styles.alert} ${styles.alertError}`}>
          <span className={styles.alertIcon}>⚠️</span>
          <span className={styles.alertContent}>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <Input
          name="email"
          type="email"
          label="Email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={handleChange}
          leftIcon="✉️"
          fullWidth
          required
          autoComplete="email"
        />

        <div>
          <Input
            name="password"
            type={showPassword ? 'text' : 'password'}
            label="Password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            leftIcon="🔒"
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ cursor: 'pointer', background: 'none', border: 'none' }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            }
            fullWidth
            required
            autoComplete="current-password"
          />
          <div className={styles.forgotPassword}>
            <Link href="/auth/forgot-password" className={styles.linkButton}>
              Forgot password?
            </Link>
          </div>
        </div>

        <Button 
          type="submit" 
          variant="primary" 
          fullWidth 
          loading={loading}
          disabled={!formData.email || !formData.password}
        >
          Sign In
        </Button>
      </form>

      <div className={styles.textCenter} style={{ marginBottom: 'var(--space-md)' }}>
        <button
          type="button"
          className={styles.linkButton}
          onClick={handleMagicLink}
          disabled={loading}
        >
          ✨ Send me a magic link instead
        </button>
      </div>

      <div className={styles.divider}>
        <div className={styles.dividerLine} />
        <span className={styles.dividerText}>or continue with</span>
      </div>

      <Button 
        variant="secondary" 
        fullWidth 
        onClick={handleGoogleSignIn}
        disabled={loading}
        icon={
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.593.102-1.17.282-1.709V4.958H.957C.347 6.173 0 7.548 0 9c0 1.452.348 2.827.957 4.042l3.007-2.335z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
        }
      >
        Google
      </Button>

      <div className={styles.footer}>
        Don't have an account?{' '}
        <Link href="/auth/register" className={styles.linkButton}>
          Sign up
        </Link>
      </div>
    </>
  );
}

// Componente principal exportado
export default function LoginPage() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.iconWrapper}>💼</div>
          <h1 className={styles.title}>Welcome Back</h1>
          <p className={styles.subtitle}>Sign in to continue to your account</p>
        </div>

        <Suspense fallback={
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            padding: 'var(--space-xl)' 
          }}>
            <div className={styles.spinner} />
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}