/**
 * Checkout Modal Component
 * Handles the checkout process for digital content
 */

'use client';

import { useState } from 'react';
import { CheckoutRequest, CheckoutResponse } from '@/types/digital-content';

interface CheckoutModalProps {
  contentId: string;
  userId: string;
  contentTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CheckoutModal({
  contentId,
  userId,
  contentTitle,
  isOpen,
  onClose,
  onSuccess,
}: CheckoutModalProps) {
  const [loanPeriodDays, setLoanPeriodDays] = useState(14);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      const request: CheckoutRequest = {
        contentId,
        userId,
        loanPeriodDays,
      };

      const response = await fetch('/api/digital/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      const data: CheckoutResponse = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      } else {
        setError(data.error || 'Checkout failed');
      }
    } catch (err) {
      setError('An error occurred during checkout');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Borrow Digital Content</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <h3>{contentTitle}</h3>

          {success ? (
            <div className="success-message">
              <p>✓ Successfully checked out!</p>
              <p>You can now download and read this content.</p>
            </div>
          ) : (
            <>
              <div className="loan-period-selector">
                <label htmlFor="loanPeriod">Loan Period:</label>
                <select
                  id="loanPeriod"
                  value={loanPeriodDays}
                  onChange={(e) => setLoanPeriodDays(Number(e.target.value))}
                  disabled={loading}
                >
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={21}>21 days</option>
                </select>
              </div>

              <div className="checkout-info">
                <p>
                  This content will be automatically returned on{' '}
                  {new Date(
                    Date.now() + loanPeriodDays * 24 * 60 * 60 * 1000
                  ).toLocaleDateString()}
                </p>
                <p>You can return it early at any time from your dashboard.</p>
              </div>

              {error && <div className="error-message">{error}</div>}
            </>
          )}
        </div>

        {!success && (
          <div className="modal-footer">
            <button onClick={onClose} disabled={loading} className="btn-cancel">
              Cancel
            </button>
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="btn-confirm"
            >
              {loading ? 'Processing...' : 'Borrow'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
