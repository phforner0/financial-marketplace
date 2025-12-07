// src/app/dashboard/page.tsx - IMPORT CORRIGIDO
'use client';

import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import useSWR from 'swr';
import { MarketHeatmap } from '@/components/features/MarketHeatmap/MarketHeatmap'; // ✅ Named export
import PortfolioChart from '@/components/features/PortfolioChart/PortfolioChart';
import styles from './Dashboard.module.css';

const fetcher = (url: string) => fetch(url).then(r => r.json());

// Componente interno que usa useSearchParams
function DashboardContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [showWelcome, setShowWelcome] = useState(searchParams.get('tour') === 'true');

  // Fetch data
  const { data: portfolio, error: portfolioError } = useSWR('/api/portfolio', fetcher, { refreshInterval: 30000 });
  const { data: indices } = useSWR('/api/markets/indices', fetcher, { refreshInterval: 60000 });
  const { data: movers } = useSWR('/api/markets/movers', fetcher);
  const { data: watchlistsCount } = useSWR('/api/watchlists/count', fetcher);
  const { data: alertsCount } = useSWR('/api/alerts/count', fetcher);

  const firstName = session?.user?.name?.split(' ')[0] || 'there';

  return (
    <div className={styles.dashboard}>
      {showWelcome && (
        <div className={styles.welcomeBanner}>
          <div className={styles.welcomeIcon}>🎉</div>
          <div className={styles.welcomeContent}>
            <h2 className={styles.welcomeTitle}>
              Welcome to your dashboard, {firstName}!
            </h2>
            <p className={styles.welcomeDesc}>
              You're all set up! Start by adding stocks to your watchlist or exploring the markets.
            </p>
          </div>
          <button 
            className={styles.welcomeClose}
            onClick={() => setShowWelcome(false)}
          >
            ✕
          </button>
        </div>
      )}

      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            Good {getTimeOfDay()}, {firstName} 👋
          </h1>
          <p className={styles.pageSubtitle}>
            Here's what's happening with your investments today
          </p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <StatCard
          label="Portfolio Value"
          icon="💼"
          value={portfolio?.totalValue}
          change={portfolio?.todayChange}
          changePercent={portfolio?.todayChangePercent}
          period="today"
          loading={!portfolio && !portfolioError}
        />

        <StatCard
          label="Cash Available"
          icon="💰"
          value={portfolio?.cash}
          period="ready to invest"
          loading={!portfolio && !portfolioError}
        />

        <StatCard
          label="Active Alerts"
          icon="🔔"
          value={alertsCount?.active || 0}
          period={alertsCount?.active > 0 ? 'monitoring' : 'no alerts set'}
          loading={!alertsCount}
          link="/dashboard/alerts"
        />

        <StatCard
          label="Watchlists"
          icon="⭐"
          value={watchlistsCount?.total || 0}
          period={`${watchlistsCount?.totalAssets || 0} assets`}
          loading={!watchlistsCount}
          link="/dashboard/watchlists"
        />
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Market Heatmap</h2>
          <a href="/dashboard/markets" className={styles.sectionLink}>
            View full markets →
          </a>
        </div>
        <MarketHeatmap />
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Top Movers</h2>
        </div>

        <div className={styles.moversGrid}>
          <div className={styles.moversCard}>
            <h3 className={styles.moversTitle}>
              <span className={styles.moversIcon}>📈</span>
              Top Gainers
            </h3>
            {movers?.gainers ? (
              <div className={styles.moversList}>
                {movers.gainers.slice(0, 5).map((stock: any) => (
                  <MoverItem key={stock.symbol} stock={stock} type="gain" />
                ))}
              </div>
            ) : (
              <LoadingList />
            )}
          </div>

          <div className={styles.moversCard}>
            <h3 className={styles.moversTitle}>
              <span className={styles.moversIcon}>📉</span>
              Top Losers
            </h3>
            {movers?.losers ? (
              <div className={styles.moversList}>
                {movers.losers.slice(0, 5).map((stock: any) => (
                  <MoverItem key={stock.symbol} stock={stock} type="loss" />
                ))}
              </div>
            ) : (
              <LoadingList />
            )}
          </div>
        </div>
      </div>

      {portfolio && portfolio.totalValue > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Portfolio Performance</h2>
            <a href="/dashboard/portfolio" className={styles.sectionLink}>
              View details →
            </a>
          </div>
          <PortfolioChart />
        </div>
      )}

      {portfolio && portfolio.totalValue === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>🚀</div>
          <h3 className={styles.emptyStateTitle}>Ready to start investing?</h3>
          <p className={styles.emptyStateDesc}>
            Your portfolio is empty. Add some stocks to your watchlist or make your first trade!
          </p>
          
          <div className={styles.quickActions}>
            <a href="/dashboard/markets" className={styles.quickActionCard}>
              <span className={styles.quickActionIcon}>🔍</span>
              <div className={styles.quickActionContent}>
                <div className={styles.quickActionTitle}>Search Stocks</div>
                <div className={styles.quickActionDesc}>Find your favorite companies</div>
              </div>
            </a>

            <a href="/dashboard/markets" className={styles.quickActionCard}>
              <span className={styles.quickActionIcon}>📊</span>
              <div className={styles.quickActionContent}>
                <div className={styles.quickActionTitle}>Explore Markets</div>
                <div className={styles.quickActionDesc}>See what's trending</div>
              </div>
            </a>

            <a href="/dashboard/watchlists" className={styles.quickActionCard}>
              <span className={styles.quickActionIcon}>⭐</span>
              <div className={styles.quickActionContent}>
                <div className={styles.quickActionTitle}>My Watchlists</div>
                <div className={styles.quickActionDesc}>Manage your lists</div>
              </div>
            </a>

            <a href="/dashboard/portfolio" className={styles.quickActionCard}>
              <span className={styles.quickActionIcon}>💼</span>
              <div className={styles.quickActionContent}>
                <div className={styles.quickActionTitle}>Portfolio</div>
                <div className={styles.quickActionDesc}>Track your investments</div>
              </div>
            </a>
          </div>
        </div>
      )}

