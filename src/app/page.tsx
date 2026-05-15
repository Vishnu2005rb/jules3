'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeChecking, setCodeChecking] = useState(false);
  const [codeValue, setCodeValue] = useState('');

  return (
    <div className="min-h-screen font-sans" style={{ background: 'var(--bg-page)', color: 'var(--text-primary)' }}>

      {/* ── Nav ── */}
      <nav style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-default)' }}
        className="sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-base font-bold" style={{ color: 'var(--brand)' }}>CertiVerify</span>

          <div className="hidden md:flex items-center gap-1">
            <button suppressHydrationWarning
              onClick={() => document.getElementById('submit-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-3 py-1.5 text-sm rounded-lg transition-all" style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-surface-2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              Submit
            </button>
            <Link href="/verify" className="px-3 py-1.5 text-sm rounded-lg transition-all" style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-surface-2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              Verify
            </Link>
            <Link href="/admin/login" className="px-3 py-1.5 text-sm rounded-lg transition-all" style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-surface-2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              Admin
            </Link>
            <button suppressHydrationWarning
              onClick={() => document.getElementById('submit-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="ml-2 px-4 py-1.5 rounded-lg text-sm font-semibold text-white transition-all"
              style={{ background: 'var(--brand)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--brand-dark)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--brand)')}>
              Get Certified
            </button>
          </div>

          <button suppressHydrationWarning
            className="md:hidden p-2 rounded-lg" style={{ border: '1px solid var(--border-default)' }}
            onClick={() => setMobileMenuOpen(true)} aria-label="Open menu">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </nav>

      {/* ── Mobile menu ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div className="fixed inset-0 z-[60]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={() => setMobileMenuOpen(false)} />
            <motion.div initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -16, opacity: 0 }}
              className="absolute left-3 right-3 top-3 rounded-xl shadow-xl overflow-hidden"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border-default)' }}>
                <span className="font-semibold text-sm">Menu</span>
                <button suppressHydrationWarning
                  onClick={() => setMobileMenuOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                  style={{ background: 'var(--bg-surface-2)' }}>✕</button>
              </div>
              <div className="p-3 space-y-1">
                <button suppressHydrationWarning
                  onClick={() => { setMobileMenuOpen(false); document.getElementById('submit-section')?.scrollIntoView({ behavior: 'smooth' }); }}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Submit Review
                </button>
                <Link href="/verify" onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Verify Certificate
                </Link>
                <Link href="/admin/login" onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Admin Portal
                </Link>
                <button suppressHydrationWarning
                  onClick={() => { setMobileMenuOpen(false); document.getElementById('submit-section')?.scrollIntoView({ behavior: 'smooth' }); }}
                  className="w-full px-3 py-2.5 rounded-lg text-sm font-semibold text-white text-center" style={{ background: 'var(--brand)' }}>
                  Get Certified
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-6"
            style={{ background: 'var(--brand-light)', color: 'var(--brand)', border: '1px solid var(--brand-border)' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--brand)' }} />
            AI-Powered Certificate Platform
          </span>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-5 leading-tight tracking-tight"
            style={{ color: 'var(--text-primary)' }}>
            Verify Reviews.<br />
            <span style={{ color: 'var(--brand)' }}>Issue Certificates.</span>
          </h1>

          <p className="text-base sm:text-lg mb-8 max-w-xl mx-auto leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Submit your Google review, let our AI verify it, and receive your official certificate automatically — in seconds.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button suppressHydrationWarning
              onClick={() => document.getElementById('submit-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-6 py-3 rounded-lg text-sm font-semibold text-white transition-all"
              style={{ background: 'var(--brand)', boxShadow: 'var(--shadow-md)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--brand-dark)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--brand)')}>
              Submit Review →
            </button>
            <Link href="/verify" className="px-6 py-3 rounded-lg text-sm font-semibold transition-all text-center"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', boxShadow: 'var(--shadow-sm)' }}>
              Verify Certificate
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── Submit form + How it works ── */}
      <section id="submit-section" className="max-w-6xl mx-auto px-4 sm:px-6 pb-24 scroll-mt-16">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Submit Your Review</h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Enter the event code provided by your organizer.
            </p>
          </div>

          <div className="card p-6 sm:p-8 mb-6">
            <form onSubmit={async e => {
              e.preventDefault();
              const code = codeValue.trim();
              if (!code) return;
              setCodeError(null);
              setCodeChecking(true);
              try {
                const res = await fetch(`/api/events/${encodeURIComponent(code)}?byCode=true`);
                const data = await res.json();
                if (data.id) {
                  window.location.href = `/submit?code=${encodeURIComponent(code)}`;
                } else {
                  setCodeError('Invalid event code. Please check with your organizer and try again.');
                }
              } catch {
                setCodeError('Could not verify the code. Check your connection and try again.');
              } finally {
                setCodeChecking(false);
              }
            }} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2"
                  style={{ color: 'var(--text-muted)' }}>Event Code</label>
                <input
                  type="text"
                  required
                  value={codeValue}
                  onChange={e => { setCodeValue(e.target.value.toUpperCase()); setCodeError(null); }}
                  placeholder="e.g. HACK2026"
                  className="w-full rounded-lg px-4 py-3.5 text-xl font-bold text-center uppercase tracking-widest focus:outline-none transition-all"
                  style={{
                    background: codeError ? 'var(--error-bg)' : 'var(--bg-surface-2)',
                    border: `1px solid ${codeError ? 'var(--error-border)' : 'var(--border-default)'}`,
                    color: 'var(--text-primary)',
                  }}
                  suppressHydrationWarning
                />
                <AnimatePresence>
                  {codeError && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="mt-2 text-xs flex items-center gap-1.5" style={{ color: 'var(--error-text)' }}>
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                      </svg>
                      {codeError}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <button suppressHydrationWarning
                type="submit" disabled={codeChecking || !codeValue.trim()}
                className="w-full py-3 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: 'var(--brand)' }}
                onMouseEnter={e => { if (!codeChecking) e.currentTarget.style.background = 'var(--brand-dark)'; }}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--brand)')}>
                {codeChecking
                  ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Verifying...</>
                  : 'Continue →'}
              </button>
            </form>

            <div className="mt-5 pt-5 flex gap-3 items-start" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'var(--info-bg)', border: '1px solid var(--info-border)' }}>
                <svg className="w-3.5 h-3.5" style={{ color: 'var(--info)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Your event code is provided by the organizer. Check your registration email or event dashboard.
              </p>
            </div>
          </div>

          {/* How it works */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { step: '1', title: 'Submit',    desc: 'Upload your Google review screenshot with your event code.' },
              { step: '2', title: 'AI Verify', desc: 'Our OCR engine validates your review authenticity.' },
              { step: '3', title: 'Get Cert',  desc: 'Certificate generated and emailed to you instantly.' },
            ].map(item => (
              <div key={item.step} className="card p-4 text-center">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white mx-auto mb-2"
                  style={{ background: 'var(--brand)' }}>{item.step}</div>
                <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{item.title}</p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3"
        style={{ borderTop: '1px solid var(--border-default)' }}>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>© 2026 CertiVerify. Tarcin Robotic LLP.</p>
        <div className="flex items-center gap-5">
          <Link href="/verify" className="text-sm transition-colors" style={{ color: 'var(--text-muted)' }}>Verify Certificate</Link>
          <Link href="/admin/login" className="text-sm transition-colors" style={{ color: 'var(--text-muted)' }}>Admin</Link>
        </div>
      </footer>
    </div>
  );
}
