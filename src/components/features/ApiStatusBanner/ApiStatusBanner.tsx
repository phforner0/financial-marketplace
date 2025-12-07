// src/components/features/ApiStatusBanner/ApiStatusBanner.tsx (NOVO)
'use client';

import { useState, useEffect } from 'react';
import styles from './ApiStatusBanner.module.css';

export function ApiStatusBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [rateLimitResetTime, setRateLimitResetTime] = useState<Date | null>(null);

  useEffect(() => {
    // Verifica se há erros 429 recentes no sessionStorage
    const lastRateLimitError = sessionStorage.getItem('lastRateLimitError');
    
    if (lastRateLimitError) {
      const errorTime = new Date(lastRateLimitError);
      const now = new Date();
      const hoursSinceError = (now.getTime() - errorTime.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceError < 1) {
        setIsVisible(true);
        setRateLimitResetTime(new Date(errorTime.getTime() + 60 * 60 * 1000));
      } else {
        sessionStorage.removeItem('lastRateLimitError');
      }
    }
  }, []);

  if (!isVisible) return null;

  const timeUntilReset = rateLimitResetTime 
    ? Math.ceil((rateLimitResetTime.getTime() - new Date().getTime()) / (1000 * 60))
    : 60;

  return (
    <div className={styles.banner}>
      <div className={styles.icon}>⚠️</div>
      <div className={styles.content}>
        <strong>API Rate Limit Notice</strong>
        <p>
          Market data is temporarily using cached values due to API rate limits. 
          Live data will resume in approximately {timeUntilReset} minutes.
        </p>
      </div>
      <button 
        className={styles.closeBtn}
        onClick={() => {
          setIsVisible(false);
          sessionStorage.removeItem('lastRateLimitError');
        }}
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}