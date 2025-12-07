// src/components/features/TradingViewWidget/TradingViewWidget.tsx
'use client';

import { useEffect, useRef } from 'react';
import styles from './TradingViewWidget.module.css';

interface TradingViewWidgetProps {
  symbol: string;
  theme?: 'dark' | 'light';
  height?: number;
  interval?: string;
}

export function TradingViewWidget({ 
  symbol, 
  theme = 'dark',
  height = 500,
  interval = 'D'
}: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    // Don't reload if already loaded
    if (scriptLoadedRef.current) return;

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      scriptLoadedRef.current = true;
      
      if (containerRef.current && (window as any).TradingView) {
        new (window as any).TradingView.widget({
          autosize: true,
          symbol: symbol,
          interval: interval,
          timezone: 'America/New_York',
          theme: theme,
          style: '1',
          locale: 'en',
          toolbar_bg: theme === 'dark' ? '#141414' : '#f1f3f6',
          enable_publishing: false,
          withdateranges: true,
          hide_side_toolbar: false,
          allow_symbol_change: true,
          details: true,
          hotlist: true,
          calendar: true,
          studies: [
            'MASimple@tv-basicstudies',
            'RSI@tv-basicstudies'
          ],
          container_id: containerRef.current.id,
          height: height,
          backgroundColor: theme === 'dark' ? '#0a0a0a' : '#ffffff',
          gridColor: theme === 'dark' ? '#2a2a2a' : '#e1e3e6',
          loading_screen: {
            backgroundColor: theme === 'dark' ? '#0a0a0a' : '#ffffff',
            foregroundColor: theme === 'dark' ? '#10b981' : '#2962FF'
          }
        });
      }
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup script on unmount
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [symbol, theme, height, interval]);

  return (
    <div className={styles.container}>
      <div 
        ref={containerRef} 
        id={`tradingview_${symbol.replace(/[^a-zA-Z0-9]/g, '_')}`}
        className={styles.chartContainer}
        style={{ height: `${height}px` }}
      />
    </div>
  );
}

// TradingViewWidget.module.css
export const tradingViewStyles = `
/* src/components/features/TradingViewWidget/TradingViewWidget.module.css */
.container {
  width: 100%;
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  position: relative;
}

.chartContainer {
  width: 100%;
  position: relative;
}

.chartContainer iframe {
  border-radius: var(--radius-lg);
}

@media (max-width: 768px) {
  .container {
    border-radius: var(--radius-md);
  }
}
`;

// Uso no SymbolDetailPage:
/*
import { TradingViewWidget } from '@/components/features/TradingViewWidget/TradingViewWidget';

// Dentro do componente:
<TradingViewWidget 
  symbol={symbol} 
  theme="dark"
  height={500}
  interval="D"
/>
*/