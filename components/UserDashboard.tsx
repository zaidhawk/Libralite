/**
 * User Dashboard Component
 * Displays checked-out digital items with expiration countdown
 */

'use client';

import React, { useState, useEffect } from 'react';
import { DigitalLoan, LoanStatus } from '@/types/digital-content';

interface UserDashboardProps {
  userId: string;
}

interface EnrichedLoan extends DigitalLoan {
  contentDetails?: {
    title: string;
    author: string;
    coverImageUrl?: string;
  };
  timeRemainingMs: number;
  daysRemaining: number;
}

export function UserDashboard({ userId }: UserDashboardProps) {
  const [loans, setLoans] = useState<EnrichedLoan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load from localStorage first
    loadLoansFromStorage();
    fetchUserLoans();
    // Refresh every minute to update countdowns
    const interval = setInterval(fetchUserLoans, 60000);
    return () => clearInterval(interval);
  }, [userId]);

  const loadLoansFromStorage = () => {
    try {
      const stored = localStorage.getItem(`loans_${userId}`);
      if (stored) {
        const storedLoans = JSON.parse(stored);
        // Filter out expired loans
        const activeLoans = storedLoans.filter((loan: EnrichedLoan) => {
          return new Date(loan.expirationDate).getTime() > Date.now();
        });
        setLoans(activeLoans);
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to load loans from storage:', error);
    }
  };

  const saveLoansToStorage = (loansData: EnrichedLoan[]) => {
    try {
      localStorage.setItem(`loans_${userId}`, JSON.stringify(loansData));
    } catch (error) {
      console.error('Failed to save loans to storage:', error);
    }
  };

  const fetchUserLoans = async () => {
    try {
      const response = await fetch(`/api/digital/loans/${userId}?activeOnly=true`);
      const data = await response.json();

      if (data.success) {
        setLoans(data.loans);
        saveLoansToStorage(data.loans);
      }
    } catch (error) {
      console.error('Failed to fetch loans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (loanId: string) => {
    try {
      const response = await fetch('/api/digital/return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loanId, userId }),
      });

      const data = await response.json();
      if (data.success) {
        // Update localStorage immediately
        const updatedLoans = loans.filter(loan => loan.loanId !== loanId);
        setLoans(updatedLoans);
        saveLoansToStorage(updatedLoans);

        fetchUserLoans(); // Refresh from server
      }
    } catch (error) {
      console.error('Failed to return content:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', fontSize: '1.1rem', color: '#666' }}>
        Loading your dashboard...
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      <h2 style={{ margin: '0 0 2rem 0' }}>Your Checked Out Items</h2>

      {loans.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: '#f8f8f8', borderRadius: '8px' }}>
          <p style={{ color: '#666', fontSize: '1.1rem' }}>
            You don't have any checked out digital items.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '2rem',
          marginTop: '2rem',
        }}>
          {loans.map((loan) => (
            <LoanCard
              key={loan.loanId}
              loan={loan}
              onReturn={handleReturn}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface LoanCardProps {
  loan: EnrichedLoan;
  onReturn: (loanId: string) => void;
}

function LoanCard({ loan, onReturn }: LoanCardProps) {
  const [timeRemaining, setTimeRemaining] = useState(loan.timeRemainingMs);
  const [showMenu, setShowMenu] = React.useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = new Date(loan.expirationDate).getTime() - Date.now();
      setTimeRemaining(Math.max(0, remaining));
    }, 1000);

    return () => clearInterval(interval);
  }, [loan.expirationDate]);

  const formatTimeRemaining = (ms: number): string => {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const getUrgencyColor = (): string => {
    const daysRemaining = timeRemaining / (1000 * 60 * 60 * 24);
    if (daysRemaining < 1) return '#dc3545';
    if (daysRemaining < 3) return '#ffc107';
    return '#28a745';
  };

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        overflow: 'hidden',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
      }}>
        <div style={{ position: 'relative', paddingTop: '150%', background: '#f0f0f0' }}>
          {loan.contentDetails?.coverImageUrl ? (
            <img
              src={loan.contentDetails.coverImageUrl}
              alt={loan.contentDetails.title}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              fontSize: '0.9rem',
              padding: '1rem',
              textAlign: 'center',
              fontWeight: 'bold',
            }}>
              {loan.contentDetails?.title || 'Unknown Title'}
            </div>
          )}

          {/* Countdown Badge */}
          <div style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            background: getUrgencyColor(),
            color: 'white',
            padding: '0.25rem 0.5rem',
            borderRadius: '4px',
            fontSize: '0.7rem',
            fontWeight: 'bold',
          }}>
            {timeRemaining > 0 ? formatTimeRemaining(timeRemaining) : 'EXPIRED'}
          </div>
        </div>

        <div style={{ padding: '1rem' }}>
          <div style={{
            fontSize: '1rem',
            fontWeight: '600',
            marginBottom: '0.25rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            minHeight: '2.5rem',
          }}>
            {loan.contentDetails?.title || 'Unknown Title'}
          </div>

          <div style={{
            fontSize: '0.875rem',
            color: '#666',
            marginBottom: '0.5rem',
          }}>
            by {loan.contentDetails?.author || 'Unknown Author'}
          </div>

          <div style={{
            fontSize: '0.75rem',
            color: '#666',
            marginBottom: '0.5rem',
          }}>
            Due: {new Date(loan.expirationDate).toLocaleDateString()}
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '0.5rem',
          }}>
            <span style={{
              fontSize: '0.75rem',
              padding: '0.25rem 0.5rem',
              background: '#e3f2fd',
              color: '#007bff',
              borderRadius: '4px',
              fontWeight: '500',
            }}>
              BORROWED
            </span>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.25rem',
                cursor: 'pointer',
                padding: '0.25rem 0.5rem',
                color: '#666',
              }}
            >
              ⋮
            </button>
          </div>
        </div>
      </div>

      {showMenu && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999,
            }}
            onClick={() => setShowMenu(false)}
          />
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '0.5rem',
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
            minWidth: '180px',
          }}>
            <button
              onClick={() => {
                window.open(`/api/digital/download/${loan.loanId}?token=${loan.downloadToken}`, '_blank');
                setShowMenu(false);
              }}
              disabled={timeRemaining <= 0}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: 'none',
                background: 'none',
                textAlign: 'left',
                cursor: timeRemaining <= 0 ? 'not-allowed' : 'pointer',
                fontSize: '0.9rem',
                borderBottom: '1px solid #f0f0f0',
                color: timeRemaining <= 0 ? '#999' : 'inherit',
              }}
              onMouseEnter={(e) => timeRemaining > 0 && (e.currentTarget.style.background = '#f8f8f8')}
              onMouseLeave={(e) => timeRemaining > 0 && (e.currentTarget.style.background = 'none')}
            >
              Download
            </button>

            <button
              onClick={() => {
                onReturn(loan.loanId);
                setShowMenu(false);
              }}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: 'none',
                background: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '0.9rem',
                color: '#dc3545',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#fff5f5'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
            >
              Return Early
            </button>
          </div>
        </>
      )}
    </div>
  );
}
