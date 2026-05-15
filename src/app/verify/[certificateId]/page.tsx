'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function PublicVerifyPage({ params }: { params: Promise<{ certificateId: string }> }) {
  const { certificateId } = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/verify/${certificateId}`)
      .then(r => r.json()).then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [certificateId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-sans"
        style={{ background: 'var(--bg-page)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: 'var(--brand-border)', borderTopColor: 'var(--brand)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Verifying certificate...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 font-sans"
      style={{ background: 'var(--bg-page)', color: 'var(--text-primary)' }}>
      <AnimatePresence mode="wait">
        {!data || data.error ? (
          <motion.div key="error" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full card p-8 text-center">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-5"
              style={{ background: 'var(--error-bg)', border: '1px solid var(--error-border)' }}>
              <svg className="w-7 h-7" style={{ color: 'var(--error)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Certificate Not Found</h1>
            <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-muted)' }}>
              The certificate ID you entered doesn't exist in our system. Please check the ID and try again.
            </p>
            <Link href="/verify"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}>
              Try Again
            </Link>
          </motion.div>
        ) : (
          <motion.div key="success" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 160, damping: 22 }}
            className="max-w-xl w-full">

            {/* Status badge */}
            <div className="flex justify-center mb-6">
              <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold ${data.isAuthentic ? 'badge-success' : 'badge-error'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${data.isAuthentic ? 'animate-pulse' : ''}`}
                  style={{ background: data.isAuthentic ? 'var(--success)' : 'var(--error)' }} />
                {data.isAuthentic ? 'Certificate Verified' : 'Certificate Invalid'}
              </span>
            </div>

            {/* Main card */}
            <div className="card p-8 md:p-10 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                style={{ background: 'var(--brand-light)', border: '1px solid var(--brand-border)' }}>
                <svg className="w-8 h-8" style={{ color: 'var(--brand)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>This certifies that</p>
              <h1 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight" style={{ color: 'var(--text-primary)' }}>
                {data.submission?.name}
              </h1>
              <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>has successfully participated in</p>

              <div className="rounded-xl px-6 py-4 mb-8"
                style={{ background: 'var(--brand-light)', border: '1px solid var(--brand-border)' }}>
                <h2 className="text-xl font-bold" style={{ color: 'var(--brand)' }}>
                  {data.submission?.event?.name}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-left pt-6"
                style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Issue Date</p>
                  <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {new Date(data.issuedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>Certificate ID</p>
                  <p className="font-mono text-sm px-3 py-1.5 rounded-lg break-all"
                    style={{ background: 'var(--bg-surface-2)', color: 'var(--brand)', border: '1px solid var(--border-default)' }}>
                    {data.certificateId}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 text-center">
              <Link href="/" className="text-sm transition-colors" style={{ color: 'var(--text-muted)' }}>
                ← Back to Home
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
