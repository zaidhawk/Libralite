/**
 * API Demo Page - Test API Endpoints
 */

'use client';

import { useState } from 'react';

export default function APIDemoPage() {
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testAPI = async (endpoint: string, method: string = 'GET', body?: any) => {
    setLoading(true);
    try {
      const options: RequestInit = {
        method,
        headers: { 'Content-Type': 'application/json' },
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      const res = await fetch(endpoint, options);
      const data = await res.json();
      setResponse({ endpoint, method, status: res.status, data });
    } catch (error) {
      setResponse({ endpoint, method, error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>API Demo</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Test the API endpoints to see how the system works.
      </p>

      {/* API Test Buttons */}
      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        {/* test get catalog */}
        <button
          onClick={() => testAPI('/api/digital/catalog')}
          style={buttonStyle}
          disabled={loading}
        >
          GET /api/digital/catalog
        </button>

        {/* test getting only available items */}
        <button
          onClick={() => testAPI('/api/digital/catalog?availableOnly=true')}
          style={buttonStyle}
          disabled={loading}
        >
          GET /api/digital/catalog (available only)
        </button>

        {/* test getting user loans */}
        <button
          onClick={() =>
            testAPI('/api/digital/loans/user-demo-123?activeOnly=true')
          }
          style={buttonStyle}
          disabled={loading}
        >
          GET /api/digital/loans/[userId]
        </button>

        {/* test getting reading list */}
        <button
          onClick={() =>
            testAPI('/api/digital/reading-list?userId=user-demo-123&withDetails=true')
          }
          style={buttonStyle}
          disabled={loading}
        >
          GET /api/digital/reading-list
        </button>

        {/* test checkout */}
        <button
          onClick={() =>
            testAPI('/api/digital/checkout', 'POST', {
              contentId: 'test-book-123',
              userId: 'user-demo-123',
              loanPeriodDays: 14,
            })
          }
          style={buttonStyle}
          disabled={loading}
        >
          POST /api/digital/checkout
        </button>
        {/* test adding to reading list */}
        <button
          onClick={() =>
            testAPI('/api/digital/reading-list', 'POST', {
              userId: 'user-demo-123',
              contentId: 'test-book-456',
              isDigital: true,
              notes: 'Must read!',
            })
          }
          style={buttonStyle}
          disabled={loading}
        >
          POST /api/digital/reading-list
        </button>
      </div>

      {loading && (
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          Loading...
        </div>
      )}

      {response && !loading && (
        <div style={{ marginTop: '2rem' }}>
          <h2>Response</h2>
          <div style={{
            background: '#f5f5f5',
            padding: '1rem',
            borderRadius: '4px',
            overflow: 'auto'
          }}>
            <div style={{ marginBottom: '1rem' }}>
              <strong>Endpoint:</strong> {response.method} {response.endpoint}
            </div>
            {response.status && (
              <div style={{ marginBottom: '1rem' }}>
                <strong>Status:</strong> {response.status}
              </div>
            )}
            <div>
              <strong>Data:</strong>
              <pre style={{ marginTop: '0.5rem', overflow: 'auto' }}>
                {JSON.stringify(response.data || response.error, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: '3rem', padding: '1.5rem', background: '#fff3cd', borderRadius: '8px' }}>
        <h3>Available Endpoints</h3>
        <ul style={{ lineHeight: '1.8' }}>
          <li><code>GET /api/digital/catalog</code> - Browse digital catalog</li>
          <li><code>POST /api/digital/checkout</code> - Checkout digital content</li>
          <li><code>POST /api/digital/return</code> - Return digital content</li>
          <li><code>GET /api/digital/loans/[userId]</code> - Get user loans</li>
          <li><code>GET/POST/DELETE /api/digital/reading-list</code> - Manage reading list</li>
        </ul>
      </div>
    </div>
  );
}

const buttonStyle: React.CSSProperties = {
  padding: '1rem',
  background: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.9rem',
  textAlign: 'left',
  transition: 'background 0.2s',
};
