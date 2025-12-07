// src/components/features/PortfolioWidget/PortfolioWidget.tsx
'use client';

import Link from 'next/link';
import useSWR from 'swr';
import styles from './PortfolioWidget.module.css';

const fetcher = (url: string) => fetch(url).then(r => r.json());

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

export function PortfolioWidget() {
  const { data: portfolio, error } = useSWR('/api/portfolio', fetcher, {
    refreshInterval: 30000
  });

  if (error) return null;
  if (!portfolio) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
        </div>
      </div>
    );
  }

  const positions = portfolio.positions || [];
  
  // Top gainers (por unrealizedPLPercent)
  const topGainers = [...positions]
    .filter(p => p.unrealizedPLPercent > 0)
    .sort((a, b) => b.unrealizedPLPercent - a.unrealizedPLPercent)
    .slice(0, 3);

  // Top losers (por unrealizedPLPercent)
  const topLosers = [...positions]
    .filter(p => p.unrealizedPLPercent < 0)
    .sort((a, b) => a.unrealizedPLPercent - b.unrealizedPLPercent)
    .slice(0, 3);

  return (
    <div className={styles.container}>
      {/* Summary Card */}
      <Link href="/dashboard/portfolio" className={styles.summaryCard}>
        <div className={styles.summaryHeader}>
          <span className={styles.summaryIcon}>💼</span>
          <span className={styles.summaryLabel}>My Portfolio</span>
        </div>
        
        <div className={styles.summaryValue}>
          {formatCurrency(portfolio.totalValue)}
        </div>
        
        <div className={styles.summaryStats}>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Cash:</span>
            <span className={styles.statValue}>{formatCurrency(portfolio.cash)}</span>
          </div>
          
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Today:</span>
            <span className={`${styles.statValue} ${portfolio.todayChange >= 0 ? styles.positive : styles.negative}`}>
              {formatCurrency(portfolio.todayChange)} ({formatPercent(portfolio.todayChangePercent)})
            </span>
          </div>
          
          <div className={styles.statRow}>
            <span className={styles.statLabel}>All-Time P/L:</span>
            <span className={`${styles.statValue} ${portfolio.totalReturn >= 0 ? styles.positive : styles.negative}`}>
              {formatCurrency(portfolio.totalReturn)} ({formatPercent(portfolio.totalReturnPercent)})
            </span>
          </div>
        </div>
        
        <div className={styles.summaryActions}>
          <span className={styles.actionLink}>View Details →</span>
        </div>
      </Link>

      {/* Top Movers Grid */}
      {positions.length > 0 && (
        <div className={styles.moversGrid}>
          {/* Top Gainers */}
          <div className={styles.moverCard}>
            <div className={styles.moverHeader}>
              <span className={styles.moverIcon}>📈</span>
              <span className={styles.moverTitle}>Top Gainers</span>
            </div>
            
            <div className={styles.moverList}>
              {topGainers.length > 0 ? (
                topGainers.map(position => (
                  <Link 
                    key={position.symbol}
                    href={`/dashboard/markets/${position.symbol}`}
                    className={styles.moverItem}
                  >
                    <div className={styles.moverLeft}>
                      <span className={styles.moverSymbol}>{position.symbol}</span>
                      <span className={styles.moverValue}>
                        {formatCurrency(position.marketValue)}
                      </span>
                    </div>
                    <div className={styles.moverRight}>
                      <span className={styles.moverGain}>
                        {formatPercent(position.unrealizedPLPercent)}
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className={styles.emptyMover}>No gains yet</div>
              )}
            </div>
          </div>

          {/* Top Losers */}
          <div className={styles.moverCard}>
            <div className={styles.moverHeader}>
              <span className={styles.moverIcon}>📉</span>
              <span className={styles.moverTitle}>Top Losers</span>
            </div>
            
            <div className={styles.moverList}>
              {topLosers.length > 0 ? (
                topLosers.map(position => (
                  <Link 
                    key={position.symbol}
                    href={`/dashboard/markets/${position.symbol}`}
                    className={styles.moverItem}
                  >
                    <div className={styles.moverLeft}>
                      <span className={styles.moverSymbol}>{position.symbol}</span>
                      <span className={styles.moverValue}>
                        {formatCurrency(position.marketValue)}
                      </span>
                    </div>
                    <div className={styles.moverRight}>
                      <span className={styles.moverLoss}>
                        {formatPercent(position.unrealizedPLPercent)}
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className={styles.emptyMover}>No losses yet</div>
              )}
            </div>
          </div>

          {/* Biggest Holding */}
          {portfolio.performance?.biggestHolding && (
            <div className={styles.highlightCard}>
              <div className={styles.highlightLabel}>Biggest Holding</div>
              <div className={styles.highlightSymbol}>
                {portfolio.performance.biggestHolding.symbol}
              </div>
              <div className={styles.highlightValue}>
                {formatCurrency(portfolio.performance.biggestHolding.value)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}