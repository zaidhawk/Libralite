/**
 * Reading List Component
 * Displays and manages user's reading list (For Later list)
 */

'use client';

import React, { useState, useEffect } from 'react';
import { ReadingListItem } from '@/types/digital-content';
import { useCart } from '@/contexts/CartContext';

interface ReadingListProps {
  userId: string;
  onCheckout?: (contentId: string) => void;
}

interface EnrichedReadingListItem {
  item: ReadingListItem;
  contentDetails?: {
    title: string;
    author: string;
    coverImageUrl?: string;
    availableCopies: number;
    totalCopies: number;
    formatType: string;
  };
}

export function ReadingList({ userId, onCheckout }: ReadingListProps) {
  const [items, setItems] = useState<EnrichedReadingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'digital' | 'physical'>('all');

  useEffect(() => {
    fetchReadingList();
  }, [userId]);

  const fetchReadingList = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/digital/reading-list?userId=${userId}&withDetails=true`
      );
      const data = await response.json();

      if (data.success) {
        setItems(data.items);
      }
    } catch (error) {
      console.error('Failed to fetch reading list:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (itemId: string) => {
    try {
      const response = await fetch('/api/digital/reading-list', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, itemId }),
      });

      const data = await response.json();
      if (data.success) {
        fetchReadingList(); // Refresh the list
      }
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };

  const filteredItems = items.filter((enrichedItem) => {
    if (filter === 'digital') return enrichedItem.item.isDigital;
    if (filter === 'physical') return !enrichedItem.item.isDigital;
    return true;
  });

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', fontSize: '1.1rem', color: '#666' }}>
        Loading reading list...
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <h2 style={{ margin: 0 }}>Your Reading List</h2>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setFilter('all')}
            style={{
              padding: '0.5rem 1rem',
              border: filter === 'all' ? '2px solid #007bff' : '1px solid #ddd',
              background: filter === 'all' ? '#e7f3ff' : 'white',
              color: filter === 'all' ? '#007bff' : '#666',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: filter === 'all' ? 'bold' : 'normal',
            }}
          >
            All ({items.length})
          </button>
          <button
            onClick={() => setFilter('digital')}
            style={{
              padding: '0.5rem 1rem',
              border: filter === 'digital' ? '2px solid #007bff' : '1px solid #ddd',
              background: filter === 'digital' ? '#e7f3ff' : 'white',
              color: filter === 'digital' ? '#007bff' : '#666',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: filter === 'digital' ? 'bold' : 'normal',
            }}
          >
            Digital ({items.filter((i) => i.item.isDigital).length})
          </button>
          <button
            onClick={() => setFilter('physical')}
            style={{
              padding: '0.5rem 1rem',
              border: filter === 'physical' ? '2px solid #007bff' : '1px solid #ddd',
              background: filter === 'physical' ? '#e7f3ff' : 'white',
              color: filter === 'physical' ? '#007bff' : '#666',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: filter === 'physical' ? 'bold' : 'normal',
            }}
          >
            Physical ({items.filter((i) => !i.item.isDigital).length})
          </button>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: '#f8f8f8', borderRadius: '8px' }}>
          <p style={{ color: '#666', fontSize: '1.1rem' }}>
            {filter === 'all' ? 'Your reading list is empty.' : `No ${filter} items in your reading list.`}
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '2rem',
          marginTop: '2rem',
        }}>
          {filteredItems.map((enrichedItem) => (
            <ReadingListItemCard
              key={enrichedItem.item.itemId}
              enrichedItem={enrichedItem}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ReadingListItemCardProps {
  enrichedItem: EnrichedReadingListItem;
  onRemove: (itemId: string) => void;
}

function ReadingListItemCard({
  enrichedItem,
  onRemove,
}: ReadingListItemCardProps) {
  const [showMenu, setShowMenu] = React.useState(false);
  const { addToCart, isInCart } = useCart();
  const { item, contentDetails } = enrichedItem;
  const inCart = contentDetails ? isInCart(item.contentId) : false;

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
          {contentDetails?.coverImageUrl ? (
            <img
              src={contentDetails.coverImageUrl}
              alt={contentDetails.title}
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
              {contentDetails?.title || 'Unknown Title'}
            </div>
          )}

          {/* Type Badge */}
          <div style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            background: item.isDigital ? '#007bff' : '#28a745',
            color: 'white',
            padding: '0.25rem 0.5rem',
            borderRadius: '4px',
            fontSize: '0.7rem',
            fontWeight: 'bold',
            textTransform: 'uppercase',
          }}>
            {item.isDigital ? 'Digital' : 'Physical'}
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
            {contentDetails?.title || 'Unknown Title'}
          </div>

          <div style={{
            fontSize: '0.875rem',
            color: '#666',
            marginBottom: '0.5rem',
          }}>
            by {contentDetails?.author || 'Unknown Author'}
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '0.75rem',
          }}>
            {contentDetails && (
              <span style={{
                fontSize: '0.75rem',
                padding: '0.25rem 0.5rem',
                background: '#f0f0f0',
                borderRadius: '4px',
                textTransform: 'uppercase',
              }}>
                {contentDetails.formatType}
              </span>
            )}

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
            minWidth: '200px',
          }}>
            {item.isDigital && contentDetails && contentDetails.availableCopies > 0 && (
              <button
                onClick={() => {
                  addToCart({
                    contentId: item.contentId,
                    title: contentDetails.title,
                    author: contentDetails.author,
                    coverImageUrl: contentDetails.coverImageUrl,
                    formatType: contentDetails.formatType as any,
                    availableCopies: contentDetails.availableCopies,
                    totalCopies: contentDetails.totalCopies,
                  } as any);
                  setShowMenu(false);
                }}
                disabled={inCart}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: 'none',
                  background: inCart ? '#f0f0f0' : 'none',
                  textAlign: 'left',
                  cursor: inCart ? 'not-allowed' : 'pointer',
                  fontSize: '0.9rem',
                  borderBottom: '1px solid #f0f0f0',
                  color: inCart ? '#999' : 'inherit',
                }}
                onMouseEnter={(e) => !inCart && (e.currentTarget.style.background = '#f8f8f8')}
                onMouseLeave={(e) => !inCart && (e.currentTarget.style.background = 'none')}
              >
                {inCart ? '✓ In Cart' : '🛒 Add to Cart'}
              </button>
            )}

            <button
              onClick={() => {
                onRemove(item.itemId);
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
              🗑️ Remove from List
            </button>
          </div>
        </>
      )}
    </div>
  );
}
