// src/components/features/StockCard/StockCard.tsx
import { Stock } from '@/types';
import { formatCurrency, formatPercent } from '@/lib/utils';
import styles from './StockCard.module.css';

interface StockCardProps {
  stock: Stock;
  onClick?: () => void;
}

function formatVolume(volume: number | undefined): string {
  if (!volume || volume === 0) return 'N/A';
  if (volume >= 1e9) return `${(volume / 1e9).toFixed(2)}B`;
  if (volume >= 1e6) return `${(volume / 1e6).toFixed(2)}M`;
  if (volume >= 1e3) return `${(volume / 1e3).toFixed(2)}K`;
  return volume.toString();
}

function formatNumber(value: number | undefined): string {
  if (!value || value === 0) return 'N/A';
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return value.toString();
}

export function StockCard({ stock, onClick }: StockCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      window.location.href = `/dashboard/markets/${stock.symbol}`;
    }
  };

  return (
    <div className={styles.card} onClick={handleClick}>
      <div className={styles.header}>
        <div>
          <div className={styles.symbol}>{stock.symbol}</div>
          <div className={styles.name}>{stock.name}</div>
        </div>
        <button 
          className={styles.watchBtn}
          onClick={(e) => {
            e.stopPropagation();
            alert('Watchlist feature coming soon!');
          }}
        >
          ⭐
        </button>
      </div>
      
      <div className={styles.price}>{formatCurrency(stock.price)}</div>
      
      <div className={`${styles.change} ${stock.changePercent >= 0 ? styles.positive : styles.negative}`}>
        {stock.changePercent >= 0 ? '▲' : '▼'} {formatPercent(Math.abs(stock.changePercent))}
      </div>
      
      <div className={styles.meta}>
        <span>Vol: {formatVolume(stock.volume)}</span>
        <span>Cap: {formatNumber(stock.marketCap)}</span>
      </div>
    </div>
  );
}