// src/app/dashboard/portfolio/page.tsx - COMPLETAMENTE REFATORADO
'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/Button/Button';
import { TradeModal } from '@/components/features/TradeModal/TradeModal';
import PortfolioChart from '@/components/features/PortfolioChart/PortfolioChart';
import styles from './Portfolio.module.css';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Position {
  id: string;
  symbol: string;
  qty: number;
  avgPrice: number;
  currentPrice: number;
  value: number;
  profitLoss: number;
  profitLossPercent: number;
}

interface Portfolio {
  id: string;
  totalValue: number;
  cash: number;
  positions?: Position[];
}

export default function PortfolioPage() {
  const [tradeSymbol, setTradeSymbol] = useState<string | null>(null);
  const [tradePrice, setTradePrice] = useState<number>(0);
  
  const { data: portfolio, error, mutate } = useSWR<Portfolio>('/api/portfolio', fetcher, {
    refreshInterval: 30000 // Atualiza a cada 30s
  });
  
  const { data: positions } = useSWR<Position[]>('/api/portfolio/positions', fetcher, {
    refreshInterval: 30000
  });

  const handleTrade = (symbol: string, price: number) => {
    setTradeSymbol(symbol);
    setTradePrice(price);
  };

  const handleCloseModal = () => {
    setTradeSymbol(null);
    mutate(); // Revalida dados após trade
  };

  // Loading State
  if (!portfolio && !error) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading portfolio...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <span style={{ fontSize: '3rem' }}>⚠️</span>
          <h2>Failed to Load Portfolio</h2>
          <p>Please try again later</p>
          <Button onClick={() => mutate()}>Retry</Button>
        </div>
      </div>
    );
  }

  const hasPositions = positions && positions.length > 0;
  const totalPnL = positions?.reduce((sum, pos) => sum + pos.profitLoss, 0) || 0;
  const totalPnLPercent = portfolio?.totalValue 
    ? ((portfolio.totalValue - portfolio.cash) / (portfolio.totalValue - portfolio.cash - totalPnL)) * 100 
    : 0;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Portfolio</h1>
          <p className={styles.subtitle}>Track your investments and performance</p>
        </div>
        <div className={styles.actions}>
          <Button 
            variant="secondary" 
            onClick={() => window.location.href = '/dashboard/markets'}
          >
            🔍 Browse Markets
          </Button>
          <Button 
            variant="primary"
            onClick={() => {
              setTradeSymbol('');
              setTradePrice(0);
            }}
          >
            💼 New Trade
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className={styles.summary}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryHeader}>
            <span className={styles.summaryLabel}>Total Value</span>
            <span className={styles.summaryIcon}>💼</span>
          </div>
          <div className={styles.summaryValue}>
            ${portfolio?.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className={styles.summaryChange}>
            <span className={totalPnL >= 0 ? styles.positive : styles.negative}>
              {totalPnL >= 0 ? '+' : ''}${Math.abs(totalPnL).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              {' '}({totalPnL >= 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}%)
            </span>
            <span className={styles.summaryPeriod}>all time</span>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryHeader}>
            <span className={styles.summaryLabel}>Cash Available</span>
            <span className={styles.summaryIcon}>💰</span>
          </div>
          <div className={styles.summaryValue}>
            ${portfolio?.cash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className={styles.summaryChange}>
            <span className={styles.summaryPeriod}>ready to invest</span>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryHeader}>
            <span className={styles.summaryLabel}>Total P/L</span>
            <span className={styles.summaryIcon}>{totalPnL >= 0 ? '📈' : '📉'}</span>
          </div>
          <div className={styles.summaryValue}>
            <span className={totalPnL >= 0 ? styles.positive : styles.negative}>
              {totalPnL >= 0 ? '+' : ''}${Math.abs(totalPnL).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className={styles.summaryChange}>
            <span className={totalPnL >= 0 ? styles.positive : styles.negative}>
              {totalPnL >= 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}%
            </span>
            <span className={styles.summaryPeriod}>total return</span>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.summaryHeader}>
            <span className={styles.summaryLabel}>Holdings</span>
            <span className={styles.summaryIcon}>📊</span>
          </div>
          <div className={styles.summaryValue}>
            {positions?.length || 0}
          </div>
          <div className={styles.summaryChange}>
            <span className={styles.summaryPeriod}>active positions</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      {hasPositions && (
        <div className={styles.chartSection}>
          <PortfolioChart />
        </div>
      )}

      {/* Holdings Table */}
      <div className={styles.holdingsSection}>
        <div className={styles.holdingsHeader}>
          <h2 className={styles.holdingsTitle}>Holdings</h2>
          {hasPositions && (
            <div className={styles.holdingsStats}>
              {positions.length} position{positions.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {!hasPositions ? (
          // Empty State
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>📊</div>
            <h3 className={styles.emptyStateTitle}>No Holdings Yet</h3>
            <p className={styles.emptyStateDesc}>
              Start building your portfolio by making your first trade
            </p>
            <Button 
              variant="primary" 
              onClick={() => window.location.href = '/dashboard/markets'}
            >
              🔍 Browse Markets
            </Button>
          </div>
        ) : (
          // Holdings Table
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <div className={styles.tableCell}>Symbol</div>
              <div className={styles.tableCell}>Shares</div>
              <div className={styles.tableCell}>Avg Price</div>
              <div className={styles.tableCell}>Current Price</div>
              <div className={styles.tableCell}>Market Value</div>
              <div className={styles.tableCell}>P/L</div>
              <div className={styles.tableCell}>Actions</div>
            </div>

            {positions?.map((position) => {
              const isProfitable = position.profitLoss >= 0;
              
              return (
                <div key={position.id} className={styles.tableRow}>
                  <div className={`${styles.tableCell} ${styles.symbolCell}`}>
                    <a 
                      href={`/dashboard/markets/${position.symbol}`}
                      className={styles.symbolLink}
                    >
                      {position.symbol}
                    </a>
                  </div>
                  
                  <div className={styles.tableCell}>
                    {position.qty.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                  </div>
                  
                  <div className={styles.tableCell}>
                    ${position.avgPrice.toFixed(2)}
                  </div>
                  
                  <div className={styles.tableCell}>
                    ${position.currentPrice.toFixed(2)}
                  </div>
                  
                  <div className={styles.tableCell}>
                    ${position.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  
                  <div className={styles.tableCell}>
                    <div className={styles.plCell}>
                      <span className={isProfitable ? styles.positive : styles.negative}>
                        {isProfitable ? '+' : ''}${Math.abs(position.profitLoss).toFixed(2)}
                      </span>
                      <span className={`${styles.plPercent} ${isProfitable ? styles.positive : styles.negative}`}>
                        ({isProfitable ? '+' : ''}{position.profitLossPercent.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                  
                  <div className={styles.tableCell}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleTrade(position.symbol, position.currentPrice)}
                    >
                      Trade
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Trade Modal */}
      {tradeSymbol !== null && (
        <TradeModal
          symbol={tradeSymbol}
          currentPrice={tradePrice}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}