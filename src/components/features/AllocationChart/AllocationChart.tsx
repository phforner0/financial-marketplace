// src/components/features/AllocationChart/AllocationChart.tsx
'use client';

import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import styles from './AllocationChart.module.css';

interface AllocationChartProps {
  byAssetType?: Record<string, number>;
  bySector?: Record<string, { value: number; symbols: string[] }>;
}

const ASSET_TYPE_COLORS: Record<string, string> = {
  STOCKS: '#10b981',
  CRYPTO: '#f59e0b',
  ETF: '#3b82f6',
  CASH: '#6b7280'
};

const SECTOR_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', 
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
];

export function AllocationChart({ byAssetType, bySector }: AllocationChartProps) {
  const [view, setView] = useState<'assetType' | 'sector'>('assetType');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Prepara dados por tipo de ativo
  const assetTypeData = byAssetType 
    ? Object.entries(byAssetType)
        .filter(([_, value]) => value > 0)
        .map(([name, value]) => ({ name, value }))
    : [];

  // Prepara dados por setor
  const sectorData = bySector
    ? Object.entries(bySector)
        .filter(([_, data]) => data.value > 0)
        .map(([name, data]) => ({ 
          name, 
          value: data.value,
          symbols: data.symbols 
        }))
    : [];

  const currentData = view === 'assetType' ? assetTypeData : sectorData;
  const totalValue = currentData.reduce((sum, item) => sum + item.value, 0);

  // Calcula score de diversificação (1-10)
  const diversificationScore = (() => {
    if (currentData.length === 0) return 0;
    if (currentData.length === 1) return 3;
    if (currentData.length === 2) return 5;
    if (currentData.length >= 3 && currentData.length <= 5) return 7;
    if (currentData.length > 5) return 9;
    return 0;
  })();

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((data.value / totalValue) * 100).toFixed(1);
      
      return (
        <div className={styles.tooltip}>
          <div className={styles.tooltipTitle}>{data.name}</div>
          <div className={styles.tooltipValue}>
            {formatCurrency(data.value)} ({percentage}%)
          </div>
          {data.symbols && (
            <div className={styles.tooltipSymbols}>
              {data.symbols.join(', ')}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Não mostra label para < 5%

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12px"
        fontWeight="600"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (!byAssetType || Object.keys(byAssetType).length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>Asset Allocation</h3>
        </div>
        <div className={styles.empty}>
          <span style={{ fontSize: '3rem' }}>📊</span>
          <p>No allocation data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Asset Allocation</h3>
          <div className={styles.subtitle}>
            Portfolio distribution analysis
          </div>
        </div>
        
        <div className={styles.viewToggle}>
          <button
            className={view === 'assetType' ? styles.active : ''}
            onClick={() => setView('assetType')}
          >
            By Type
          </button>
          <button
            className={view === 'sector' ? styles.active : ''}
            onClick={() => setView('sector')}
          >
            By Sector
          </button>
        </div>
      </div>

      <div className={styles.content}>
        {/* Pie Chart */}
        <div className={styles.chartWrapper}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={currentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={CustomLabel}
                outerRadius={120}
                innerRadius={60}
                fill="#8884d8"
                dataKey="value"
                paddingAngle={2}
              >
                {currentData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={
                      view === 'assetType'
                        ? ASSET_TYPE_COLORS[entry.name] || '#6b7280'
                        : SECTOR_COLORS[index % SECTOR_COLORS.length]
                    }
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend & Stats */}
        <div className={styles.details}>
          {/* Diversification Score */}
          <div className={styles.scoreCard}>
            <div className={styles.scoreLabel}>Diversification Score</div>
            <div className={styles.scoreValue}>
              {diversificationScore}/10
            </div>
            <div className={styles.scoreBar}>
              <div 
                className={styles.scoreFill}
                style={{ 
                  width: `${diversificationScore * 10}%`,
                  backgroundColor: 
                    diversificationScore >= 7 ? '#10b981' :
                    diversificationScore >= 5 ? '#f59e0b' :
                    '#ef4444'
                }}
              />
            </div>
            <div className={styles.scoreDesc}>
              {diversificationScore >= 7 && 'Well diversified'}
              {diversificationScore >= 5 && diversificationScore < 7 && 'Moderately diversified'}
              {diversificationScore < 5 && 'Consider diversifying more'}
            </div>
          </div>

          {/* Allocation List */}
          <div className={styles.allocationList}>
            {currentData
              .sort((a, b) => b.value - a.value)
              .map((item, index) => {
                const percentage = ((item.value / totalValue) * 100).toFixed(1);
                
                return (
                  <div key={item.name} className={styles.allocationItem}>
                    <div className={styles.allocationHeader}>
                      <div className={styles.allocationDot} style={{
                        backgroundColor: view === 'assetType'
                          ? ASSET_TYPE_COLORS[item.name] || '#6b7280'
                          : SECTOR_COLORS[index % SECTOR_COLORS.length]
                      }} />
                      <span className={styles.allocationName}>{item.name}</span>
                      <span className={styles.allocationPercent}>{percentage}%</span>
                    </div>
                    <div className={styles.allocationBar}>
                      <div 
                        className={styles.allocationFill}
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: view === 'assetType'
                            ? ASSET_TYPE_COLORS[item.name] || '#6b7280'
                            : SECTOR_COLORS[index % SECTOR_COLORS.length]
                        }}
                      />
                    </div>
                    <div className={styles.allocationValue}>
                      {formatCurrency(item.value)}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}