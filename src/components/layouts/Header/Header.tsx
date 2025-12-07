// src/components/layouts/Header/Header.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Header.module.css';

interface SearchResult {
  symbol: string;
  name: string;
  price: number;
  changePercent: number;
  exchange: string;
}

export default function Header() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Search function
  const performSearch = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    
    try {
      const response = await fetch(`/api/markets/search?q=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const data = await response.json();
      setSearchResults(data || []);
      setShowDropdown(true);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (searchQuery.length >= 2) {
      debounceTimer.current = setTimeout(() => {
        performSearch(searchQuery);
      }, 300);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut CMD+K / CTRL+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('global-search')?.focus();
      }

      // ESC to close dropdown
      if (e.key === 'Escape') {
        setShowDropdown(false);
        setSearchQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleResultClick = (symbol: string) => {
    setShowDropdown(false);
    setSearchQuery('');
    router.push(`/dashboard/markets/${symbol}`);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
  };

  return (
    <header className={styles.header}>
      {/* Left Section */}
      <div className={styles.left}>
        <h1 className={styles.pageTitle}>Dashboard</h1>
      </div>

      {/* Center Section - Search */}
      <div className={styles.center} ref={searchRef}>
        <div className={styles.searchWrapper}>
          <div className={`${styles.searchContainer} ${isSearchFocused ? styles.searchContainerFocused : ''}`}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              id="global-search"
              type="text"
              placeholder="Search stocks, crypto, ETFs... (⌘K)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                setIsSearchFocused(true);
                if (searchQuery.length >= 2 && searchResults.length > 0) {
                  setShowDropdown(true);
                }
              }}
              onBlur={() => setIsSearchFocused(false)}
              className={styles.searchInput}
            />
            {isSearching && (
              <div className={styles.searchSpinner} />
            )}
            {searchQuery && !isSearching && (
              <button
                type="button"
                onClick={handleClearSearch}
                className={styles.searchClear}
              >
                ✕
              </button>
            )}
          </div>

          {/* Dropdown Results */}
          {showDropdown && (
            <div className={styles.searchDropdown}>
              {searchResults.length > 0 ? (
                <>
                  {searchResults.map((result) => (
                    <div
                      key={result.symbol}
                      className={styles.searchResult}
                      onClick={() => handleResultClick(result.symbol)}
                    >
                      <div className={styles.resultLeft}>
                        <div className={styles.resultSymbol}>{result.symbol}</div>
                        <div className={styles.resultName}>{result.name}</div>
                      </div>
                      <div className={styles.resultRight}>
                        {result.price > 0 && (
                          <>
                            <div className={styles.resultPrice}>
                              ${result.price.toFixed(2)}
                            </div>
                            <div className={`${styles.resultChange} ${result.changePercent >= 0 ? styles.positive : styles.negative}`}>
                              {result.changePercent >= 0 ? '+' : ''}{result.changePercent.toFixed(2)}%
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className={styles.searchEmpty}>
                  <span style={{ fontSize: '2rem', marginBottom: '8px' }}>🔍</span>
                  <div>No results found for "{searchQuery}"</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Section */}
      <div className={styles.right}>
        {/* Notifications */}
        <button className={styles.iconButton} onClick={() => router.push('/dashboard/alerts')}>
          <span className={styles.icon}>🔔</span>
          <span className={styles.badge}>3</span>
        </button>

        {/* User Menu */}
        <button className={styles.iconButton} onClick={() => router.push('/dashboard/settings')}>
          <span className={styles.icon}>👤</span>
        </button>
      </div>
    </header>
  );
}