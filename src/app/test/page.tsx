/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/test/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import styles from './test.module.css';

interface HealthCheck {
  status: string;
  checks: {
    api: boolean;
    database: boolean;
    redis: boolean;
    timestamp: string;
  };
}

export default function TestPage() {
  const [health, setHealth] = useState<HealthCheck | null>(null);
  const [loading, setLoading] = useState(false);
  const [symbol, setSymbol] = useState('AAPL');
  const [quoteData, setQuoteData] = useState<any>(null);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setHealth(data);
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuote = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/markets/quote?symbol=${symbol}`);
      const data = await res.json();
      setQuoteData(data);
    } catch (error) {
      console.error('Quote fetch failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1>🧪 Financial Marketplace - Test Page</h1>
        
        {/* Health Check Section */}
        <section className={styles.section}>
          <h2>🏥 Health Check</h2>
          <Button onClick={checkHealth} loading={loading}>
            Refresh Health Check
          </Button>
          
          {health && (
            <div className={styles.healthResults}>
              <div className={styles.statusBadge} data-status={health.status}>
                Status: {health.status}
              </div>
              
              <div className={styles.checks}>
                <div className={styles.check}>
                  <span>API:</span>
                  <span className={health.checks.api ? styles.success : styles.error}>
                    {health.checks.api ? '✅' : '❌'}
                  </span>
                </div>
                
                <div className={styles.check}>
                  <span>Database:</span>
                  <span className={health.checks.database ? styles.success : styles.error}>
                    {health.checks.database ? '✅' : '❌'}
                  </span>
                </div>
                
                <div className={styles.check}>
                  <span>Redis:</span>
                  <span className={health.checks.redis ? styles.success : styles.error}>
                    {health.checks.redis ? '✅' : '❌'}
                  </span>
                </div>
              </div>
              
              <p className={styles.timestamp}>
                Last checked: {new Date(health.checks.timestamp).toLocaleString()}
              </p>
            </div>
          )}
        </section>

        {/* Market Data Test */}
        <section className={styles.section}>
          <h2>📈 Market Data Test</h2>
          
          <div className={styles.inputGroup}>
            <Input
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="Enter symbol (e.g., AAPL)"
              label="Symbol"
            />
            <Button onClick={fetchQuote} loading={loading}>
              Fetch Quote
            </Button>
          </div>
          
          {quoteData && (
            <div className={styles.quoteResults}>
              <pre>{JSON.stringify(quoteData, null, 2)}</pre>
            </div>
          )}
        </section>

        {/* Component Showcase */}
        <section className={styles.section}>
          <h2>🎨 UI Components</h2>
          
          <div className={styles.showcase}>
            <div className={styles.group}>
              <h3>Buttons</h3>
              <div className={styles.buttonGroup}>
                <Button variant="primary" size="sm">Primary Small</Button>
                <Button variant="primary" size="md">Primary Medium</Button>
                <Button variant="primary" size="lg">Primary Large</Button>
              </div>
              
              <div className={styles.buttonGroup}>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="success">Success</Button>
              </div>
              
              <div className={styles.buttonGroup}>
                <Button loading>Loading...</Button>
                <Button disabled>Disabled</Button>
              </div>
            </div>
            
            <div className={styles.group}>
              <h3>Inputs</h3>
              <Input label="Email" type="email" placeholder="your@email.com" />
              <Input label="Password" type="password" placeholder="••••••••" />
              <Input 
                label="With Helper" 
                helperText="This is a helper text"
                placeholder="Enter value"
              />
              <Input 
                label="With Error" 
                error="This field is required"
                placeholder="Enter value"
              />
            </div>
          </div>
        </section>

        {/* Database Test */}
        <section className={styles.section}>
          <h2>🗄️ Database Connection</h2>
          <p>Check Prisma Studio for seeded data:</p>
          <code className={styles.code}>npx prisma studio</code>
          
          <ul className={styles.list}>
            <li>✅ Achievements (10 items)</li>
            <li>✅ Subscription Plans (3 items)</li>
            <li>✅ Market Symbols (10 items)</li>
            <li>✅ Demo User (demo@finmarket.com / demo123456)</li>
            <li>✅ Demo Portfolio with positions</li>
            <li>✅ Demo Watchlist</li>
            <li>✅ Demo Alert</li>
          </ul>
        </section>

        {/* Environment Check */}
        <section className={styles.section}>
          <h2>🔧 Environment Variables</h2>
          <div className={styles.envCheck}>
            <div className={styles.envItem}>
              <span>Database URL:</span>
              <span className={process.env.NEXT_PUBLIC_APP_URL ? styles.success : styles.error}>
                {process.env.NEXT_PUBLIC_APP_URL ? '✅' : '❌'}
              </span>
            </div>
            <div className={styles.envItem}>
              <span>NextAuth Secret:</span>
              <span className={styles.success}>✅</span>
            </div>
            <div className={styles.envItem}>
              <span>Supabase URL:</span>
              <span className={process.env.NEXT_PUBLIC_SUPABASE_URL ? styles.success : styles.error}>
                {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅' : '❌'}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}