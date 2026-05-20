'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { createUserProfile } from '@/lib/firebase-user-data';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, signIn, signUp, signOut, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect to home if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/home');
    }
  }, [user, authLoading, router]);

  // Login form submission
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await signIn(email, pw);
      } else {
        await signUp(email, pw);
        // Create user profile in Firestore after signup
        const { auth } = await import('@/src/firebase');
        if (auth.currentUser) {
          await createUserProfile(auth.currentUser.uid, email);
        }
      }
      // Redirect to home after successful login
      router.push('/home');
    } catch (err: any) {
      setError(err.message || 'Authentication error, please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <main style={{ padding: '2rem', maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        <p>Loading...</p>
      </main>
    );
  }

  // If already logged in, show welcome and redirect option
  if (user) {
    return (
      <main style={{ padding: '2rem', maxWidth: 480, margin: '0 auto' }}>
        <h1>Welcome {user.email}</h1>
        <button onClick={() => signOut()} style={btnStyle}>Logout</button>
        <div style={{ marginTop: '1rem' }}>
          <Link href="/home">Go to Home</Link>
        </div>
      </main>
    );
  }

  // HTML
  return (
    <main style={{ padding: '2rem', maxWidth: 480, margin: '0 auto' }}>
      <h1>{mode === 'login' ? 'Login' : 'Create Account'}</h1>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Password"
          value={pw}
          onChange={e => setPw(e.target.value)}
          required
          style={inputStyle}
        />
        {error && <div style={{ color: 'red', fontSize: '0.85rem' }}>{error}</div>}
        <button type="submit" disabled={loading} style={btnStyle}>
          {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Sign Up'}
        </button>
      </form>
      <button
        onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
        style={{ ...btnLinkStyle, marginTop: '0.75rem' }}
        type="button"
      >
        {mode === 'login' ? 'Need an account? Sign up' : 'Have an account? Login'}
      </button>
    </main>
  );
}

// CSS
const inputStyle: React.CSSProperties = {
  padding: '0.6rem 0.8rem',
  border: '1px solid #ccc',
  borderRadius: 6
};

const btnStyle: React.CSSProperties = {
  padding: '0.7rem 1rem',
  background: '#2563eb',
  color: 'white',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer'
};

const btnLinkStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#2563eb',
  cursor: 'pointer',
  textDecoration: 'underline',
  padding: 0
};
