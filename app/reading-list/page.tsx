/**
 * Reading List Page - User's Saved Books
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ReadingList } from '@/components/ReadingList';
import { useAuth } from '@/contexts/AuthContext';

export default function ReadingListPage() {
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
      <ReadingList userId={user.uid} />
    </div>
  );
}
