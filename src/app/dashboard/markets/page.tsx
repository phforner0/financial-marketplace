'use client';

import { useState } from 'react';
import styles from './Markets.module.css';
import { generateMockStocks } from '@/lib/mock-data';
// Importe StockCard de onde você o salvou (sugestão: src/components/features/StockCard.tsx)

export default function MarketsPage() {
  const [filter, setFilter] = useState<'all' | 'gainers' | 'losers'>('all');
  const stocks = generateMockStocks();

  const filteredStocks = stocks.filter((stock) => {
    if (filter === 'gainers') return stock.changePercent > 0;
    if (filter === 'losers') return stock.changePercent < 0;
    return true;
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Markets</h1>
        <div className={styles.filters}>
          <button className={filter === 'all' ? styles.active : ''} onClick={() => setFilter('all')}>All</button>
          <button className={filter === 'gainers' ? styles.active : ''} onClick={() => setFilter('gainers')}>Gainers</button>
          <button className={filter === 'losers' ? styles.active : ''} onClick={() => setFilter('losers')}>Losers</button>
        </div>
      </div>

      <div className={styles.grid}>
        {filteredStocks.map((stock) => (
          // Use Link para navegar para o detalhe
          <a key={stock.symbol} href={`/dashboard/markets/${stock.symbol}`} className={styles.cardLink}>
             {/* Renderize seu StockCard aqui */}
             <div className={styles.stockCard}>
                <strong>{stock.symbol}</strong>
                <span>${stock.price.toFixed(2)}</span>
             </div>
          </a>
        ))}
      </div>
    </div>
  );
}