// src/app/auth/tour/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button/Button';
import styles from './Tour.module.css';

interface TourStep {
  id: number;
  title: string;
  description: string;
  emoji: string;
  feature: string;
  tip: string;
}

const tourSteps: TourStep[] = [
  {
    id: 1,
    title: 'Welcome to Your Dashboard! 🎉',
    description: 'Your command center for everything finance. Track markets, manage your portfolio, and discover new opportunities.',
    emoji: '🏠',
    feature: 'Dashboard Overview',
    tip: 'Access your dashboard anytime from the sidebar'
  },
  {
    id: 2,
    title: 'Add Stocks to Your Watchlist',
    description: 'Keep track of stocks you\'re interested in. Use the search bar (⌘+K) to find any stock, crypto, or ETF.',
    emoji: '⭐',
    feature: 'Watchlists',
    tip: 'You can create multiple watchlists for different strategies'
  },
  {
    id: 3,
    title: 'Set Price Alerts',
    description: 'Never miss an opportunity! Get notified when stocks hit your target price or move by a certain percentage.',
    emoji: '🔔',
    feature: 'Alerts',
    tip: 'Alerts work even when you\'re not online'
  },
  {
    id: 4,
    title: 'Try Paper Trading',
    description: 'Practice trading with $100,000 virtual cash. No risk, real market prices. Perfect for learning!',
    emoji: '📝',
    feature: 'Paper Trading',
    tip: 'Switch to live trading anytime when you\'re ready'
  },
  {
    id: 5,
    title: 'Connect Your Broker',
    description: 'Ready for real trades? Connect your Alpaca account to execute trades directly from our platform.',
    emoji: '🔗',
    feature: 'Broker Integration',
    tip: 'Your broker credentials are encrypted and secure'
  }
];

export default function TourPage() {
  const router = useRouter();
  const { update } = useSession();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const step = tourSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tourSteps.length - 1;
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    await completeTour();
    router.push('/dashboard');
  };

  const handleComplete = async () => {
    setLoading(true);
    await completeTour();
    router.push('/dashboard');
  };

  const completeTour = async () => {
    try {
      await fetch('/api/auth/complete-tour', {
        method: 'POST',
      });

      // Update session
      await update({
        tourCompleted: true,
      });
    } catch (error) {
      console.error('Failed to complete tour:', error);
    }
  };

  return (
    <div className={styles.container}>
      {/* Progress Bar */}
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${progress}%` }} />
      </div>

      {/* Step Counter */}
      <div className={styles.stepCounter}>
        <span className={styles.stepBadge}>
          Step {currentStep + 1} of {tourSteps.length}
        </span>
      </div>

      {/* Main Content */}
      <div className={styles.content}>
        {/* Emoji Icon */}
        <div className={styles.emojiContainer}>
          <span className={styles.emoji}>{step.emoji}</span>
        </div>

        {/* Title */}
        <h1 className={styles.title}>{step.title}</h1>

        {/* Description */}
        <p className={styles.description}>{step.description}</p>

        {/* Feature Badge */}
        <div className={styles.featureBadge}>
          <span className={styles.featureBadgeIcon}>✨</span>
          <span className={styles.featureBadgeText}>{step.feature}</span>
        </div>

        {/* Tip Box */}
        <div className={styles.tipBox}>
          <span className={styles.tipIcon}>💡</span>
          <span className={styles.tipText}>
            <strong>Pro Tip:</strong> {step.tip}
          </span>
        </div>

        {/* Visual Indicator */}
        <div className={styles.stepsIndicator}>
          {tourSteps.map((_, index) => (
            <div
              key={index}
              className={`${styles.stepDot} ${
                index === currentStep ? styles.stepDotActive : ''
              } ${index < currentStep ? styles.stepDotCompleted : ''}`}
            />
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className={styles.navigation}>
          {!isFirstStep && (
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={loading}
            >
              ← Back
            </Button>
          )}

          <div className={styles.navigationRight}>
            <Button
              variant="ghost"
              onClick={handleSkip}
              disabled={loading}
            >
              Skip Tour
            </Button>

            <Button
              variant="primary"
              onClick={handleNext}
              loading={loading}
              disabled={loading}
            >
              {isLastStep ? 'Get Started 🚀' : 'Next →'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}