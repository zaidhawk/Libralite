/**
 * Dashboard Page - User's Checked Out Items
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserDashboard } from '@/components/UserDashboard';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', textAlign: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <h1>My Dashboard</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        View your checked-out digital items with expiration countdown timers.
      </p>

      <UserDashboard userId={user.uid} />
    </div>
  );
}
