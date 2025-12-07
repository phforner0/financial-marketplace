// src/components/features/TradeModal/TradeModal.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import styles from './TradeModal.module.css';

interface TradeModalProps {
  symbol: string;
  currentPrice: number;
  onClose: () => void;
}

type OrderSide = 'BUY' | 'SELL';
type OrderType = 'MARKET' | 'LIMIT' | 'STOP';

export function TradeModal({ symbol, currentPrice, onClose }: TradeModalProps) {
  const [side, setSide] = useState<OrderSide>('BUY');
  const [orderType, setOrderType] = useState<OrderType>('MARKET');
  const [quantity, setQuantity] = useState<string>('');
  const [limitPrice, setLimitPrice] = useState<string>(currentPrice.toString());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const totalCost = parseFloat(quantity || '0') * (orderType === 'MARKET' ? currentPrice : parseFloat(limitPrice || '0'));

  async function handleSubmit() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/broker/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          side,
          type: orderType,
          qty: parseFloat(quantity),
          limitPrice: orderType === 'LIMIT' ? parseFloat(limitPrice) : undefined,
          timeInForce: 'DAY'
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to place order');
      }

      // Sucesso
      alert('Order placed successfully!');
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>{side} {symbol}</h2>
          <button onClick={onClose} className={styles.closeBtn}>✕</button>
        </div>

        <div className={styles.content}>
          {/* Side Selector */}
          <div className={styles.sideSelector}>
            <button
              className={`${styles.sideBtn} ${side === 'BUY' ? styles.sideBtnActive : ''}`}
              onClick={() => setSide('BUY')}
            >
              Buy
            </button>
            <button
              className={`${styles.sideBtn} ${side === 'SELL' ? styles.sideBtnActive : ''}`}
              onClick={() => setSide('SELL')}
            >
              Sell
            </button>
          </div>

          {/* Current Price */}
          <div className={styles.priceDisplay}>
            <span className={styles.priceLabel}>Current Price:</span>
            <span className={styles.priceValue}>${currentPrice.toFixed(2)}</span>
          </div>

          {/* Order Type */}
          <div className={styles.field}>
            <label>Order Type</label>
            <select
              value={orderType}
              onChange={e => setOrderType(e.target.value as OrderType)}
              className={styles.select}
            >
              <option value="MARKET">Market (Execute Immediately)</option>
              <option value="LIMIT">Limit (Set Max Price)</option>
              <option value="STOP">Stop Loss</option>
            </select>
          </div>

          {/* Quantity */}
          <Input
            type="number"
            label="Quantity (shares)"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            placeholder="0"
            fullWidth
            required
          />

          {/* Limit Price (if LIMIT order) */}
          {orderType === 'LIMIT' && (
            <Input
              type="number"
              label="Limit Price"
              value={limitPrice}
              onChange={e => setLimitPrice(e.target.value)}
              placeholder={currentPrice.toString()}
              fullWidth
              required
            />
          )}

          {/* Preview */}
          <div className={styles.preview}>
            <div className={styles.previewRow}>
              <span>Shares:</span>
              <span>{quantity || 0}</span>
            </div>
            <div className={styles.previewRow}>
              <span>Est. Price:</span>
              <span>${orderType === 'MARKET' ? currentPrice.toFixed(2) : limitPrice}/share</span>
            </div>
            <div className={styles.previewRow}>
              <span>Commission:</span>
              <span>$0.00</span>
            </div>
            <div className={`${styles.previewRow} ${styles.previewTotal}`}>
              <span>Total:</span>
              <span>${totalCost.toFixed(2)}</span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className={styles.error}>{error}</div>
          )}

          {/* Actions */}
          <div className={styles.actions}>
            <Button variant="ghost" onClick={onClose} fullWidth>
              Cancel
            </Button>
            <Button
              variant={side === 'BUY' ? 'primary' : 'danger'}
              onClick={handleSubmit}
              loading={loading}
              disabled={!quantity || parseFloat(quantity) <= 0}
              fullWidth
            >
              {side === 'BUY' ? 'Place Buy Order' : 'Place Sell Order'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}