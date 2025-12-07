'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Sidebar.module.css';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/dashboard/markets', label: 'Markets', icon: '📊' },
  { href: '/dashboard/portfolio', label: 'Portfolio', icon: '💼' },
  { href: '/dashboard/watchlists', label: 'Watchlists', icon: '⭐' },
  { href: '/dashboard/alerts', label: 'Alerts', icon: '🔔' },
  { href: '/dashboard/settings', label: 'Settings', icon: '⚙️' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <Link href="/dashboard" className={styles.logo}>
        💼 FinMarket
      </Link>
      
      <nav className={styles.nav}>
        {menuItems.map((item) => {
          const isActive = item.href === '/dashboard' 
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href);

          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <span className={styles.icon}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}