// src/components/features/PortfolioChart/PortfolioChart.tsx - VERSÃO COMPLETA
'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, ReferenceLine
} from 'recharts';
import styles from './PortfolioChart.module.css';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface PortfolioChartProps {
  portfolioId?: string;
}

type Timeframe = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

export default function PortfolioChart({ portfolioId }: PortfolioChartProps) {
  const [timeframe, setTimeframe] = useState<Timeframe>('1M');
  const [showBenchmark, setShowBenchmark] = useState(true);

  const { data, error, isLoading } = useSWR(
    `/api/portfolio/history?timeframe=${timeframe}`,
    fetcher,
    { refreshInterval: 60000 }
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    
    if (timeframe === '1D') {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (timeframe === '1W' || timeframe === '1M') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      return (
        <div className={styles.tooltip}>
          <div className={styles.tooltipDate}>
            {new Date(data.date).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric',
              hour: timeframe === '1D' ? '2-digit' : undefined,
              minute: timeframe === '1D' ? '2-digit' : undefined
            })}
          </div>
          
          <div className={styles.tooltipRow}>
            <span className={styles.tooltipLabel}>Portfolio:</span>
            <span className={styles.tooltipValue}>{formatCurrency(data.totalValue)}</span>
          </div>
          
          {showBenchmark && data.benchmark && (
            <div className={styles.tooltipRow}>
              <span className={styles.tooltipLabel}>S&P 500:</span>
              <span className={styles.tooltipValue}>{formatCurrency(data.benchmark)}</span>
            </div>
          )}
          
          {data.pnl !== undefined && (
            <div className={styles.tooltipRow}>
              <span className={styles.tooltipLabel}>P/L:</span>
              <span className={`${styles.tooltipValue} ${data.pnl >= 0 ? styles.positive : styles.negative}`}>
                {formatCurrency(data.pnl)} ({data.pnlPercent >= 0 ? '+' : ''}{data.pnlPercent.toFixed(2)}%)
              </span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Portfolio Performance</h3>
          <div className={styles.subtitle}>
            Track your portfolio value over time
          </div>
        </div>
        
        <div className={styles.controls}>
          {/* Timeframe Selector */}
          <div className={styles.timeframes}>
            {(['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                className={timeframe === tf ? styles.active : ''}
                onClick={() => setTimeframe(tf)}
              >
                {tf}
              </button>
            ))}
          </div>
          
          {/* Benchmark Toggle */}
          <button
            className={`${styles.benchmarkToggle} ${showBenchmark ? styles.active : ''}`}
            onClick={() => setShowBenchmark(!showBenchmark)}
            title="Toggle S&P 500 comparison"
          >
            📊 Benchmark
          </button>
        </div>
      </div>

      <div className={styles.chartWrapper}>
        {isLoading && (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <p>Loading chart data...</p>
          </div>
        )}

        {error && (
          <div className={styles.error}>
            <span style={{ fontSize: '2rem' }}>⚠️</span>
            <p>Failed to load chart data</p>
          </div>
        )}

        {data && !isLoading && !error && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorBenchmark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6b7280" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#6b7280" stopOpacity={0}/>
                </linearGradient>
              </defs>
              
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="var(--color-border)" 
                vertical={false}
              />
              
              <XAxis 
                dataKey="date" 
                stroke="var(--color-text-secondary)" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatDate}
              />
              
              <YAxis 
                stroke="var(--color-text-secondary)" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatCurrency}
                domain={['dataMin - 1000', 'dataMax + 1000']}
              />
              
              <Tooltip content={<CustomTooltip />} />
              
              <Legend 
                wrapperStyle={{ 
                  paddingTop: '20px',
                  fontSize: '14px',
                  color: 'var(--color-text-secondary)'
                }}
              />

              {/* Baseline para P/L zero */}
              {data[0] && (
                <ReferenceLine 
                  y={data[0].totalValue} 
                  stroke="var(--color-border-hover)" 
                  strokeDasharray="3 3"
                  label={{ value: 'Initial', position: 'right' }}
                />
              )}
              
              {showBenchmark && (
                <Area 
                  type="monotone" 
                  dataKey="benchmark" 
                  stroke="#6b7280" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorBenchmark)"
                  name="S&P 500"
                />
              )}
              
              <Area 
                type="monotone" 
                dataKey="totalValue" 
                stroke="#10b981" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorValue)"
                name="Portfolio Value"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}