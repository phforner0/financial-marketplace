/* eslint-disable react-hooks/set-state-in-effect */
// src/app/auth/reset-password/page.tsx
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import styles from '../Auth.module.css';

interface PasswordStrength {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  isValid: boolean;
}

// Componente interno que usa useSearchParams
function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token');
      setTokenValid(false);
      return;
    }

    const validateToken = async () => {
      try {
        const response = await fetch(`/api/auth/validate-reset-token?token=${token}`);
        setTokenValid(response.ok);
        
        if (!response.ok) {
          setError('This reset link is invalid or has expired');
        }
      } catch (err) {
        setTokenValid(false);
        setError('Failed to validate reset link');
      }
    };

    validateToken();
  }, [token]);

  const validatePassword = (pwd: string): PasswordStrength => {
    return {
      minLength: pwd.length >= 8,
      hasUppercase: /[A-Z]/.test(pwd),
      hasLowercase: /[a-z]/.test(pwd),
      hasNumber: /\d/.test(pwd),
      isValid: pwd.length >= 8 && /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /\d/.test(pwd)
    };
  };

  const passwordStrength = validatePassword(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!passwordStrength.isValid) {
      setError('Password does not meet requirements');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to reset password');
        setLoading(false);
        return;
      }

      setSuccess(true);
      
      setTimeout(() => {
        router.push('/auth/login?reset=success');
      }, 3000);
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  // Token validation loading state
  if (tokenValid === null) {
    return (
      <div className={styles.verificationContainer}>
        <div className={styles.spinner} />
        <p className={styles.subtitle}>Validating reset link...</p>
      </div>
    );
  }

  // Invalid token
  if (tokenValid === false) {
    return (
      <>
        <div className={styles.verificationContainer}>
          <div className={styles.errorIcon}>✕</div>
          
          <div className={styles.header}>
            <h1 className={styles.title}>Invalid Link</h1>
            <p className={styles.subtitle}>
              This password reset link is invalid or has expired
            </p>
          </div>

          <div className={`${styles.alert} ${styles.alertError}`}>
            <span className={styles.alertIcon}>⚠️</span>
            <span className={styles.alertContent}>
              Password reset links expire after 15 minutes for security reasons.
            </span>
          </div>
        </div>
        
        <div className={styles.form}>
          <Link href="/auth/forgot-password" style={{ width: '100%' }}>
            <Button variant="primary" fullWidth>
              Request New Link
            </Button>
          </Link>
          
          <Link href="/auth/login" style={{ width: '100%' }}>
            <Button variant="ghost" fullWidth>
              Back to Login
            </Button>
          </Link>
        </div>
      </>
    );
  }

  // Success state
  if (success) {
    return (
      <>
        <div className={styles.verificationContainer}>
          <div className={styles.successIcon}>✓</div>
          
          <div className={styles.header}>
            <h1 className={styles.title}>Password Reset Successful!</h1>
            <p className={styles.subtitle}>
              Your password has been successfully reset.<br />
              You can now sign in with your new password.
            </p>
          </div>

          <div className={`${styles.alert} ${styles.alertSuccess}`}>
            <span className={styles.alertIcon}>ℹ️</span>
            <span className={styles.alertContent}>
              Redirecting to login page...
            </span>
          </div>
        </div>

        <div className={styles.form}>
          <Link href="/auth/login" style={{ width: '100%' }}>
            <Button variant="primary" fullWidth>
              Continue to Login
            </Button>
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <div className={styles.header}>
        <div className={styles.iconWrapper}>🔐</div>
        <h1 className={styles.title}>Set New Password</h1>
        <p className={styles.subtitle}>
          Your new password must be different from previous passwords
        </p>
      </div>

      {error && (
        <div className={`${styles.alert} ${styles.alertError}`}>
          <span className={styles.alertIcon}>⚠️</span>
          <span className={styles.alertContent}>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div>
          <Input
            name="password"
            type={showPassword ? 'text' : 'password'}
            label="New Password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            leftIcon="🔒"
            rightIcon={
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={{ cursor: 'pointer', background: 'none', border: 'none' }}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            }
            fullWidth
            required
          />
          
          {password && (
            <div className={styles.passwordStrength}>
              <div className={styles.strengthTitle}>Password must contain:</div>
              <div className={styles.strengthRequirements}>
                <div className={`${styles.strengthRequirement} ${passwordStrength.minLength ? styles.met : styles.unmet}`}>
                  <span className={styles.strengthIcon}>{passwordStrength.minLength ? '✓' : '○'}</span>
                  At least 8 characters
                </div>
                <div className={`${styles.strengthRequirement} ${passwordStrength.hasUppercase ? styles.met : styles.unmet}`}>
                  <span className={styles.strengthIcon}>{passwordStrength.hasUppercase ? '✓' : '○'}</span>
                  One uppercase letter
                </div>
                <div className={`${styles.strengthRequirement} ${passwordStrength.hasLowercase ? styles.met : styles.unmet}`}>
                  <span className={styles.strengthIcon}>{passwordStrength.hasLowercase ? '✓' : '○'}</span>
                  One lowercase letter
                </div>
                <div className={`${styles.strengthRequirement} ${passwordStrength.hasNumber ? styles.met : styles.unmet}`}>
                  <span className={styles.strengthIcon}>{passwordStrength.hasNumber ? '✓' : '○'}</span>
                  One number
                </div>
              </div>
            </div>
          )}
        </div>

        <Input
          name="confirmPassword"
          type={showConfirmPassword ? 'text' : 'password'}
          label="Confirm Password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            setError('');
          }}
          leftIcon="🔒"
          rightIcon={
            <button 
              type="button" 
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              style={{ cursor: 'pointer', background: 'none', border: 'none' }}
            >
              {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          }
          error={
            confirmPassword && password !== confirmPassword
              ? 'Passwords do not match'
              : undefined
          }
          fullWidth
          required
        />

        <Button 
          type="submit" 
          variant="primary" 
          fullWidth 
          loading={loading}
          disabled={!passwordStrength.isValid || password !== confirmPassword}
        >
          Reset Password
        </Button>
      </form>

      <div className={styles.footer}>
        <Link href="/auth/login" className={styles.linkButton}>
          ← Back to Login
        </Link>
      </div>
    </>
  );
}

// Componente principal exportado
export default function ResetPasswordPage() {
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
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}