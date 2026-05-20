/**
 * Digital Catalog Component
 * Displays digital content catalog with search and filtering
 */

'use client';

import React, { useState, useEffect } from 'react';
import { DigitalContentMetadata, DigitalFormat } from '@/types/digital-content';
import { useCart } from '@/contexts/CartContext';

interface DigitalCatalogProps {
  userId?: string;
  onAddToReadingList?: (contentId: string) => void;
}

export function DigitalCatalog({
  userId,
  onAddToReadingList,
}: DigitalCatalogProps) {
  const [catalog, setCatalog] = useState<DigitalContentMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [formatFilter, setFormatFilter] = useState<DigitalFormat | ''>('');
  const [availableOnly, setAvailableOnly] = useState(false);

  useEffect(() => {
    fetchCatalog();
  }, [searchQuery, formatFilter, availableOnly]);

  // Fetch catalog with API with filters
  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (formatFilter) params.append('format', formatFilter);
      if (availableOnly) params.append('availableOnly', 'true');

      console.log('Fetching catalog from:', `/api/digital/catalog?${params}`);
      const response = await fetch(`/api/digital/catalog?${params}`);
      const data = await response.json();

      console.log('Catalog response:', data);
      if (data.success) {
        console.log('Setting catalog with', data.items.length, 'items');
        setCatalog(data.items);
      }
    } catch (error) {
      console.error('Failed to fetch catalog:', error);
    } finally {
      setLoading(false);
      console.log('Loading state set to false');
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <input
          type="text"
          placeholder="Search by title, author..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            flex: '1',
            minWidth: '250px',
            padding: '0.75rem 1rem',
            fontSize: '1rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
          }}
        />

        <select
          value={formatFilter}
          onChange={(e) => setFormatFilter(e.target.value as DigitalFormat | '')}
          style={{
            padding: '0.75rem 1rem',
            fontSize: '1rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            background: 'white',
          }}
        >
          <option value="">All Formats</option>
          <option value={DigitalFormat.PDF}>PDF</option>
          <option value={DigitalFormat.EPUB}>EPUB</option>
          <option value={DigitalFormat.AUDIOBOOK}>Audiobook</option>
        </select>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={availableOnly}
            onChange={(e) => setAvailableOnly(e.target.checked)}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <span>Available Only</span>
        </label>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', fontSize: '1.1rem', color: '#666' }}>
          Loading catalog...
        </div>
      ) : catalog.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', fontSize: '1.1rem', color: '#666' }}>
          <p>No books found. Try adjusting your filters.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '2rem',
          marginTop: '2rem',
        }}>
          {catalog.map((item) => (
            <CatalogItem
              key={item.contentId}
              content={item}
              onAddToReadingList={onAddToReadingList}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CatalogItemProps {
  content: DigitalContentMetadata;
  onAddToReadingList?: (contentId: string) => void;
}

function CatalogItem({ content, onAddToReadingList }: CatalogItemProps) {
  const [showMenu, setShowMenu] = React.useState(false);
  const { addToCart, isInCart } = useCart();
  const inCart = isInCart(content.contentId);

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        overflow: 'hidden',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'pointer',
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
          {content.coverImageUrl ? (
            <img
              src={content.coverImageUrl}
              alt={content.title}
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
              {content.title}
            </div>
          )}
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
            {content.title}
          </div>

          <div style={{
            fontSize: '0.875rem',
            color: '#666',
            marginBottom: '0.5rem',
          }}>
            by {content.author}
          </div>

          <div style={{
            fontSize: '0.75rem',
            color: content.availableCopies > 0 ? '#28a745' : '#dc3545',
            fontWeight: '500',
            marginBottom: '0.5rem',
          }}>
            {content.availableCopies > 0
              ? `${content.availableCopies} of ${content.totalCopies} available`
              : 'Currently unavailable'}
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
              background: '#f0f0f0',
              borderRadius: '4px',
              textTransform: 'uppercase',
            }}>
              {content.formatType}
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

        {content.availableCopies === 0 && (
          <div style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '0.25rem 0.5rem',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: 'bold',
          }}>
            UNAVAILABLE
          </div>
        )}
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
            {content.availableCopies > 0 && (
              <button
                onClick={() => {
                  addToCart(content);
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
                {inCart ? 'In Cart' : 'Add to Cart'}
              </button>
            )}

            {onAddToReadingList && (
              <button
                onClick={() => {
                  onAddToReadingList(content.contentId);
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
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f8f8f8'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                Save for Later
              </button>
            )}

            {/* Details functionality not yet implemented */}
            {/* <button
              onClick={() => setShowMenu(false)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: 'none',
                background: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '0.9rem',
                borderTop: '1px solid #f0f0f0',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f8f8f8'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
            >
              Details
            </button> */}
          </div>
        </>
      )}
    </div>
  );
}
