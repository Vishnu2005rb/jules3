'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        window.location.href = '/admin/dashboard';
      } else {
        const data = await res.json();
        setError(data.error || 'Invalid credentials');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 font-sans"
      style={{ background: 'var(--bg-page)', color: 'var(--text-primary)' }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }} className="max-w-sm w-full">

        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 rounded-xl items-center justify-center mb-4"
            style={{ background: 'var(--brand-light)', border: '1px solid var(--brand-border)' }}>
            <svg className="w-6 h-6" style={{ color: 'var(--brand)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Admin Portal</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sign in to manage events and submissions</p>
        </div>

        <div className="card p-6 sm:p-8">
          {error && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 rounded-lg text-sm mb-5"
              style={{ background: 'var(--error-bg)', border: '1px solid var(--error-border)', color: 'var(--error-text)' }}>
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              {error}
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5"
                style={{ color: 'var(--text-muted)' }}>Username</label>
              <input suppressHydrationWarning type="text" required placeholder="Enter username" className="input-field"
                value={username} onChange={e => setUsername(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5"
                style={{ color: 'var(--text-muted)' }}>Password</label>
              <input suppressHydrationWarning type="password" required placeholder="••••••••" className="input-field"
                value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <button suppressHydrationWarning type="submit" disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50"
              style={{ background: 'var(--brand)' }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'var(--brand-dark)'; }}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--brand)')}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm transition-colors" style={{ color: 'var(--text-muted)' }}>
            ← Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
