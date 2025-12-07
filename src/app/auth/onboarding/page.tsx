// src/app/auth/onboarding/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/Button/Button';
import styles from '../Auth.module.css';

interface QuestionOption {
  value: string;
  label: string;
  emoji: string;
  desc?: string;
}

interface Question {
  id: string;
  title: string;
  subtitle: string;
  multiple?: boolean;
  minSelection?: number;
  options: QuestionOption[];
}

interface Answers {
  experience?: string;
  objective?: string;
  risk?: string;
  horizon?: string;
  interests?: string[];
}

const questions: Question[] = [
  {
    id: 'experience',
    title: "What's your investment experience?",
    subtitle: 'Help us personalize your experience',
    options: [
      { 
        value: 'BEGINNER', 
        label: 'Beginner', 
        emoji: '🌱', 
        desc: 'New to investing' 
      },
      { 
        value: 'INTERMEDIATE', 
        label: 'Intermediate', 
        emoji: '📈', 
        desc: '1-3 years experience' 
      },
      { 
        value: 'ADVANCED', 
        label: 'Advanced', 
        emoji: '🎯', 
        desc: '3+ years experience' 
      }
    ]
  },
  {
    id: 'objective',
    title: "What's your primary investment goal?",
    subtitle: 'This helps us show relevant opportunities',
    options: [
      { 
        value: 'GROWTH', 
        label: 'Growth', 
        emoji: '🚀', 
        desc: 'Build wealth over time' 
      },
      { 
        value: 'INCOME', 
        label: 'Income', 
        emoji: '💰', 
        desc: 'Generate regular income' 
      },
      { 
        value: 'PRESERVATION', 
        label: 'Preservation', 
        emoji: '🛡️', 
        desc: 'Protect my capital' 
      }
    ]
  },
  {
    id: 'risk',
    title: "What's your risk tolerance?",
    subtitle: 'How comfortable are you with market volatility?',
    options: [
      { 
        value: 'CONSERVATIVE', 
        label: 'Conservative', 
        emoji: '🐢', 
        desc: 'Minimize losses, steady growth' 
      },
      { 
        value: 'MODERATE', 
        label: 'Moderate', 
        emoji: '⚖️', 
        desc: 'Balanced risk and reward' 
      },
      { 
        value: 'AGGRESSIVE', 
        label: 'Aggressive', 
        emoji: '🦅', 
        desc: 'Maximize returns, accept volatility' 
      }
    ]
  },
  {
    id: 'horizon',
    title: "What's your investment time horizon?",
    subtitle: 'How long do you plan to invest for?',
    options: [
      { 
        value: 'SHORT', 
        label: 'Short-term', 
        emoji: '⚡', 
        desc: 'Less than 1 year' 
      },
      { 
        value: 'MEDIUM', 
        label: 'Medium-term', 
        emoji: '📅', 
        desc: '1-5 years' 
      },
      { 
        value: 'LONG', 
        label: 'Long-term', 
        emoji: '🌳', 
        desc: '5+ years' 
      }
    ]
  },
  {
    id: 'interests',
    title: 'What are you interested in?',
    subtitle: 'Select all that apply (at least 1)',
    multiple: true,
    minSelection: 1,
    options: [
      { value: 'STOCKS', label: 'Stocks', emoji: '📊' },
      { value: 'CRYPTO', label: 'Crypto', emoji: '₿' },
      { value: 'ETFS', label: 'ETFs', emoji: '📈' },
      { value: 'FOREX', label: 'Forex', emoji: '💱' },
      { value: 'COMMODITIES', label: 'Commodities', emoji: '🏆' },
      { value: 'OPTIONS', label: 'Options', emoji: '🎲' }
    ]
  }
];

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, update } = useSession();
  
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentQuestion = questions[step];
  const progress = ((step + 1) / questions.length) * 100;
  const isLastStep = step === questions.length - 1;
  const canGoBack = step > 0;

  const handleSingleChoice = (value: string) => {
    const newAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(newAnswers);
    
    // Auto-advance after a short delay for better UX
    setTimeout(() => {
      if (isLastStep) {
        submitAnswers(newAnswers);
      } else {
        setStep(step + 1);
      }
    }, 200);
  };

  const toggleInterest = (value: string) => {
    setSelectedInterests(prev => 
      prev.includes(value) 
        ? prev.filter(v => v !== value)
        : [...prev, value]
    );
    setError('');
  };

  const handleMultipleChoice = () => {
    if (selectedInterests.length === 0) {
      setError('Please select at least one interest');
      return;
    }

    const newAnswers = { ...answers, interests: selectedInterests };
    submitAnswers(newAnswers);
  };

  const handleBack = () => {
    if (canGoBack) {
      setStep(step - 1);
      setError('');
    }
  };

  const handleSkip = () => {
    router.push('/dashboard?tour=true');
  };

  const submitAnswers = async (finalAnswers: Answers) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalAnswers),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to save preferences');
        setLoading(false);
        return;
      }

      // Update session to reflect onboarding completion
      await update({
        onboardingCompleted: true,
      });

      // Redirect to tour
      router.push('/dashboard?tour=true');
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className={styles.container} style={{ paddingTop: '0', justifyContent: 'flex-start' }}>
      {/* Progress Bar */}
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>

      {/* Logout Button */}
      <div style={{ 
        position: 'fixed', 
        top: 'var(--space-lg)', 
        right: 'var(--space-lg)',
        zIndex: 10 
      }}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: '/auth/login' })}
        >
          Logout
        </Button>
      </div>

      {/* Main Content */}
      <div style={{ 
        marginTop: 'calc(var(--space-2xl) + var(--header-height))', 
        width: '100%', 
        display: 'flex', 
        justifyContent: 'center',
        padding: 'var(--space-lg)'
      }}>
        <div className={`${styles.card} ${styles.cardWide}`}>
          
          {/* Step Indicator */}
          <div className={styles.stepIndicator}>
            <span className={styles.stepBadge}>
              Question {step + 1} of {questions.length}
            </span>
          </div>

          {/* Header */}
          <div className={styles.header}>
            <h1 className={styles.title}>{currentQuestion.title}</h1>
            <p className={styles.subtitle}>{currentQuestion.subtitle}</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className={`${styles.alert} ${styles.alertError}`}>
              <span className={styles.alertIcon}>⚠️</span>
              <span className={styles.alertContent}>{error}</span>
            </div>
          )}

          {/* Options Grid */}
          <div className={`${styles.optionsGrid} ${currentQuestion.multiple ? styles.optionsGridMulti : ''}`}>
            {currentQuestion.options.map((option) => {
              const isSelected = currentQuestion.multiple 
                ? selectedInterests.includes(option.value)
                : false;

              return (
                <button
                  key={option.value}
                  type="button"
                  className={`${styles.optionCard} ${isSelected ? styles.optionCardSelected : ''}`}
                  onClick={() => 
                    currentQuestion.multiple 
                      ? toggleInterest(option.value)
                      : handleSingleChoice(option.value)
                  }
                  disabled={loading}
                >
                  <span className={styles.optionCardEmoji}>{option.emoji}</span>
                  <span className={styles.optionCardTitle}>{option.label}</span>
                  {option.desc && (
                    <span className={styles.optionCardDesc}>{option.desc}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Navigation Buttons */}
          <div className={styles.navigationButtons}>
            {canGoBack && (
              <Button 
                variant="ghost" 
                onClick={handleBack}
                disabled={loading}
              >
                ← Back
              </Button>
            )}
            
            <Button
              variant="ghost"
              onClick={handleSkip}
              disabled={loading}
              style={{ marginLeft: 'auto' }}
            >
              Skip for now
            </Button>
            
            {currentQuestion.multiple && (
              <Button 
                variant="primary" 
                onClick={handleMultipleChoice}
                disabled={selectedInterests.length === 0 || loading}
                loading={loading}
              >
                {isLastStep ? 'Complete Setup' : 'Continue'}
              </Button>
            )}
          </div>

          {/* Loading Overlay */}
          {loading && (
            <div className={styles.loadingOverlay}>
              <div className={styles.loadingSpinner} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}