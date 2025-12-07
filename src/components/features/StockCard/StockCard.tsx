import { Stock } from '@/types';
import { formatCurrency, formatPercent, formatVolume, formatNumber } from '@/lib/utils';
import styles from './StockCard.module.css';

interface StockCardProps {
  stock: Stock;
  onClick?: () => void;
}

export function StockCard({ stock, onClick }: StockCardProps) {
  return (
    <div className={styles.card} onClick={onClick}>
      <div className={styles.header}>
        <div>
          <div className={styles.symbol}>{stock.symbol}</div>
          <div className={styles.name}>{stock.name}</div>
        </div>
        <button 
          className={styles.watchBtn}
          onClick={(e) => {
            e.stopPropagation();
            // Lógica de watchlist aqui
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