// src/app/dashboard/watchlists/page.tsx
'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/Button/Button';
import { WatchlistTable } from '@/components/features/WatchlistTable/WatchlistTable';
import styles from './Watchlists.module.css';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function WatchlistsPage() {
  const { data: watchlists, error, mutate } = useSWR('/api/watchlists', fetcher);
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const handleCreateList = async () => {
    const name = prompt('Enter watchlist name:');
    if (!name) return;

    setCreating(true);
    try {
      const res = await fetch('/api/watchlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      
      if (res.ok) {
        mutate();
      }
    } catch (err) {
      console.error('Failed to create watchlist:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteList = async (id: string) => {
    if (!confirm('Delete this watchlist?')) return;

    try {
      await fetch(`/api/watchlists/${id}`, { method: 'DELETE' });
      mutate();
      if (selectedList === id) setSelectedList(null);
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const currentList = watchlists?.find((w: any) => w.id === selectedList);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>My Watchlists</h1>
        <Button onClick={handleCreateList} loading={creating}>
          + New Watchlist
        </Button>
      </div>

      <div className={styles.layout}>
        {/* Sidebar */}
        <div className={styles.sidebar}>
          {error && <div className={styles.error}>Failed to load watchlists</div>}
          
          {!watchlists && !error && <div className={styles.loading}>Loading...</div>}
          
          {watchlists && watchlists.length === 0 && (
            <div className={styles.empty}>
              <p>No watchlists yet</p>
              <Button size="sm" onClick={handleCreateList}>Create One</Button>
            </div>
          )}

          {watchlists?.map((list: any) => (
            <div
              key={list.id}
              className={`${styles.listItem} ${selectedList === list.id ? styles.active : ''}`}
              onClick={() => setSelectedList(list.id)}
            >
              <div className={styles.listInfo}>
                <strong>{list.name}</strong>
                <span>{list.items?.length || 0} items</span>
              </div>
              <button
                className={styles.deleteBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteList(list.id);
                }}
              >
                🗑️
              </button>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className={styles.main}>
          {!currentList && (
            <div className={styles.placeholder}>
              <span style={{ fontSize: '3rem' }}>⭐</span>
              <h3>Select a watchlist</h3>
              <p>Choose a list from the sidebar to view details</p>
            </div>
          )}

          {currentList && (
            <>
              <div className={styles.listHeader}>
                <div>
                  <h2>{currentList.name}</h2>
                  {currentList.description && <p>{currentList.description}</p>}
                </div>
              </div>

              {currentList.items?.length === 0 ? (
                <div className={styles.emptyList}>
                  <span style={{ fontSize: '3rem' }}>📊</span>
                  <h3>No stocks added yet</h3>
                  <p>Search for stocks and add them to this list</p>
                </div>
              ) : (
                <WatchlistTable
                  stocks={currentList.items.map((item: any) => ({
                    symbol: item.symbol,
                    price: 0, // TODO: Fetch live prices
                    change: 0,
                    changePercent: 0,
                    volume: 0
                  }))}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}