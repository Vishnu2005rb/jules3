'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Step metadata ────────────────────────────────────────────────────────────
const STEP_META: Record<string, { label: string; icon: string }> = {
  submission_received:       { label: 'Submission Received',    icon: '📥' },
  ocr_complete:              { label: 'OCR Analysis',           icon: '🔍' },
  cert_start:                { label: 'Certificate Processing', icon: '⚙️' },
  cert_generate:             { label: 'Generating PDF',         icon: '📄' },
  cert_generated:            { label: 'PDF Generated',          icon: '✅' },
  cert_saved:                { label: 'Certificate Saved',      icon: '💾' },
  email_start:               { label: 'Sending Email',          icon: '📤' },
  email_sent:                { label: 'Email Delivered',        icon: '📧' },
  email_invalid:             { label: 'Invalid Email Address',  icon: '⚠️' },
  email_failed:              { label: 'Email Failed',           icon: '❌' },
  email_all_failed:          { label: 'All SMTP Failed',        icon: '🚨' },
  image_purged:              { label: 'Image Removed',          icon: '🗑️' },
  process_complete:          { label: 'Process Complete',       icon: '🎉' },
  process_error:             { label: 'Process Error',          icon: '🚨' },
};

const LEVEL_COLOR: Record<string, { dot: string; text: string; bg: string; border: string }> = {
  success: { dot: '#059669', text: '#065f46', bg: '#ecfdf5', border: '#a7f3d0' },
  error:   { dot: '#dc2626', text: '#991b1b', bg: '#fef2f2', border: '#fecaca' },
  warning: { dot: '#d97706', text: '#92400e', bg: '#fffbeb', border: '#fde68a' },
  info:    { dot: '#2563eb', text: '#1e40af', bg: '#eff6ff', border: '#bfdbfe' },
};

// ─── Shared nav ───────────────────────────────────────────────────────────────
function AdminNav({ active }: { active: string }) {
  const links = [
    { href: '/admin/dashboard', label: 'Submissions' },
    { href: '/admin/events',    label: 'Events' },
    { href: '/admin/analytics', label: 'Analytics' },
    { href: '/admin/templates', label: 'Templates' },
    { href: '/ocr-test',        label: 'OCR Test' },
  ];
  return (
    <nav style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-default)' }}
      className="sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="text-sm font-bold" style={{ color: 'var(--brand)' }}>CertiVerify Admin</span>
          <div className="hidden sm:flex items-center gap-1">
            {links.map(l => (
              <Link key={l.href} href={l.href}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  color: active === l.label ? 'var(--brand)' : 'var(--text-muted)',
                  background: active === l.label ? 'var(--brand-light)' : 'transparent',
                }}>
                {l.label}
              </Link>
            ))}
          </div>
        </div>
        <Link href="/" className="text-xs transition-colors" style={{ color: 'var(--text-muted)' }}>
          ← Public Site
        </Link>
      </div>
    </nav>
  );
}

