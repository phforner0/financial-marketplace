// src/app/dashboard/portfolio/page.tsx - VERSÃO COMPLETA
'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/Button/Button';
import { TradeModal } from '@/components/features/TradeModal/TradeModal';
import  PortfolioChart  from '@/components/features/PortfolioChart/PortfolioChart';
import { AllocationChart } from '@/components/features/AllocationChart/AllocationChart';
import styles from './Portfolio.module.css';

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

export default function PortfolioPage() {
  const [tradeSymbol, setTradeSymbol] = useState<string | null>(null);
  const [tradePrice, setTradePrice] = useState<number>(0);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  
  const { data: portfolio, error, mutate } = useSWR('/api/portfolio', fetcher, {
    refreshInterval: 30000
  });

  const handleTrade = (symbol: string, price: number) => {
    setTradeSymbol(symbol);
    setTradePrice(price);
  };

  const handleCloseModal = () => {
    setTradeSymbol(null);
    mutate();
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

  const hasPositions = portfolio.positions && portfolio.positions.length > 0;
  const perf = portfolio.performance || {};

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Portfolio</h1>
          <p className={styles.subtitle}>Track your investments and performance</p>
        </div>
        <div className={styles.actions}>
          <Button variant="secondary" onClick={() => alert('Deposit coming soon')}>
            💰 Deposit
          </Button>
          <Button variant="secondary" onClick={() => alert('Withdraw coming soon')}>
            💸 Withdraw
          </Button>
          <Button 
            variant="primary"
            onClick={() => handleTrade('', 0)}
          >
            💼 New Trade
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className={styles.summary}>
        {/* Total Value */}
        <div className={styles.summaryCard}>
          <div className={styles.summaryHeader}>
            <span className={styles.summaryLabel}>Total Value</span>
            <span className={styles.summaryIcon}>💼</span>
          </div>
          <div className={styles.summaryValue}>
            {formatCurrency(portfolio.totalValue)}
          </div>
          <div className={styles.summaryChange}>
            <span className={portfolio.todayChange >= 0 ? styles.positive : styles.negative}>
              {formatCurrency(portfolio.todayChange)} ({formatPercent(portfolio.todayChangePercent)})
            </span>
            <span className={styles.summaryPeriod}>today</span>
          </div>
        </div>

        {/* Cash Available */}
        <div className={styles.summaryCard}>
          <div className={styles.summaryHeader}>
            <span className={styles.summaryLabel}>Cash Available</span>
            <span className={styles.summaryIcon}>💰</span>
          </div>
          <div className={styles.summaryValue}>
            {formatCurrency(portfolio.cash)}
          </div>
          <div className={styles.summaryChange}>
            <span className={styles.summaryPeriod}>ready to invest</span>
          </div>
        </div>

        {/* Total Return */}
        <div className={styles.summaryCard}>
          <div className={styles.summaryHeader}>
            <span className={styles.summaryLabel}>Total Return</span>
            <span className={styles.summaryIcon}>
              {portfolio.totalReturn >= 0 ? '📈' : '📉'}
            </span>
          </div>
          <div className={styles.summaryValue}>
            <span className={portfolio.totalReturn >= 0 ? styles.positive : styles.negative}>
              {formatCurrency(portfolio.totalReturn)}
            </span>
          </div>
          <div className={styles.summaryChange}>
            <span className={portfolio.totalReturn >= 0 ? styles.positive : styles.negative}>
              {formatPercent(portfolio.totalReturnPercent)}
            </span>
            <span className={styles.summaryPeriod}>all time</span>
          </div>
        </div>

        {/* Holdings */}
        <div className={styles.summaryCard}>
          <div className={styles.summaryHeader}>
            <span className={styles.summaryLabel}>Holdings</span>
            <span className={styles.summaryIcon}>📊</span>
          </div>
          <div className={styles.summaryValue}>
            {portfolio.positions?.length || 0}
          </div>
          <div className={styles.summaryChange}>
            <span className={styles.summaryPeriod}>
              {formatCurrency(portfolio.invested)} invested
            </span>
          </div>
        </div>
      </div>

      {/* Performance Stats */}
      {hasPositions && (
        <div className={styles.performanceStats}>
          <div className={styles.statBox}>
            <div className={styles.statLabel}>Best Day</div>
            <div className={`${styles.statValue} ${styles.positive}`}>
              {perf.bestDay ? formatCurrency(perf.bestDay.change) : 'N/A'}
            </div>
            <div className={styles.statSubtext}>
              {perf.bestDay ? formatPercent(perf.bestDay.changePercent) : ''}
            </div>
          </div>

          <div className={styles.statBox}>
            <div className={styles.statLabel}>Worst Day</div>
            <div className={`${styles.statValue} ${styles.negative}`}>
              {perf.worstDay ? formatCurrency(perf.worstDay.change) : 'N/A'}
            </div>
            <div className={styles.statSubtext}>
              {perf.worstDay ? formatPercent(perf.worstDay.changePercent) : ''}
            </div>
          </div>

          <div className={styles.statBox}>
            <div className={styles.statLabel}>Win Rate</div>
            <div className={styles.statValue}>
              {perf.winRate?.toFixed(1) || 0}%
            </div>
            <div className={styles.statSubtext}>
              {perf.totalTrades || 0} trades
            </div>
          </div>

          <div className={styles.statBox}>
            <div className={styles.statLabel}>Best Performer</div>
            <div className={`${styles.statValue} ${styles.positive}`}>
              {perf.bestPerformer?.symbol || 'N/A'}
            </div>
            <div className={styles.statSubtext}>
              {perf.bestPerformer ? formatPercent(perf.bestPerformer.return) : ''}
            </div>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      {hasPositions && (
        <div className={styles.chartsGrid}>
          {/* Performance Chart */}
          <div className={styles.chartSection}>
            <PortfolioChart portfolioId={portfolio.id} />
          </div>

          {/* Allocation Chart */}
          <div className={styles.allocationSection}>
            <AllocationChart 
              byAssetType={portfolio.allocation?.byAssetType}
              bySector={portfolio.allocation?.bySector}
            />
          </div>
        </div>
      )}

      {/* Holdings Table */}
      <div className={styles.holdingsSection}>
        <div className={styles.holdingsHeader}>
          <h2 className={styles.holdingsTitle}>Holdings</h2>
          {hasPositions && (
            <div className={styles.holdingsStats}>
              {portfolio.positions.length} position{portfolio.positions.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {!hasPositions ? (
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
          <div className={styles.table}>
            <div className={styles.tableHeader}>
              <div className={styles.tableCell}>Symbol</div>
              <div className={styles.tableCell}>Shares</div>
              <div className={styles.tableCell}>Avg Price</div>
              <div className={styles.tableCell}>Current</div>
              <div className={styles.tableCell}>Value</div>
              <div className={styles.tableCell}>Day Change</div>
              <div className={styles.tableCell}>Total P/L</div>
              <div className={styles.tableCell}>Allocation</div>
              <div className={styles.tableCell}>Actions</div>
            </div>

            {portfolio.positions.map((position: any) => {
              const isExpanded = expandedRow === position.id;
              
              return (
                <div 
                  key={position.id} 
                  className={`${styles.tableRow} ${isExpanded ? styles.expanded : ''}`}
                >
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
                    {formatCurrency(position.avgPrice)}
                  </div>
                  
                  <div className={styles.tableCell}>
                    {formatCurrency(position.currentPrice)}
                  </div>
                  
                  <div className={styles.tableCell}>
                    {formatCurrency(position.marketValue)}
                  </div>
                  
                  <div className={styles.tableCell}>
                    <div className={styles.plCell}>
                      <span className={position.dayChange >= 0 ? styles.positive : styles.negative}>
                        {formatCurrency(position.dayChange)}
                      </span>
                      <span className={`${styles.plPercent} ${position.dayChangePercent >= 0 ? styles.positive : styles.negative}`}>
                        ({formatPercent(position.dayChangePercent)})
                      </span>
                    </div>
                  </div>
                  
                  <div className={styles.tableCell}>
                    <div className={styles.plCell}>
                      <span className={position.unrealizedPL >= 0 ? styles.positive : styles.negative}>
                        {formatCurrency(position.unrealizedPL)}
                      </span>
                      <span className={`${styles.plPercent} ${position.unrealizedPLPercent >= 0 ? styles.positive : styles.negative}`}>
                        ({formatPercent(position.unrealizedPLPercent)})
                      </span>
                    </div>
                  </div>
                  
                  <div className={styles.tableCell}>
                    <div className={styles.allocationBar}>
                      <div 
                        className={styles.allocationFill}
                        style={{ width: `${position.allocation}%` }}
                      />
                      <span className={styles.allocationText}>
                        {position.allocation.toFixed(1)}%
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