// src/app/auth/register/page.tsx
'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import styles from '../Auth.module.css';

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface PasswordStrength {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  isValid: boolean;
}

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const validatePassword = (password: string): PasswordStrength => {
    return {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      isValid: password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password)
    };
  };

  const passwordStrength = validatePassword(formData.password);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    
    if (!formData.email) {
      setError('Email is required');
      return;
    }
    
    if (!passwordStrength.isValid) {
      setError('Password does not meet requirements');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (!acceptTerms) {
      setError('You must accept the Terms of Service and Privacy Policy');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Registration failed');
        setLoading(false);
        return;
      }

      // Auto sign-in after registration
      const signInResult = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (signInResult?.error) {
        // Registration succeeded but auto-login failed
        router.push('/auth/login?registered=true');
      } else {
        // Registration and login succeeded - go to onboarding
        router.push('/auth/onboarding');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    try {
      await signIn('google', { callbackUrl: '/auth/onboarding' });
    } catch (err) {
      setError('Google sign-up failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.iconWrapper}>🚀</div>
          <h1 className={styles.title}>Create Account</h1>
          <p className={styles.subtitle}>Start your investment journey today</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className={`${styles.alert} ${styles.alertError}`}>
            <span className={styles.alertIcon}>⚠️</span>
            <span className={styles.alertContent}>{error}</span>
          </div>
        )}

        {/* Google Sign Up */}
        <Button 
          variant="secondary" 
          fullWidth 
          onClick={handleGoogleSignUp}
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
          Continue with Google
        </Button>

        <div className={styles.divider}>
          <div className={styles.dividerLine} />
          <span className={styles.dividerText}>or register with email</span>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            name="name"
            label="Full Name"
            placeholder="John Doe"
            value={formData.name}
            onChange={handleChange}
            leftIcon="👤"
            fullWidth
            required
            autoComplete="name"
          />

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
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              }
              fullWidth
              required
            />
            
            {/* Password Strength Indicator */}
            {formData.password && (
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
            value={formData.confirmPassword}
            onChange={handleChange}
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
              formData.confirmPassword && formData.password !== formData.confirmPassword
                ? 'Passwords do not match'
                : undefined
            }
            fullWidth
            required
          />

          {/* Terms Checkbox */}
          <div className={styles.checkboxWrapper}>
            <input 
              type="checkbox" 
              id="acceptTerms"
              className={styles.checkbox}
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
            />
            <label htmlFor="acceptTerms" className={styles.checkboxLabel}>
              I agree to the{' '}
              <Link href="/terms" className={styles.linkButton} target="_blank">
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link href="/privacy" className={styles.linkButton} target="_blank">
                Privacy Policy
              </Link>
            </label>
          </div>

          <Button 
            type="submit" 
            variant="primary" 
            fullWidth 
            loading={loading}
            disabled={!passwordStrength.isValid || !acceptTerms}
          >
            Create Account
          </Button>
        </form>

        <div className={styles.footer}>
          Already have an account?{' '}
          <Link href="/auth/login" className={styles.linkButton}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}