<div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Market Overview</h2>
          <a href="/dashboard/markets" className={styles.sectionLink}>View all →</a>
        </div>

        <div className={styles.marketIndices}>
          {!indices ? (
            // Loading state
            Array(4).fill(0).map((_, i) => <IndexCardSkeleton key={i} />)
          ) : (
            <>
              {/* Mostra os índices disponíveis */}
              {indices.ibovespa && <IndexCard data={indices.ibovespa} name="Ibovespa" />}
              {indices.sp500 && <IndexCard data={indices.sp500} name="S&P 500" />}
              {indices.nasdaq && <IndexCard data={indices.nasdaq} name="Nasdaq" />}
              {indices.dow && <IndexCard data={indices.dow} name="Dow Jones" />}
              
              {/* Se nenhum índice carregou, mostra mensagem */}
              {!indices.ibovespa && !indices.sp500 && !indices.nasdaq && !indices.dow && (
                <div style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  padding: 'var(--space-2xl)',
                  color: 'var(--color-text-secondary)'
                }}>
                  <span style={{ fontSize: '2rem', marginBottom: 'var(--space-md)', display: 'block' }}>📊</span>
                  <p>Market indices temporarily unavailable</p>
                  <p style={{ fontSize: 'var(--font-size-sm)', marginTop: 'var(--space-sm)' }}>
                    API rate limit reached. Data will refresh automatically.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Learning Resources</h2>
          <a href="/learn" className={styles.sectionLink}>View all →</a>
        </div>

        <div className={styles.resourcesGrid}>
          <div className={styles.resourceCard}>
            <span className={styles.resourceIcon}>📚</span>
            <div className={styles.resourceTitle}>Investment Basics</div>
            <div className={styles.resourceDesc}>Learn the fundamentals</div>
          </div>

          <div className={styles.resourceCard}>
            <span className={styles.resourceIcon}>📊</span>
            <div className={styles.resourceTitle}>Technical Analysis</div>
            <div className={styles.resourceDesc}>Read charts like a pro</div>
          </div>

          <div className={styles.resourceCard}>
            <span className={styles.resourceIcon}>💡</span>
            <div className={styles.resourceTitle}>Trading Strategies</div>
            <div className={styles.resourceDesc}>Proven approaches</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente principal exportado
export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        padding: 'var(--space-xl)' 
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #2a2a2a',
          borderTop: '4px solid #10b981',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}

// Helper components
interface StatCardProps {
  label: string;
  icon: string;
  value?: number;
  change?: number;
  changePercent?: number;
  period?: string;
  loading?: boolean;
  link?: string;
}

function StatCard({ label, icon, value, change, changePercent, period, loading, link }: StatCardProps) {
  const CardContent = () => (
    <>
      <div className={styles.statHeader}>
        <span className={styles.statLabel}>{label}</span>
        <span className={styles.statIcon}>{icon}</span>
      </div>
      <div className={styles.statValue}>
        {loading ? (
          <Skeleton width="120px" height="32px" />
        ) : value !== undefined ? (
          formatCurrency(value)
        ) : (
          value
        )}
      </div>
      <div className={styles.statChange}>
        {loading ? (
          <Skeleton width="100px" height="16px" />
        ) : change !== undefined && changePercent !== undefined ? (
          <>
            <span className={change >= 0 ? styles.statChangePositive : styles.statChangeNegative}>
              {formatCurrency(change)} ({formatPercent(changePercent)})
            </span>
            {period && <span className={styles.statPeriod}>{period}</span>}
          </>
        ) : (
          period && <span className={styles.statPeriod}>{period}</span>
        )}
      </div>
    </>
  );

  if (link) {
    return (
      <a href={link} className={styles.statCard}>
        <CardContent />
      </a>
    );
  }

  return (
    <div className={styles.statCard}>
      <CardContent />
    </div>
  );
}

function MoverItem({ stock, type }: { stock: any; type: 'gain' | 'loss' }) {
  return (
    <a href={`/dashboard/markets/${stock.symbol}`} className={styles.moverItem}>
      <div className={styles.moverLeft}>
        <span className={styles.moverSymbol}>{stock.symbol}</span>
        <span className={styles.moverPrice}>${stock.price.toFixed(2)}</span>
      </div>
      <div className={styles.moverRight}>
        <span className={type === 'gain' ? styles.moverGain : styles.moverLoss}>
          {stock.changePercent > 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
        </span>
      </div>
    </a>
  );
}

function LoadingList() {
  return (
    <div className={styles.moversList}>
      {Array(5).fill(0).map((_, i) => (
        <div key={i} className={styles.moverItem}>
          <Skeleton width="100%" height="40px" />
        </div>
      ))}
    </div>
  );
}

function IndexCard({ data, name }: { data: any; name: string }) {
  const isPositive = data.change >= 0;
  
  return (
    <div className={styles.indexCard}>
      <div className={styles.indexName}>{name}</div>
      <div className={styles.indexValue}>{formatNumber(data.price)}</div>
      <div className={isPositive ? styles.indexChangePositive : styles.indexChangeNegative}>
        {isPositive ? '+' : ''}{formatNumber(data.change)} ({formatPercent(data.changePercent)})
      </div>
    </div>
  );
}

function Skeleton({ width = '100%', height = '20px' }: { width?: string; height?: string }) {
  return <div className={styles.skeleton} style={{ width, height }} />;
}

function IndexCardSkeleton() {
  return (
    <div className={styles.indexCard}>
      <Skeleton width="80px" height="16px" />
      <Skeleton width="100px" height="24px" />
      <Skeleton width="90px" height="16px" />
    </div>
  );
}

// Utility functions
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

function formatNumber(value: number): string {
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}