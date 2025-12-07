import { Stock } from '@/types';
import { formatCurrency, formatPercent } from '@/lib/utils';
import styles from './MoversCard.module.css';
import Link from 'next/link';

interface MoversCardProps {
  title: string;
  stocks: Stock[];
  type: 'gain' | 'loss';
}

export function MoversCard({ title, stocks, type }: MoversCardProps) {
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>
        <span>{type === 'gain' ? '📈' : '📉'}</span>
        {title}
      </h3>
      <div className={styles.list}>
        {stocks.map((stock) => (
          <Link key={stock.symbol} href={`/dashboard/markets/${stock.symbol}`} className={styles.item}>
            <div>
              <span className={styles.symbol}>{stock.symbol}</span>
              <span className={styles.price}>{formatCurrency(stock.price)}</span>
            </div>
            <div className={`${styles.change} ${type === 'gain' ? styles.gain : styles.loss}`}>
              {formatPercent(stock.changePercent)}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}