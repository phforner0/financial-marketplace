// src/lib/utils.ts

import clsx, { ClassValue } from 'clsx';

/**
 * Merge class names (like Tailwind's cn utility)
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Format currency (USD)
 */
export function formatCurrency(value: number | undefined | null, decimals: number = 2): string {
  if (value === undefined || value === null || isNaN(value)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format percentage
 */
export function formatPercent(value: number | undefined | null, decimals: number = 2): string {
  if (value === undefined || value === null || isNaN(value)) return '0.00%';
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

/**
 * Format large numbers (1.2M, 3.4B, etc)
 */
export function formatNumber(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value) || value === 0) return 'N/A';
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return value.toFixed(2);
}

/**
 * Format volume
 */
export function formatVolume(value: number | undefined | null): string {
  return formatNumber(value);
}

/**
 * Get color class based on value (gain/loss)
 */
export function getChangeColor(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) return 'neutral';
  if (value > 0) return 'gain';
  if (value < 0) return 'loss';
  return 'neutral';
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Safe JSON parse
 */
export function safeJsonParse<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

/**
 * Generate random ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Check if value is numeric
 */
export function isNumeric(value: unknown): boolean {
  if (typeof value === 'number') return !isNaN(value) && isFinite(value);
  if (typeof value === 'string') return !isNaN(parseFloat(value)) && isFinite(Number(value));
  return false;
}

/**
 * Clamp number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Calculate percentage change
 */
export function calcPercentChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

/**
 * Get relative time (1 hour ago, 2 days ago, etc)
 */
export function getRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`;
  return `${Math.floor(seconds / 2592000)}mo ago`;
}