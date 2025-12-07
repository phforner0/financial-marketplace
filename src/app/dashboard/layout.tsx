// src/app/(dashboard)/layout.tsx
import Sidebar from '@/components/layouts/Sidebar/Sidebar';
import Header from '@/components/layouts/Header/Header';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import styles from './DashboardLayout.module.css';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
    <div className={styles.layout}>
      <Sidebar />
      
      <div className={styles.main}>
        <Header />
        
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
        <a href="/markets" className={styles.bottomNavItem}>
          <span className={styles.bottomNavIcon}>📊</span>
          <span className={styles.bottomNavLabel}>Markets</span>
        </a>
        <a href="/portfolio" className={styles.bottomNavItem}>
          <span className={styles.bottomNavIcon}>💼</span>
          <span className={styles.bottomNavLabel}>Portfolio</span>
        </a>
        <a href="/watchlists" className={styles.bottomNavItem}>
          <span className={styles.bottomNavIcon}>⭐</span>
          <span className={styles.bottomNavLabel}>Lists</span>
        </a>
        <a href="/settings" className={styles.bottomNavItem}>
          <span className={styles.bottomNavIcon}>⚙️</span>
          <span className={styles.bottomNavLabel}>More</span>
        </a>
      </nav>
    </div>
    </ErrorBoundary>
  );
}