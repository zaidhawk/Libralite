/**
 * Cart Page - Borrowing Cart for Batch Checkout
 */

'use client';

import { useCart } from '@/contexts/CartContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function CartPage() {
  const { items, removeFromCart, updateLoanPeriod, clearCart, cartCount } = useCart();
  const [checkingOut, setCheckingOut] = useState(false);
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const userId = user.uid;

  // API call to checkout all items in cart
  const handleCheckoutAll = async () => {
    if (items.length === 0) return;

    // Filter out unavailable items
    const availableItems = items.filter(item => item.availableCopies > 0);
    const unavailableItems = items.filter(item => item.availableCopies === 0);

    if (unavailableItems.length > 0) {
      const confirmMsg = `${unavailableItems.length} book(s) are currently unavailable and will be skipped. Continue with ${availableItems.length} available book(s)?`;
      if (!confirm(confirmMsg)) {
        return;
      }
    }

    // Checkout disabled if no available items
    if (availableItems.length === 0) {
      alert('No available books to checkout.');
      return;
    }
    // Checkout 
    setCheckingOut(true);
    try {
      // Checkout each available item
      const checkoutPromises = availableItems.map((item) =>
        fetch('/api/digital/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contentId: item.contentId,
            userId,
            loanPeriodDays: item.loanPeriodDays,
          }),
        })
      );

      const results = await Promise.all(checkoutPromises);
      const data = await Promise.all(results.map((r) => r.json()));

      const successfulLoans = data.filter((d) => d.success);
      const failed = data.filter((d) => !d.success);

      // Save successful loans to localStorage
      if (successfulLoans.length > 0) {
        try {
          const existing = localStorage.getItem(`loans_${userId}`);
          const existingLoans = existing ? JSON.parse(existing) : [];

          // Get full loan details from API
          const loansResponse = await fetch(`/api/digital/loans/${userId}?activeOnly=true`);
          const loansData = await loansResponse.json();

          if (loansData.success) {
            localStorage.setItem(`loans_${userId}`, JSON.stringify(loansData.loans));
          }
        } catch (error) {
          console.error('Failed to save loans to localStorage:', error);
        }
      }

      // Show detailed error messages
      if (failed.length > 0) {
        const errors = failed.map(f => f.error).join('\n');
        console.error('Checkout errors:', errors);
      }

      if (successfulLoans.length > 0) {
        alert(`Successfully checked out ${successfulLoans.length} book(s)!${failed.length > 0 ? ` ${failed.length} failed (possibly already checked out).` : ''}`);
        clearCart();
        router.push('/dashboard');
      } else {
        alert('Checkout failed. Books may already be checked out or unavailable.');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('An error occurred during checkout');
    } finally {
      setCheckingOut(false);
    }
  };

  if (cartCount === 0) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
        <h1>Your Borrowing Cart</h1>
        <div style={{
          padding: '4rem 2rem',
          background: '#f8f8f8',
          borderRadius: '8px',
          marginTop: '2rem',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛒</div>
          <h2 style={{ color: '#666', fontWeight: 'normal' }}>Your cart is empty</h2>
          <p style={{ color: '#999', marginBottom: '2rem' }}>
            Browse the catalog and add books to your cart
          </p>
          <a
            href="/catalog"
            style={{
              display: 'inline-block',
              padding: '0.75rem 2rem',
              background: '#007bff',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
              fontWeight: 'bold',
            }}
          >
            Browse Catalog
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
      }}>
        <div>
          <h1 style={{ margin: 0 }}>Your Borrowing Cart</h1>
          <p style={{ color: '#666', marginTop: '0.5rem' }}>
            {cartCount} book{cartCount !== 1 ? 's' : ''} ready to borrow
          </p>
        </div>
        <button
          onClick={handleCheckoutAll}
          disabled={checkingOut}
          style={{
            padding: '0.75rem 2rem',
            background: checkingOut ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: checkingOut ? 'not-allowed' : 'pointer',
          }}
        >
          {checkingOut ? 'Processing...' : `Checkout All (${cartCount})`}
        </button>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '8px',
        border: '1px solid #ddd',
      }}>
        {items.map((item, index) => (
          <div
            key={item.contentId}
            style={{
              padding: '1.5rem',
              borderBottom: index < items.length - 1 ? '1px solid #eee' : 'none',
              display: 'flex',
              gap: '1.5rem',
              alignItems: 'center',
            }}
          >
            <div style={{
              width: '80px',
              height: '120px',
              flexShrink: 0,
              background: '#f0f0f0',
              borderRadius: '4px',
              overflow: 'hidden',
            }}>
              {item.coverImageUrl ? (
                <img
                  src={item.coverImageUrl}
                  alt={item.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  fontSize: '0.7rem',
                  padding: '0.5rem',
                  textAlign: 'center',
                }}>
                  {item.title}
                </div>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.1rem' }}>
                {item.title}
              </h3>
              <p style={{ margin: '0 0 0.5rem 0', color: '#666' }}>
                by {item.author}
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.5rem',
                  background: '#f0f0f0',
                  borderRadius: '4px',
                  textTransform: 'uppercase',
                }}>
                  {item.formatType}
                </span>
                <span style={{
                  fontSize: '0.75rem',
                  color: item.availableCopies > 0 ? '#28a745' : '#dc3545',
                  fontWeight: '500',
                }}>
                  {item.availableCopies > 0
                    ? `${item.availableCopies}/${item.totalCopies} available`
                    : 'Unavailable'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div>
                <label
                  htmlFor={`loan-period-${item.contentId}`}
                  style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    color: '#666',
                    marginBottom: '0.25rem',
                  }}
                >
                  Loan Period
                </label>
                <select
                  id={`loan-period-${item.contentId}`}
                  value={item.loanPeriodDays}
                  onChange={(e) =>
                    updateLoanPeriod(item.contentId, Number(e.target.value))
                  }
                  style={{
                    padding: '0.5rem',
                    fontSize: '1rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    background: 'white',
                  }}
                >
                  <option value={7}>7 days</option>
                  <option value={14}>14 days</option>
                  <option value={21}>21 days</option>
                </select>
              </div>

              <button
                onClick={() => removeFromCart(item.contentId)}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'none',
                  border: '1px solid #dc3545',
                  color: '#dc3545',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#dc3545';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none';
                  e.currentTarget.style.color = '#dc3545';
                }}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <button
          onClick={() => clearCart()}
          style={{
            padding: '0.5rem 1rem',
            background: 'none',
            border: '1px solid #666',
            color: '#666',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Clear Cart
        </button>

        <button
          onClick={handleCheckoutAll}
          disabled={checkingOut}
          style={{
            padding: '0.75rem 2rem',
            background: checkingOut ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: checkingOut ? 'not-allowed' : 'pointer',
          }}
        >
          {checkingOut ? 'Processing...' : `Checkout All (${cartCount})`}
        </button>
      </div>
    </div>
  );
}
