// src/app/dashboard/markets/[symbol]/page.tsx - COM TRADINGVIEW
'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button/Button';
import { TradeModal } from '@/components/features/TradeModal/TradeModal';
import { TradingViewWidget } from '@/components/features/TradingViewWidget/TradingViewWidget';
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
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchQuote();
    const interval = setInterval(fetchQuote, 30000); // Atualiza a cada 30s
    return () => clearInterval(interval);
  }, [symbol]);

  async function fetchQuote(silent = false) {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    
    try {
      const res = await fetch(`/api/markets/quote?symbol=${symbol}`);
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Failed to load quote');
        if (!silent) setLoading(false);
        return;
      }
      
      setQuote(data.quote);
      setError('');
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  async function handleCreateAlert() {
    if (!quote) return;
    
    const threshold = prompt(`Create price alert for ${symbol}\n\nCurrent price: $${quote.price.toFixed(2)}\n\nEnter target price:`);
    
    if (!threshold) return;
    
    const price = parseFloat(threshold);
    if (isNaN(price) || price <= 0) {
      alert('Invalid price');
      return;
    }
    
    try {
      const directionUp = price > quote.price;
      
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          type: 'PRICE',
          priceThreshold: price,
          directionUp
        })
      });
      
      if (res.ok) {
        alert(`✅ Alert created! You'll be notified when ${symbol} ${directionUp ? 'rises above' : 'falls below'} $${price.toFixed(2)}`);
      } else {
        const data = await res.json();
        alert(`❌ ${data.error || 'Failed to create alert'}`);
      }
    } catch (err) {
      alert('❌ Failed to create alert');
    }
  }

  const handleTradeSuccess = () => {
    fetchQuote(true);
  };

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
          <Button onClick={() => fetchQuote()}>
            ↻ Retry
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
          {refreshing && (
            <div style={{ 
              fontSize: '0.75rem', 
              color: 'var(--color-text-tertiary)',
              marginTop: '8px'
            }}>
              ↻ Refreshing...
            </div>
          )}
        </div>
        
        <div className={styles.actions}>
          <Button 
            variant="secondary" 
            size="md"
            onClick={handleAddToWatchlist}
          >
            ⭐ Watchlist
          </Button>
          
          <Button 
            variant="secondary" 
            size="md"
            onClick={handleCreateAlert}
          >
            🔔 Alert
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

      {/* TradingView Chart */}
      <div className={styles.chartSection}>
        <TradingViewWidget 
          symbol={symbol}
          theme="dark"
          height={500}
          interval="D"
        />
      </div>

      {/* Additional Sections */}
      <div className={styles.infoSection}>
        <h2 className={styles.sectionTitle}>About {symbol}</h2>
        <div className={styles.infoCard}>
          <div className={styles.infoPlaceholder}>
            <span style={{ fontSize: '2.5rem' }}>📊</span>
            <p>Company fundamentals and news coming soon</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-tertiary)', marginTop: '8px' }}>
              This will include: company description, key metrics, analyst ratings, and recent news
            </p>
          </div>
        </div>
      </div>

      {/* Trade Modal */}
      {showTradeModal && (
        <TradeModal
          symbol={symbol}
          currentPrice={quote.price}
          onClose={() => setShowTradeModal(false)}
          onSuccess={handleTradeSuccess}
        />
      )}
    </div>
  );
}