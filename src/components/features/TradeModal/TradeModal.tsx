// src/components/features/TradeModal/TradeModal.tsx - VERSÃO MELHORADA
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import styles from './TradeModal.module.css';

interface TradeModalProps {
  symbol: string;
  currentPrice: number;
  onClose: () => void;
  onSuccess?: () => void;
}

type OrderSide = 'BUY' | 'SELL';
type OrderType = 'MARKET' | 'LIMIT' | 'STOP';

interface PortfolioData {
  cash: number;
  positions: Array<{
    symbol: string;
    qty: number;
    avgPrice: number;
  }>;
}

export function TradeModal({ symbol, currentPrice, onClose, onSuccess }: TradeModalProps) {
  const [side, setSide] = useState<OrderSide>('BUY');
  const [orderType, setOrderType] = useState<OrderType>('MARKET');
  const [quantity, setQuantity] = useState<string>('');
  const [limitPrice, setLimitPrice] = useState<string>(currentPrice.toString());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loadingPortfolio, setLoadingPortfolio] = useState(true);

  // Fetch portfolio data on mount
  useEffect(() => {
    async function fetchPortfolio() {
      try {
        const response = await fetch('/api/portfolio');
        if (response.ok) {
          const data = await response.json();
          setPortfolioData({
            cash: data.cash || 0,
            positions: data.positions || []
          });
        }
      } catch (err) {
        console.error('Failed to fetch portfolio:', err);
      } finally {
        setLoadingPortfolio(false);
      }
    }

    fetchPortfolio();
  }, []);

  const executionPrice = orderType === 'MARKET' ? currentPrice : parseFloat(limitPrice || '0');
  const totalCost = parseFloat(quantity || '0') * executionPrice;
  const commission = 0; // Free trades

  // Find existing position
  const existingPosition = portfolioData?.positions.find(p => p.symbol === symbol);
  const availableShares = existingPosition?.qty || 0;

  // Validation
  const validateOrder = (): string | null => {
    if (!quantity || parseFloat(quantity) <= 0) {
      return 'Please enter a valid quantity';
    }

    if (orderType === 'LIMIT' && (!limitPrice || parseFloat(limitPrice) <= 0)) {
      return 'Please enter a valid limit price';
    }

    if (side === 'BUY') {
      if (!portfolioData) {
        return 'Loading portfolio data...';
      }
      
      if (totalCost > portfolioData.cash) {
        return `Insufficient funds. You have $${portfolioData.cash.toFixed(2)} available`;
      }
    } else {
      if (availableShares === 0) {
        return `You don't own any shares of ${symbol}`;
      }
      
      if (parseFloat(quantity) > availableShares) {
        return `Insufficient shares. You own ${availableShares} shares`;
      }
    }

    return null;
  };

  const handlePreview = () => {
    const validationError = validateOrder();
    
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setShowConfirmation(true);
  };

  const handleSubmit = async () => {
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to place order');
      }

      // Success - show notification and close
      if (onSuccess) {
        onSuccess();
      }
      
      // You can add toast notification here
      alert(`✅ Order placed successfully!\n${side} ${quantity} ${symbol} @ $${executionPrice.toFixed(2)}`);
      
      onClose();
    } catch (err: any) {
      setError(err.message);
      setShowConfirmation(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (showConfirmation) {
      setShowConfirmation(false);
    } else {
      onClose();
    }
  };

  return (
    <div className={styles.overlay} onClick={handleCancel}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>{showConfirmation ? 'Confirm Order' : `${side} ${symbol}`}</h2>
          <button onClick={onClose} className={styles.closeBtn}>✕</button>
        </div>

        {loadingPortfolio ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <p>Loading portfolio data...</p>
          </div>
        ) : showConfirmation ? (
          // Confirmation View
          <div className={styles.content}>
            <div className={styles.confirmationCard}>
              <h3 className={styles.confirmationTitle}>Review Your Order</h3>
              
              <div className={styles.confirmationDetails}>
                <div className={styles.confirmationRow}>
                  <span>Action:</span>
                  <strong className={side === 'BUY' ? styles.buyText : styles.sellText}>
                    {side}
                  </strong>
                </div>
                <div className={styles.confirmationRow}>
                  <span>Symbol:</span>
                  <strong>{symbol}</strong>
                </div>
                <div className={styles.confirmationRow}>
                  <span>Quantity:</span>
                  <strong>{quantity} shares</strong>
                </div>
                <div className={styles.confirmationRow}>
                  <span>Order Type:</span>
                  <strong>{orderType}</strong>
                </div>
                <div className={styles.confirmationRow}>
                  <span>Price:</span>
                  <strong>${executionPrice.toFixed(2)}/share</strong>
                </div>
                <div className={styles.confirmationRow}>
                  <span>Commission:</span>
                  <strong>${commission.toFixed(2)}</strong>
                </div>
                <div className={`${styles.confirmationRow} ${styles.total}`}>
                  <span>Total {side === 'BUY' ? 'Cost' : 'Proceeds'}:</span>
                  <strong>${totalCost.toFixed(2)}</strong>
                </div>
              </div>

              {side === 'BUY' && portfolioData && (
                <div className={styles.confirmationInfo}>
                  <div className={styles.infoIcon}>ℹ️</div>
                  <div>
                    <div>Cash after trade: ${(portfolioData.cash - totalCost).toFixed(2)}</div>
                    <div className={styles.infoSubtext}>
                      Available: ${portfolioData.cash.toFixed(2)}
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className={styles.error}>{error}</div>
              )}
            </div>

            <div className={styles.actions}>
              <Button 
                variant="ghost" 
                onClick={handleCancel}
                disabled={loading}
                fullWidth
              >
                Cancel
              </Button>
              <Button
                variant={side === 'BUY' ? 'primary' : 'danger'}
                onClick={handleSubmit}
                loading={loading}
                disabled={loading}
                fullWidth
              >
                Confirm {side}
              </Button>
            </div>
          </div>
        ) : (
          // Order Entry View
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

            {/* Available Info */}
            {portfolioData && (
              <div className={styles.availableInfo}>
                {side === 'BUY' ? (
                  <>
                    <span>💰 Available Cash:</span>
                    <strong>${portfolioData.cash.toFixed(2)}</strong>
                  </>
                ) : (
                  <>
                    <span>📊 Available Shares:</span>
                    <strong>{availableShares} {symbol}</strong>
                  </>
                )}
              </div>
            )}

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
              onChange={e => {
                setQuantity(e.target.value);
                setError('');
              }}
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
                <span>${executionPrice.toFixed(2)}/share</span>
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
              <Button 
                variant="ghost" 
                onClick={handleCancel}
                fullWidth
              >
                Cancel
              </Button>
              <Button
                variant={side === 'BUY' ? 'primary' : 'danger'}
                onClick={handlePreview}
                disabled={!quantity || parseFloat(quantity) <= 0}
                fullWidth
              >
                Preview Order
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}