'use client';

import { PositionsTable } from '@/components/features/PositionsTable/PositionsTable';
import styles from './Portfolio.module.css';
import { mockPortfolio } from '@/lib/mock-data';
import { formatCurrency, formatPercent } from '@/lib/utils';
// Importe PositionsTable

export default function PortfolioPage() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Portfolio</h1>
        <div className={styles.actions}>
          <button className="btn-primary">Trade</button>
        </div>
      </div>

      <div className={styles.summary}>
        <div className={styles.card}>
           <span>Total Value</span>
           <h2>{formatCurrency(mockPortfolio.totalValue)}</h2>
        </div>
        <div className={styles.card}>
           <span>Cash</span>
           <h2>{formatCurrency(mockPortfolio.cash)}</h2>
        </div>
      </div>

      <div className={styles.holdings}>
        <h3>All Holdings</h3>
        {/* Aqui entra a tabela completa com mais detalhes */}
        <PositionsTable positions={mockPortfolio.positions} detailed />
      </div>
    </div>
  );
}