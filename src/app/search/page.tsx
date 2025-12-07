// src/app/search/page.tsx (NOVO ARQUIVO)
'use client';

import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { StockCard } from '@/components/features/StockCard/StockCard';
import styles from './Search.module.css';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const { data: results, error } = useSWR(
    query ? `/api/markets/search?q=${query}` : null,
    fetcher
  );

  return (
    <div className={styles.container}>
      <h1>Search Results for "{query}"</h1>
      
      {error && <div className={styles.error}>Failed to load results</div>}
      
      {!results && !error && <div className={styles.loading}>Searching...</div>}
      
      {results && results.length === 0 && (
        <div className={styles.empty}>No results found for "{query}"</div>
      )}
      
      {results && results.length > 0 && (
        <div className={styles.results}>
          {results.map((stock: any) => (
            <StockCard key={stock.symbol} stock={stock} />
          ))}
        </div>
      )}
    </div>
  );
}