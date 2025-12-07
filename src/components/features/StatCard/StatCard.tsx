import { formatCurrency, formatPercent } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton/Skeleton';
import styles from './StatCard.module.css';
import Link from 'next/link';

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

export function StatCard({ label, icon, value, change, changePercent, period, loading, link }: StatCardProps) {
  const Content = () => (
    <>
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
        <span className={styles.icon}>{icon}</span>
      </div>
      
      <div className={styles.value}>
        {loading ? (
          <Skeleton width="120px" height="32px" />
        ) : value !== undefined ? (
          typeof value === 'number' ? formatCurrency(value) : value
        ) : (
          '-'
        )}
      </div>

      <div className={styles.change}>
        {loading ? (
          <Skeleton width="100px" height="16px" />
        ) : change !== undefined && changePercent !== undefined ? (
          <>
            <span className={change >= 0 ? styles.positive : styles.negative}>
              {formatCurrency(change)} ({formatPercent(changePercent)})
            </span>
            {period && <span className={styles.period}>{period}</span>}
          </>
        ) : (
          period && <span className={styles.period}>{period}</span>
        )}
      </div>
    </>
  );

  if (link) {
    return (
      <Link href={link} className={styles.card}>
        <Content />
      </Link>
    );
  }

  return (
    <div className={styles.card}>
      <Content />
    </div>
  );
}