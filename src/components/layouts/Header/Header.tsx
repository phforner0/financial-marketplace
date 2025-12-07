// src/components/layouts/Header/Header.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Header.module.css';

export default function Header() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Keyboard shortcut CMD+K / CTRL+K
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('global-search')?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className={styles.header}>
      {/* Left Section */}
      <div className={styles.left}>
        <h1 className={styles.pageTitle}>Dashboard</h1>
      </div>

      {/* Center Section - Search */}
      <div className={styles.center}>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <div className={`${styles.searchContainer} ${isSearchFocused ? styles.searchContainerFocused : ''}`}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              id="global-search"
              type="text"
              placeholder="Search stocks, crypto, ETFs... (⌘K)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className={styles.searchClear}
              >
                ✕
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Right Section */}
      <div className={styles.right}>
        {/* Notifications */}
        <button className={styles.iconButton}>
          <span className={styles.icon}>🔔</span>
          <span className={styles.badge}>3</span>
        </button>

        {/* User Menu */}
        <button className={styles.iconButton}>
          <span className={styles.icon}>👤</span>
        </button>
      </div>
    </header>
  );
}