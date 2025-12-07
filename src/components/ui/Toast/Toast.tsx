// src/components/ui/Toast/Toast.tsx
'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import styles from './Toast.module.css';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
}

interface ToastContextType {
  showToast: (type: ToastType, message: string, description?: string) => void;
  success: (message: string, description?: string) => void;
  error: (message: string, description?: string) => void;
  warning: (message: string, description?: string) => void;
  info: (message: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, message: string, description?: string) => {
      const id = Math.random().toString(36).substring(2, 9);
      const toast: Toast = { id, type, message, description };
      
      setToasts((prev) => [...prev, toast]);

      // Auto remove after 5 seconds
      setTimeout(() => {
        removeToast(id);
      }, 5000);
    },
    [removeToast]
  );

  const success = useCallback((message: string, description?: string) => {
    showToast('success', message, description);
  }, [showToast]);

  const error = useCallback((message: string, description?: string) => {
    showToast('error', message, description);
  }, [showToast]);

  const warning = useCallback((message: string, description?: string) => {
    showToast('warning', message, description);
  }, [showToast]);

  const info = useCallback((message: string, description?: string) => {
    showToast('info', message, description);
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      <div className={styles.toastContainer}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`${styles.toast} ${styles[toast.type]}`}
            onClick={() => removeToast(toast.id)}
          >
            <div className={styles.toastIcon}>
              {toast.type === 'success' && '✓'}
              {toast.type === 'error' && '✕'}
              {toast.type === 'warning' && '⚠'}
              {toast.type === 'info' && 'ℹ'}
            </div>
            <div className={styles.toastContent}>
              <div className={styles.toastMessage}>{toast.message}</div>
              {toast.description && (
                <div className={styles.toastDescription}>{toast.description}</div>
              )}
            </div>
            <button
              className={styles.toastClose}
              onClick={(e) => {
                e.stopPropagation();
                removeToast(toast.id);
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

// Toast.module.css
export const toastStyles = `
/* src/components/ui/Toast/Toast.module.css */
.toastContainer {
  position: fixed;
  top: var(--space-xl);
  right: var(--space-xl);
  z-index: var(--z-notification);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: flex-start;
  gap: var(--space-md);
  min-width: 300px;
  max-width: 400px;
  padding: var(--space-lg);
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-2xl);
  pointer-events: all;
  cursor: pointer;
  animation: slideInRight 0.3s ease-out;
  transition: all var(--transition-fast);
}

.toast:hover {
  transform: translateX(-4px);
  box-shadow: var(--shadow-xl);
}

.toast.success {
  border-left: 4px solid var(--color-success);
}

.toast.error {
  border-left: 4px solid var(--color-danger);
}

.toast.warning {
  border-left: 4px solid var(--color-warning);
}

.toast.info {
  border-left: 4px solid var(--color-info);
}

.toastIcon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-lg);
  flex-shrink: 0;
  border-radius: 50%;
}

.success .toastIcon {
  background-color: var(--color-success-light);
  color: var(--color-success);
}

.error .toastIcon {
  background-color: var(--color-danger-light);
  color: var(--color-danger);
}

.warning .toastIcon {
  background-color: var(--color-warning-light);
  color: var(--color-warning);
}

.info .toastIcon {
  background-color: var(--color-info-light);
  color: var(--color-info);
}

.toastContent {
  flex: 1;
  min-width: 0;
}

.toastMessage {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: 4px;
}

.toastDescription {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: var(--line-height-normal);
}

.toastClose {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--color-text-tertiary);
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.toastClose:hover {
  background-color: var(--color-bg-hover);
  color: var(--color-text-primary);
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@media (max-width: 768px) {
  .toastContainer {
    top: var(--space-md);
    right: var(--space-md);
    left: var(--space-md);
  }

  .toast {
    min-width: auto;
    max-width: none;
  }
}
`;