'use client';

import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import styles from './PortfolioChart.module.css';

// Mock data - Na integração real virá da API
const data = [
  { date: 'Jan', value: 4000 },
  { date: 'Feb', value: 3000 },
  { date: 'Mar', value: 2000 },
  { date: 'Apr', value: 2780 },
  { date: 'May', value: 1890 },
  { date: 'Jun', value: 2390 },
  { date: 'Jul', value: 3490 },
];

export default function PortfolioChart() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>Portfolio Performance</h3>
        <div className={styles.timeframes}>
          <button className={styles.active}>1M</button>
          <button>3M</button>
          <button>1Y</button>
          <button>ALL</button>
        </div>
      </div>
      
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="var(--color-text-secondary)" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="var(--color-text-secondary)" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--color-bg-elevated)', 
                borderColor: 'var(--color-border)',
                borderRadius: '8px'
              }}
              itemStyle={{ color: 'var(--color-text-primary)' }}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="var(--color-primary)" 
              fillOpacity={1} 
              fill="url(#colorValue)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}