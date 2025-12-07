import { MarketIndex } from '@/types';
import { formatNumber, formatCurrency, formatPercent } from '@/lib/utils';
import styles from './IndexCard.module.css';

export function IndexCard({ data, name }: { data: MarketIndex; name?: string }) {
  const isPositive = data.change >= 0;
  
  return (
    <div className={styles.card}>
      <div className={styles.name}>{name || data.name}</div>
      <div className={styles.value}>{formatNumber(data.price)}</div>
      <div className={`${styles.change} ${isPositive ? styles.positive : styles.negative}`}>
        {isPositive ? '+' : ''}{formatNumber(data.change)} ({formatPercent(data.changePercent)})
      </div>
    </div>
  );
}