// src/app/dashboard/markets/page.tsx (versão melhorada)
'use client';

import { useState, useEffect } from 'react';
import { StockCard } from '@/components/features/StockCard/StockCard';
import { generateMockStocks } from '@/lib/mock-data';
import styles from './Markets.module.css';

function StockCardSkeleton() {
  return (
    <div className={styles.skeletonCard}>
      <div className={styles.skeletonHeader}>
        <div className={styles.skeletonSymbol} />
        <div className={styles.skeletonIcon} />
      </div>
      <div className={styles.skeletonPrice} />
      <div className={styles.skeletonChange} />
      <div className={styles.skeletonMeta}>
        <div className={styles.skeletonMetaItem} />
        <div className={styles.skeletonMetaItem} />
      </div>
    </div>
  );
}

export default function MarketsPage() {
  const [filter, setFilter] = useState<'all' | 'gainers' | 'losers'>('all');
  const [stocks, setStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simula loading com delay para mostrar skeleton
    const timer = setTimeout(() => {
      setStocks(generateMockStocks());
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const filteredStocks = stocks.filter((stock) => {
    if (filter === 'gainers') return stock.changePercent > 0;
    if (filter === 'losers') return stock.changePercent < 0;
    return true;
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Markets</h1>
          <p className={styles.subtitle}>Explore stocks, ETFs, and crypto</p>
        </div>
        
        <div className={styles.filters}>
          <button 
            className={filter === 'all' ? styles.active : ''} 
            onClick={() => setFilter('all')}
            disabled={loading}
          >
            All
          </button>
          <button 
            className={filter === 'gainers' ? styles.active : ''} 
            onClick={() => setFilter('gainers')}
            disabled={loading}
          >
            Gainers
          </button>
          <button 
            className={filter === 'losers' ? styles.active : ''} 
            onClick={() => setFilter('losers')}
            disabled={loading}
          >
            Losers
          </button>
        </div>
      </div>

      <div className={styles.grid}>
        {loading ? (
          <>
            {Array(10).fill(0).map((_, i) => (
              <StockCardSkeleton key={i} />
            ))}
          </>
        ) : (
          <>
            {filteredStocks.map((stock) => (
              <StockCard key={stock.symbol} stock={stock} />
            ))}
          </>
        )}
      </div>

      {!loading && filteredStocks.length === 0 && (
        <div className={styles.empty}>
          <span style={{ fontSize: '3rem' }}>📊</span>
          <h3>No stocks found</h3>
          <p>Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
}