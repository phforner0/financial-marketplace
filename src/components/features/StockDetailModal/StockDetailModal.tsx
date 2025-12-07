import { Stock } from '@/types';
import { formatCurrency, formatPercent, formatVolume, formatNumber } from '@/lib/utils';
import styles from './StockDetailModal.module.css';

interface StockDetailModalProps {
  stock: Stock;
  onClose: () => void;
}

export function StockDetailModal({ stock, onClose }: StockDetailModalProps) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>{stock.symbol} · {stock.name}</h2>
            <div className={styles.price}>
              {formatCurrency(stock.price)}
              <span style={{ 
                color: stock.changePercent >= 0 ? '#10b981' : '#ef4444',
                marginLeft: '1rem' 
              }}>
                {formatPercent(stock.changePercent)}
              </span>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.content}>
          <div className={styles.actions}>
            <button className={styles.btn}>⭐ Watch</button>
            <button className={styles.btn}>🔔 Alert</button>
            <button className={`${styles.btn} ${styles.primary}`}>Buy</button>
            <button className={`${styles.btn} ${styles.danger}`}>Sell</button>
          </div>

          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <div className={styles.statLabel}>Volume</div>
              <div className={styles.statValue}>{formatVolume(stock.volume)}</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statLabel}>Market Cap</div>
              <div className={styles.statValue}>{formatNumber(stock.marketCap)}</div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statLabel}>Day Change</div>
              <div className={styles.statValue}>{formatCurrency(stock.change)}</div>
            </div>
          </div>

          <div className={styles.placeholder}>
            <span style={{ fontSize: '2rem' }}>📈</span>
            <p>TradingView Chart Widget Loading...</p>
          </div>
        </div>
      </div>
    </div>
  );
}