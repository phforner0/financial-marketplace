// src/app/dashboard/layout.tsx
import Sidebar from '@/components/layouts/Sidebar/Sidebar';
import Header from '@/components/layouts/Header/Header';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import styles from './DashboardLayout.module.css';
import { ToastProvider } from '@/components/ui/Toast/Toast';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <ToastProvider>
      <div className={styles.layout}>
        {/* Sidebar - Desktop Only */}
        <Sidebar />
        
        {/* Main Content Area */}
        <div className={styles.main}>
          {/* Header */}
          <Header />
          
          {/* Page Content */}
          <main className={styles.content}>
            {children}
          </main>
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className={styles.bottomNav}>
          <a href="/dashboard" className={styles.bottomNavItem}>
            <span className={styles.bottomNavIcon}>🏠</span>
            <span className={styles.bottomNavLabel}>Home</span>
          </a>
          <a href="/dashboard/markets" className={styles.bottomNavItem}>
            <span className={styles.bottomNavIcon}>📊</span>
            <span className={styles.bottomNavLabel}>Markets</span>
          </a>
          <a href="/dashboard/portfolio" className={styles.bottomNavItem}>
            <span className={styles.bottomNavIcon}>💼</span>
            <span className={styles.bottomNavLabel}>Portfolio</span>
          </a>
          <a href="/dashboard/watchlists" className={styles.bottomNavItem}>
            <span className={styles.bottomNavIcon}>⭐</span>
            <span className={styles.bottomNavLabel}>Lists</span>
          </a>
          <a href="/dashboard/settings" className={styles.bottomNavItem}>
            <span className={styles.bottomNavIcon}>⚙️</span>
            <span className={styles.bottomNavLabel}>More</span>
          </a>
        </nav>
      </div>
      </ToastProvider>
    </ErrorBoundary>
  );
}