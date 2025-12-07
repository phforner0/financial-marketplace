// src/components/features/WatchlistTable/WatchlistTable.tsx
'use client';

import { formatCurrency, formatPercent } from '@/lib/utils';
import styles from './WatchlistTable.module.css';

interface WatchlistStock {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

interface WatchlistTableProps {
  stocks: WatchlistStock[];
  onRemove?: (symbol: string) => void;
  onTrade?: (symbol: string) => void;
}

export function WatchlistTable({ stocks, onRemove, onTrade }: WatchlistTableProps) {
  return (
    <div className={styles.table}>
      <div className={styles.header}>
        <div className={styles.cell}>Symbol</div>
        <div className={styles.cell}>Price</div>
        <div className={styles.cell}>Change</div>
        <div className={styles.cell}>Volume</div>
        <div className={styles.cell}>Actions</div>
      </div>
      
      {stocks.map((stock) => (
        <div key={stock.symbol} className={styles.row}>
          <div className={`${styles.cell} ${styles.symbol}`}>
            <a href={`/dashboard/markets/${stock.symbol}`}>
              {stock.symbol}
            </a>
          </div>
          
          <div className={styles.cell}>
            {formatCurrency(stock.price)}
          </div>
          
          <div className={styles.cell}>
            <div className={stock.changePercent >= 0 ? styles.positive : styles.negative}>
              {stock.changePercent >= 0 ? '▲' : '▼'} {formatPercent(Math.abs(stock.changePercent))}
            </div>
          </div>
          
          <div className={styles.cell}>
            {new Intl.NumberFormat('en-US', { notation: 'compact' }).format(stock.volume)}
          </div>
          
          <div className={`${styles.cell} ${styles.actions}`}>
            {onTrade && (
              <button 
                className={styles.actionBtn}
                onClick={() => onTrade(stock.symbol)}
              >
                Trade
              </button>
            )}
            {onRemove && (
              <button 
                className={`${styles.actionBtn} ${styles.remove}`}
                onClick={() => onRemove(stock.symbol)}
              >
                Remove
              </button>
            )}
          </div>
        </div>
      ))}
      
      {stocks.length === 0 && (
        <div className={styles.empty}>
          No stocks in watchlist. Add some to get started!
        </div>
      )}
    </div>
  );
}