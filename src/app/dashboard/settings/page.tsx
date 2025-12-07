// src/app/dashboard/settings/page.tsx
'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import styles from './Settings.module.css';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences'>('profile');

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      signOut({ callbackUrl: '/auth/login' });
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Settings</h1>
      </div>

      <div className={styles.layout}>
        {/* Sidebar */}
        <div className={styles.sidebar}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'profile' ? styles.active : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            👤 Profile
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'security' ? styles.active : ''}`}
            onClick={() => setActiveTab('security')}
          >
            🔒 Security
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'preferences' ? styles.active : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            ⚙️ Preferences
          </button>

          <div className={styles.divider} />

          <button className={`${styles.tabBtn} ${styles.danger}`} onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>

        {/* Main Content */}
        <div className={styles.main}>
          {activeTab === 'profile' && (
            <div className={styles.section}>
              <h2>Profile Information</h2>
              <p className={styles.subtitle}>Update your personal details</p>

              <form className={styles.form}>
                <Input
                  label="Name"
                  defaultValue={session?.user?.name || ''}
                  placeholder="Your name"
                  fullWidth
                />

                <Input
                  label="Email"
                  type="email"
                  defaultValue={session?.user?.email || ''}
                  placeholder="your@email.com"
                  fullWidth
                  disabled
                />

                <Input
                  label="Username"
                  defaultValue={session?.user?.username || ''}
                  placeholder="@username"
                  fullWidth
                />

                <Button variant="primary">Save Changes</Button>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div className={styles.section}>
              <h2>Security Settings</h2>
              <p className={styles.subtitle}>Manage your account security</p>

              <div className={styles.securityOptions}>
                <div className={styles.securityItem}>
                  <div>
                    <h3>Change Password</h3>
                    <p>Update your password to keep your account secure</p>
                  </div>
                  <Button variant="secondary" size="sm">Change</Button>
                </div>

                <div className={styles.securityItem}>
                  <div>
                    <h3>Two-Factor Authentication</h3>
                    <p>Add an extra layer of security to your account</p>
                  </div>
                  <Button variant="secondary" size="sm">Enable</Button>
                </div>

                <div className={styles.securityItem}>
                  <div>
                    <h3>Active Sessions</h3>
                    <p>View and manage your active sessions</p>
                  </div>
                  <Button variant="secondary" size="sm">View</Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className={styles.section}>
              <h2>Preferences</h2>
              <p className={styles.subtitle}>Customize your experience</p>

              <div className={styles.preferencesList}>
                <div className={styles.preferenceItem}>
                  <div>
                    <h3>Theme</h3>
                    <p>Choose your preferred theme</p>
                  </div>
                  <select className={styles.select}>
                    <option>Dark</option>
                    <option>Light</option>
                    <option>System</option>
                  </select>
                </div>

                <div className={styles.preferenceItem}>
                  <div>
                    <h3>Currency</h3>
                    <p>Default currency for display</p>
                  </div>
                  <select className={styles.select}>
                    <option>USD ($)</option>
                    <option>EUR (€)</option>
                    <option>GBP (£)</option>
                  </select>
                </div>

                <div className={styles.preferenceItem}>
                  <div>
                    <h3>Email Notifications</h3>
                    <p>Receive alerts via email</p>
                  </div>
                  <input type="checkbox" defaultChecked />
                </div>

                <div className={styles.preferenceItem}>
                  <div>
                    <h3>Push Notifications</h3>
                    <p>Receive push notifications</p>
                  </div>
                  <input type="checkbox" defaultChecked />
                </div>
              </div>

              <Button variant="primary">Save Preferences</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}