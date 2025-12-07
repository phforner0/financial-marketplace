import { Position } from '@/types';
import { formatCurrency, formatPercent } from '@/lib/utils';
import styles from './PositionsTable.module.css';

interface PositionsTableProps {
  positions: Position[];
  detailed?: boolean;
}

export function PositionsTable({ positions, detailed = false }: PositionsTableProps) {
  return (
    <div className={styles.table}>
      <div className={styles.header}>
        <div className={styles.cell}>Symbol</div>
        <div className={styles.cell}>Qty</div>
        <div className={styles.cell}>Avg Price</div>
        <div className={styles.cell}>Current</div>
        <div className={styles.cell}>Value</div>
        <div className={styles.cell}>P/L</div>
      </div>
      
      {positions.map((position) => (
        <div key={position.symbol} className={styles.row}>
          <div className={`${styles.cell} ${styles.symbol}`}>{position.symbol}</div>
          <div className={styles.cell}>{position.quantity}</div>
          <div className={styles.cell}>{formatCurrency(position.avgPrice)}</div>
          <div className={styles.cell}>{formatCurrency(position.currentPrice)}</div>
          <div className={styles.cell}>{formatCurrency(position.value)}</div>
          <div className={styles.cell}>
            <div className={position.profitLoss >= 0 ? styles.positive : styles.negative}>
              {formatCurrency(position.profitLoss)}
              <span className={styles.percent}>{formatPercent(position.profitLossPercent)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}