// src/app/dashboard/alerts/page.tsx
'use client';

import { useState } from 'react';
import styles from './Alerts.module.css';

export default function AlertsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Mock alerts local por enquanto
  const alerts = [
    { id: '1', symbol: 'AAPL', condition: 'Above $180', status: 'ACTIVE' },
    { id: '2', symbol: 'BTC', condition: 'Below $60k', status: 'TRIGGERED' },
  ];

  const handleCreateAlert = () => {
    // TODO: Implementar modal de criação de alerta
    alert('Alert creation modal coming soon!');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Price Alerts</h1>
        <button onClick={handleCreateAlert}>+ New Alert</button>
      </div>

      <div className={styles.list}>
        {alerts.map(alert => (
          <div key={alert.id} className={styles.alertItem}>
            <div className={styles.info}>
                <strong>{alert.symbol}</strong>
                <span>{alert.condition}</span>
            </div>
            <span className={alert.status === 'ACTIVE' ? styles.active : styles.triggered}>
                {alert.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}