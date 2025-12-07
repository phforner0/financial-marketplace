/* eslint-disable react/no-unescaped-entities */
// src/app/auth/forgot-password/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import styles from '../Auth.module.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Email is required');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to send reset email');
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setSuccess(false);
    setLoading(true);
    
    try {
      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      setSuccess(true);
      setLoading(false);
    } catch (err) {
      setError('Failed to resend email');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.verificationContainer}>
            <div className={styles.successIcon}>✉️</div>
            
            <div className={styles.header}>
              <h1 className={styles.title}>Check your email</h1>
              <p className={styles.subtitle}>
                We've sent a password reset link to<br />
                <strong style={{ color: 'var(--color-primary)' }}>{email}</strong>
              </p>
            </div>

            <div className={`${styles.alert} ${styles.alertInfo}`} style={{ textAlign: 'left' }}>
              <span className={styles.alertIcon}>ℹ️</span>
              <span className={styles.alertContent}>
                The link will expire in 15 minutes. If you don't see the email, check your spam folder.
              </span>
            </div>
          </div>
          
          <div className={styles.form}>
            <Link href="/auth/login" style={{ width: '100%' }}>
              <Button variant="primary" fullWidth>
                Back to Login
              </Button>
            </Link>
            
            <Button 
              variant="ghost" 
              fullWidth 
              onClick={handleResend}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Resend email'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.iconWrapper}>🔑</div>
          <h1 className={styles.title}>Forgot Password?</h1>
          <p className={styles.subtitle}>
            No worries, we'll send you reset instructions
          </p>
        </div>

        {error && (
          <div className={`${styles.alert} ${styles.alertError}`}>
            <span className={styles.alertIcon}>⚠️</span>
            <span className={styles.alertContent}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            placeholder="you@example.com"
            leftIcon="✉️"
            fullWidth
            required
            autoComplete="email"
          />

          <Button 
            type="submit" 
            variant="primary" 
            fullWidth 
            loading={loading}
            disabled={!email}
          >
            Send Reset Link
          </Button>
        </form>

        <div className={styles.footer}>
          <Link href="/auth/login" className={styles.linkButton}>
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}