'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function VerifySearchPage() {
  const [certId, setCertId] = useState('');
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 font-sans"
      style={{ background: 'var(--bg-page)', color: 'var(--text-primary)' }}>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }} className="max-w-md w-full">

        <Link href="/" className="inline-flex items-center gap-1.5 text-sm mb-8 transition-colors"
          style={{ color: 'var(--text-muted)' }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Home
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex w-14 h-14 rounded-xl items-center justify-center mb-5"
            style={{ background: 'var(--brand-light)', border: '1px solid var(--brand-border)' }}>
            <svg className="w-7 h-7" style={{ color: 'var(--brand)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Verify Certificate</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Enter a certificate ID to check its authenticity</p>
        </div>

        <div className="card p-6 sm:p-8">
          <form onSubmit={e => { e.preventDefault(); if (certId.trim()) router.push(`/verify/${certId.trim()}`); }}
            className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-2"
                style={{ color: 'var(--text-muted)' }}>Certificate ID</label>
              <input
                suppressHydrationWarning
                type="text"
                required
                placeholder="e.g. CER_HACKATHON_0001"
                className="input-field font-mono text-center tracking-wider"
                value={certId}
                onChange={e => setCertId(e.target.value)}
              />
            </div>
            <button suppressHydrationWarning type="submit"
              className="w-full py-3 rounded-lg text-sm font-semibold text-white transition-all"
              style={{ background: 'var(--brand)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--brand-dark)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--brand)')}>
              Verify Certificate
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          Certificate IDs are included in the email sent after approval.
        </p>
      </motion.div>
    </div>
  );
}