// ─── Star Rating ──────────────────────────────────────────────────────────────
function StarRating({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-xs" style={{ color: 'var(--text-muted)' }}>No rating</span>;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} className="w-3.5 h-3.5" fill={i <= rating ? 'currentColor' : 'none'}
          viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
          style={{ color: i <= rating ? '#f59e0b' : 'var(--border-strong)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      ))}
      <span className="text-xs ml-1" style={{ color: 'var(--text-muted)' }}>{rating}/5</span>
    </div>
  );
}

// ─── Score Badge with category breakdown ─────────────────────────────────────
function ScoreBadge({ score, logs }: { score: number; logs?: any[] }) {
  const [open, setOpen] = useState(false);

  const color  = score >= 80 ? 'var(--success)' : score >= 60 ? 'var(--warning)' : 'var(--error)';
  const bg     = score >= 80 ? 'var(--success-bg)' : score >= 60 ? 'var(--warning-bg)' : 'var(--error-bg)';
  const border = score >= 80 ? 'var(--success-border)' : score >= 60 ? 'var(--warning-border)' : 'var(--error-border)';

  // Extract score breakdown from the ocr_complete log entry
  const ocrLog = logs?.find((l: any) => l.step === 'ocr_complete');
  const breakdown = ocrLog?.data?.scoreBreakdown as {
    nameMatch: number; starRating: number;
    reviewLength: number; ocrConfidence: number;
  } | undefined;

  const categories = breakdown ? [
    { label: 'Name Match',      value: breakdown.nameMatch,     max: 10,  icon: '👤' },
    { label: 'Star Rating',     value: breakdown.starRating,    max: 30,  icon: '⭐' },
    { label: 'Review Length',   value: breakdown.reviewLength,  max: 30,  icon: '📏' },
    { label: 'OCR Confidence',  value: breakdown.ocrConfidence, max: 30,  icon: '🔍' },
  ] : [];

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="text-center px-4 py-3 rounded-xl transition-all"
        style={{ background: bg, border: `1px solid ${border}`, cursor: breakdown ? 'pointer' : 'default' }}
        title={breakdown ? 'Click to see score breakdown' : undefined}
      >
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-muted)' }}>AI Score</p>
        <p className="text-2xl font-bold" style={{ color }}>{score}</p>
        {breakdown && (
          <p className="text-[9px] mt-0.5" style={{ color }}>tap for details</p>
        )}
      </button>

      {/* Breakdown dropdown */}
      <AnimatePresence>
        {open && breakdown && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 z-50 rounded-xl shadow-xl overflow-hidden"
            style={{
              width: 240,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface-2)' }}>
              <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>Score Breakdown</p>
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Total: {score} / 100</p>
            </div>
            <div className="p-3 space-y-2">
              {categories.map(cat => {
                const pct = cat.max > 0 ? (cat.value / cat.max) * 100 : 0;
                const barColor = cat.value > 0 ? 'var(--brand)' : 'var(--border-default)';
                return (
                  <div key={cat.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-medium flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                        <span>{cat.icon}</span>{cat.label}
                      </span>
                      <span className="text-[11px] font-bold tabular-nums" style={{ color: cat.value > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {cat.value}<span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>/{cat.max}</span>
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-surface-3)' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface-2)' }}>
              <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Total Score</span>
              <span className="text-sm font-bold" style={{ color }}>{score} / 100</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Image Lightbox ───────────────────────────────────────────────────────────
function ImageLightbox({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.92)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          className="relative max-w-5xl max-h-[90vh] w-full"
          onClick={e => e.stopPropagation()}
        >
          <img
            src={src}
            alt="Review screenshot"
            className="w-full h-full object-contain rounded-xl shadow-2xl"
            style={{ maxHeight: '88vh' }}
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-lg transition-all"
            style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(220,38,38,0.8)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.6)')}
          >
            ✕
          </button>
          <p className="text-center text-xs mt-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Press Esc or click outside to close
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
function ProcessingLog({ logs }: { logs: any[] }) {
  const [open, setOpen] = useState(false);

  if (!logs || logs.length === 0) return null;

  const hasError      = logs.some(l => l.level === 'error');
  const emailSent     = logs.some(l => l.step === 'email_sent');
  const emailInvalid  = logs.some(l => l.step === 'email_invalid');
  const certDone      = logs.some(l => l.step === 'cert_generated');

  const summaryColor  = emailInvalid ? 'var(--error)' : hasError ? 'var(--error)' : emailSent ? 'var(--success)' : 'var(--warning)';
  const summaryBg     = emailInvalid ? 'var(--error-bg)' : hasError ? 'var(--error-bg)' : emailSent ? 'var(--success-bg)' : 'var(--warning-bg)';
  const summaryBorder = emailInvalid ? 'var(--error-border)' : hasError ? 'var(--error-border)' : emailSent ? 'var(--success-border)' : 'var(--warning-border)';
  const summaryLabel  = emailInvalid ? 'Invalid Email' : hasError ? 'Error' : emailSent ? 'Email Sent' : certDone ? 'Cert Generated' : 'Processing';

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-default)' }}>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-left transition-all"
        style={{ background: open ? 'var(--bg-surface-2)' : 'var(--bg-surface)' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-surface-2)')}
        onMouseLeave={e => (e.currentTarget.style.background = open ? 'var(--bg-surface-2)' : 'var(--bg-surface)')}
      >
        <div className="flex items-center gap-2.5">
          {/* Status dot */}
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: summaryColor }} />
          <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
            Processing Log
          </span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {logs.length} step{logs.length !== 1 ? 's' : ''}
          </span>
          {/* Status pill */}
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: summaryBg, color: summaryColor, border: `1px solid ${summaryBorder}` }}>
            {summaryLabel}
          </span>
        </div>
        {/* Chevron */}
        <svg
          className="w-4 h-4 transition-transform duration-200 shrink-0"
          style={{ color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expandable log entries */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="divide-y" style={{ borderTop: '1px solid var(--border-subtle)', borderColor: 'var(--border-subtle)' }}>
              {logs.map((log: any, i: number) => {
                const meta  = STEP_META[log.step] ?? { label: log.step.replace(/_/g, ' '), icon: 'ℹ️' };
                const lc    = LEVEL_COLOR[log.level] ?? LEVEL_COLOR.info;
                const time  = log.timestamp
                  ? new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                  : '';
                return (
                  <div key={i} className="flex items-center gap-2.5 px-3 py-2"
                    style={{ background: 'var(--bg-surface)' }}>
                    {/* Step icon — smaller */}
                    <div className="w-5 h-5 rounded flex items-center justify-center text-[11px] shrink-0"
                      style={{ background: lc.bg, border: `1px solid ${lc.border}` }}>
                      {meta.icon}
                    </div>

                    {/* Step info */}
                    <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {meta.label}
                      </span>
                      <span className="text-[9px] font-medium px-1.5 py-0.5 rounded"
                        style={{ background: lc.bg, color: lc.text, border: `1px solid ${lc.border}` }}>
                        {log.level}
                      </span>
                      <span className="text-[10px] truncate hidden sm:block" style={{ color: 'var(--text-muted)' }}>
                        {log.message}
                      </span>
                    </div>

                    {/* Timestamp */}
                    <span className="text-[9px] shrink-0 font-mono" style={{ color: 'var(--text-muted)' }}
                      suppressHydrationWarning>
                      {time}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Status styles ────────────────────────────────────────────────────────────
const STATUS_STYLE: Record<string, string> = {
  approved: 'badge-success',
  rejected: 'badge-error',
  hold:     'badge-warning',
  pending:  'badge-info',
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  useEffect(() => { fetchSubmissions(); }, []);

  const fetchSubmissions = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch('/api/admin/submissions');
      const data = await res.json();
      if (Array.isArray(data)) setSubmissions(data);
    } catch (err) { console.error(err); }
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => fetchSubmissions(true);

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/admin/submissions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) fetchSubmissions(true);
  };

  const filtered = submissions.filter(s => {
    const matchFilter = filter === 'ALL' || s.status.toUpperCase() === filter;
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const stats = {
    total:    submissions.length,
    approved: submissions.filter(s => s.status === 'approved').length,
    rejected: submissions.filter(s => s.status === 'rejected').length,
    pending:  submissions.filter(s => s.status === 'pending').length,
    hold:     submissions.filter(s => s.status === 'hold').length,
  };
  const approvalRate = stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0;

  return (
    <div className="min-h-screen font-sans" style={{ background: 'var(--bg-page)', color: 'var(--text-primary)' }}>
      <AdminNav active="Submissions" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Submissions</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Review and manage participant submissions
            </p>
          </div>
          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-60"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', boxShadow: 'var(--shadow-sm)' }}
            onMouseEnter={e => { if (!refreshing) e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}
          >
            <svg
              className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              style={{ color: refreshing ? 'var(--brand)' : 'var(--text-muted)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
          {[
            { label: 'Total',    value: stats.total,    color: 'var(--text-primary)' },
            { label: 'Approved', value: stats.approved, color: 'var(--success)' },
            { label: 'Hold',     value: stats.hold,     color: 'var(--warning)' },
            { label: 'Rejected', value: stats.rejected, color: 'var(--error)' },
            { label: 'Rate',     value: `${approvalRate}%`, color: approvalRate >= 70 ? 'var(--success)' : 'var(--warning)' },
          ].map(s => (
            <div key={s.label} className="card p-4 text-center">
              <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="card p-3 mb-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input suppressHydrationWarning type="text" placeholder="Search by name or email..."
              className="w-full pl-9 pr-4 py-2 rounded-lg text-sm focus:outline-none transition-all"
              style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--bg-surface-2)' }}>
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'HOLD'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className="px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap"
                style={{
                  background: filter === f ? 'var(--bg-surface)' : 'transparent',
                  color: filter === f ? 'var(--brand)' : 'var(--text-muted)',
                  boxShadow: filter === f ? 'var(--shadow-sm)' : 'none',
                }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Submissions list */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: 'var(--border-default)', borderTopColor: 'var(--brand)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading submissions...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-16 text-center">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'var(--bg-surface-2)' }}>
              <svg className="w-6 h-6" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
              </svg>
            </div>
            <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>No submissions found</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Try adjusting your search or filter.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((sub, idx) => (
              <motion.div key={sub.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (idx % 10) * 0.04 }}
                className="card p-5 sm:p-6">

                {/* ── Top row: screenshot + info + score + actions ── */}
                <div className="flex flex-col lg:flex-row gap-5">

                  {/* Screenshot — click to open full-size lightbox */}
                  <div
                    className="w-full lg:w-44 h-36 rounded-xl overflow-hidden shrink-0 relative cursor-pointer group"
                    style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-default)' }}
                    onClick={() => sub.reviewImageUrl && setLightboxSrc(sub.reviewImageUrl)}
                    title="Click to view full image"
                  >
                    {sub.reviewImageUrl ? (
                      <>
                        <img src={sub.reviewImageUrl} alt="Review" className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105" />
                        {/* Hover overlay */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          style={{ background: 'rgba(0,0,0,0.45)' }}>
                          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                          </svg>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-7 h-7" style={{ color: 'var(--text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      <span className={`badge text-[10px] ${STATUS_STYLE[sub.status] || 'badge-neutral'}`}>
                        {sub.status}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <h2 className="font-bold text-base leading-tight" style={{ color: 'var(--text-primary)' }}>
                          {sub.name}
                        </h2>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-xs font-medium"
                          style={{ background: 'var(--brand-light)', color: 'var(--brand)', border: '1px solid var(--brand-border)' }}>
                          {sub.event?.name}
                        </span>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                          <span>{sub.email}</span>
                          <span>{sub.phone || '—'}</span>
                          <span suppressHydrationWarning>{new Date(sub.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="mt-1.5">
                          <StarRating rating={sub.starRating ?? null} />
                        </div>
                      </div>
                      <ScoreBadge score={sub.verificationScore} logs={sub.processingLog} />
                    </div>

                    {/* Extracted text */}
                    {sub.extractedText && (
                      <div className="p-3 rounded-lg text-sm italic leading-relaxed"
                        style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                        "{sub.extractedText}"
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex lg:flex-col gap-2 lg:w-28 shrink-0 lg:justify-center pt-3 lg:pt-0"
                    style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <button onClick={() => updateStatus(sub.id, 'approved')} disabled={sub.status === 'approved'}
                      className="flex-1 lg:flex-none py-2 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-40"
                      style={{ background: 'var(--success)' }}>
                      Approve
                    </button>
                    <button onClick={() => updateStatus(sub.id, 'hold')}
                      className="flex-1 lg:flex-none py-2 rounded-lg text-xs font-semibold transition-all"
                      style={{ background: 'var(--warning-bg)', color: 'var(--warning-text)', border: '1px solid var(--warning-border)' }}>
                      Hold
                    </button>
                    <button onClick={() => updateStatus(sub.id, 'rejected')}
                      className="flex-1 lg:flex-none py-2 rounded-lg text-xs font-semibold transition-all"
                      style={{ background: 'var(--error-bg)', color: 'var(--error-text)', border: '1px solid var(--error-border)' }}>
                      Reject
                    </button>
                  </div>
                </div>

                {/* ── Invalid Email Warning Banner ── */}
                {sub.processingLog?.some((l: any) => l.step === 'email_invalid') && (
                  <div className="mt-4 pt-4 flex items-start gap-3 p-3 rounded-lg"
                    style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--error-bg)', border: '1px solid var(--error-border)' }}>
                    <svg className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--error)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: 'var(--error-text)' }}>
                        Invalid Email Address — Certificate Not Delivered
                      </p>
                      <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--error-text)', opacity: 0.8 }}>
                        The email <span className="font-mono font-semibold">{sub.email}</span> appears to be invalid.
                        The certificate was generated but could not be sent. Please contact the participant to get a valid email address.
                      </p>
                    </div>
                  </div>
                )}

                {/* ── Processing Log Dropdown (per user) ── */}
                {sub.processingLog && sub.processingLog.length > 0 && (
                  <div className="mt-4 pt-4" style={{ borderTop: sub.processingLog?.some((l: any) => l.step === 'email_invalid') ? 'none' : '1px solid var(--border-subtle)' }}>
                    <ProcessingLog logs={sub.processingLog} />
                  </div>
                )}

              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Image Lightbox */}
      {lightboxSrc && (
        <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      )}
    </div>
  );
}
