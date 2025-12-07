// src/app/dashboard/markets/[symbol]/page.tsx - NOVA PÁGINA DE DETALHES
'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button/Button';
import { TradeModal } from '@/components/features/TradeModal/TradeModal';
import styles from './SymbolDetail.module.css';

interface Quote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  volume: number;
}

export default function SymbolDetailPage() {
  const params = useParams();
  const symbol = (params.symbol as string).toUpperCase();
  
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showTradeModal, setShowTradeModal] = useState(false);

  useEffect(() => {
    fetchQuote();
    const interval = setInterval(fetchQuote, 30000); // Atualiza a cada 30s
    return () => clearInterval(interval);
  }, [symbol]);

  async function fetchQuote() {
    try {
      const res = await fetch(`/api/markets/quote?symbol=${symbol}`);
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Failed to load quote');
        setLoading(false);
        return;
      }
      
      setQuote(data.quote);
      setError('');
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddToWatchlist() {
    try {
      // Busca primeira watchlist ou cria uma default
      const listsRes = await fetch('/api/watchlists');
      const lists = await listsRes.json();
      
      let targetList = lists[0];
      
      if (!targetList) {
        // Cria watchlist default
        const createRes = await fetch('/api/watchlists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'My Watchlist' })
        });
        targetList = await createRes.json();
      }
      
      // Adiciona símbolo
      const addRes = await fetch(`/api/watchlists/${targetList.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol })
      });
      
      if (addRes.ok) {
        alert(`✅ ${symbol} added to watchlist!`);
      } else {
        const data = await addRes.json();
        alert(`❌ ${data.error || 'Failed to add'}`);
      }
    } catch (err) {
      alert('❌ Failed to add to watchlist');
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading {symbol}...</p>
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <span style={{ fontSize: '3rem' }}>⚠️</span>
          <h2>Failed to Load Data</h2>
          <p>{error || 'Quote not found'}</p>
          <Button onClick={() => window.history.back()}>
            ← Go Back
          </Button>
        </div>
      </div>
    );
  }

  const isPositive = quote.changePercent >= 0;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.symbol}>{symbol}</h1>
          <div className={styles.priceSection}>
            <span className={styles.price}>
              ${quote.price.toFixed(2)}
            </span>
            <span className={isPositive ? styles.positive : styles.negative}>
              {isPositive ? '+' : ''}{quote.change.toFixed(2)} ({isPositive ? '+' : ''}{quote.changePercent.toFixed(2)}%)
            </span>
          </div>
        </div>
        
        <div className={styles.actions}>
          <Button 
            variant="secondary" 
            size="md"
            onClick={handleAddToWatchlist}
          >
            ⭐ Add to Watchlist
          </Button>
          <Button 
            variant="primary" 
            size="md"
            onClick={() => setShowTradeModal(true)}
          >
            💼 Trade
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Open</span>
          <span className={styles.statValue}>${quote.open.toFixed(2)}</span>
        </div>
        
        <div className={styles.statCard}>
          <span className={styles.statLabel}>High</span>
          <span className={styles.statValue}>${quote.high.toFixed(2)}</span>
        </div>
        
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Low</span>
          <span className={styles.statValue}>${quote.low.toFixed(2)}</span>
        </div>
        
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Prev Close</span>
          <span className={styles.statValue}>${quote.previousClose.toFixed(2)}</span>
        </div>
        
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Volume</span>
          <span className={styles.statValue}>
            {new Intl.NumberFormat('en-US', { notation: 'compact' }).format(quote.volume)}
          </span>
        </div>
      </div>

      {/* Chart Placeholder */}
      <div className={styles.chartSection}>
        <div className={styles.chartPlaceholder}>
          <span style={{ fontSize: '3rem' }}>📈</span>
          <h3>Chart Coming Soon</h3>
          <p>TradingView integration will be added in the next update</p>
        </div>
      </div>

      {/* Trade Modal */}
      {showTradeModal && (
        <TradeModal
          symbol={symbol}
          currentPrice={quote.price}
          onClose={() => setShowTradeModal(false)}
        />
      )}
    </div>
  );
}