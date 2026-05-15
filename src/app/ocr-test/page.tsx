'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';

interface ScoreBreakdown {
  nameMatch: number;
  starRating: number;
  reviewLength: number;
  ocrConfidence: number;
}

interface OCRTestResult {
  allLines: string[];
  rawText: string;
  confidence: number;
  totalLines: number;
  reviewerName: string;
  starRating: number | null;
  reviewText: string;
  nameMatched: boolean;
  status: 'approved' | 'hold';
  reviewQuality: 'genuine' | 'hold';
  score: number;
  scoreBreakdown?: ScoreBreakdown;
  reason: string;
  analyzeResult: {
    status: string;
    reason: string;
    rating: number | null;
    text_preview: string;
    reviewer_name: string;
    name_matched: boolean;
  } | null;
  error?: string;
}

const SCORE_CATEGORIES = [
  { key: 'nameMatch',     label: 'Name Match',     max: 10,  icon: '👤', desc: 'Name found in screenshot' },
  { key: 'starRating',    label: 'Star Rating',     max: 30,  icon: '⭐', desc: '5★=30, 4★=25, 3★=20, 2★=0, 1★=0' },
  { key: 'reviewLength',  label: 'Review Length',   max: 30,  icon: '📏', desc: '≥150=30, ≥80=20, ≥30=10, <30=0' },
  { key: 'ocrConfidence', label: 'OCR Confidence',  max: 30,  icon: '🔍', desc: '≥80%=30, ≥50%=20, ≥20%=5' },
] as const;

export default function OCRTestPage() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OCRTestResult | null>(null);
  const [activeTab, setActiveTab] = useState<'extracted' | 'score' | 'raw' | 'debug'>('extracted');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = e => {
      const b64 = e.target?.result as string;
      setImageBase64(b64);
      setImagePreview(b64);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleRun = async () => {
    if (!imageBase64) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/ocr-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageBase64, name }),
      });
      const data = await res.json();
      setResult(data);
      setActiveTab('extracted');
    } catch {
      setResult({ error: 'Request failed. Is the server running?' } as any);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (n: number | null) => {
    if (n === null) return <span className="text-slate-500">Not detected</span>;
    return (
      <span>
        {'★'.repeat(n)}<span className="text-slate-600">{'★'.repeat(5 - n)}</span>
        <span className="text-slate-400 ml-1.5">{n}/5</span>
      </span>
    );
  };

  const statusColor = result?.status === 'approved'
    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
    : 'bg-amber-500/15 text-amber-400 border-amber-500/30';

  return (
    <div className="min-h-screen bg-[#0f1117] text-slate-100 font-sans">

      {/* Nav */}
      <div className="border-b border-slate-800 bg-[#0f1117]/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-5 h-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin/dashboard" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
              ← Admin
            </Link>
            <span className="text-slate-700">|</span>
            <span className="text-sm font-semibold text-indigo-400">OCR Test Tool</span>
          </div>
          <span className="text-xs text-slate-600 font-mono">PaddleOCR + analyze.py</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── LEFT: Input (2 cols) ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Upload area */}
            <div
              className="border-2 border-dashed border-slate-700 rounded-xl p-5 text-center cursor-pointer hover:border-indigo-500/60 transition-colors bg-slate-900/50"
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
            >
              {imagePreview ? (
                <div className="space-y-2">
                  <img src={imagePreview} alt="Preview"
                    className="max-h-56 mx-auto rounded-lg object-contain border border-slate-700" />
                  <p className="text-xs text-slate-600">Click or drop to replace</p>
                </div>
              ) : (
                <div className="py-8 space-y-3">
                  <div className="text-4xl">📷</div>
                  <p className="text-slate-400 text-sm">Drop a review screenshot here</p>
                  <p className="text-xs text-slate-600">PNG, JPG — any Google review layout</p>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </div>

            {/* Name input */}
            <div>
              <label className="block text-xs text-slate-500 uppercase tracking-widest mb-1.5">
                Reviewer Name (for name matching)
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRun()}
                placeholder="e.g. Harini VS"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                suppressHydrationWarning
              />
            </div>

            {/* Run button */}
            <button
              onClick={handleRun}
              disabled={!imageBase64 || loading}
              className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-sm transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Running OCR...</>
              ) : '▶  Run OCR Analysis'}
            </button>

            {/* Quick summary */}
            {result && !result.error && (
              <div className="rounded-xl border border-slate-700 overflow-hidden">
                <div className={`px-4 py-3 flex items-center justify-between border-b border-slate-700 ${statusColor} border`}>
                  <span className="text-sm font-bold uppercase tracking-widest">
                    {result.status === 'approved' ? '✅ Approved' : '⏳ Hold'}
                  </span>
                  <span className="text-2xl font-bold">{result.score}<span className="text-sm font-normal opacity-60">/100</span></span>
                </div>
                <div className="grid grid-cols-3 divide-x divide-slate-700 bg-slate-900">
                  <div className="px-3 py-2.5 text-center">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">Lines</p>
                    <p className="text-lg font-bold text-indigo-400">{result.totalLines}</p>
                  </div>
                  <div className="px-3 py-2.5 text-center">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">Stars</p>
                    <p className="text-lg font-bold text-yellow-400">
                      {result.starRating !== null ? `${result.starRating}★` : '—'}
                    </p>
                  </div>
                  <div className="px-3 py-2.5 text-center">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">Name</p>
                    <p className="text-lg font-bold">
                      {result.nameMatched
                        ? <span className="text-emerald-400">✓</span>
                        : <span className="text-red-400">✗</span>}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT: Results (3 cols) ── */}
          <div className="lg:col-span-3 space-y-4">

            {result?.error && (
              <div className="bg-red-950/50 border border-red-700/50 rounded-xl p-4 text-red-400 text-sm">
                ❌ {result.error}
              </div>
            )}

            {result && !result.error && (
              <>
                {/* Tabs */}
                <div className="flex gap-1 bg-slate-900 border border-slate-700 rounded-lg p-1">
                  {(['extracted', 'score', 'raw', 'debug'] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-1.5 rounded-md text-xs font-semibold uppercase tracking-widest transition-colors ${
                        activeTab === tab ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'
                      }`}>
                      {tab}
                    </button>
                  ))}
                </div>

                {/* ── Extracted tab ── */}
                {activeTab === 'extracted' && (
                  <div className="space-y-3">
                    <Row label="Reviewer Name" value={result.reviewerName || '—'}
                      badge={result.nameMatched ? { text: 'matched', ok: true } : { text: 'not matched', ok: false }} />
                    <Row label="Star Rating" value={renderStars(result.starRating)}
                      badge={
                        result.starRating === null ? { text: 'not detected', ok: null }
                        : result.starRating >= 3 ? { text: `${result.starRating}★ pass`, ok: true }
                        : { text: `${result.starRating}★ hold`, ok: false }
                      } />
                    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Extracted Review Text</p>
                      {result.reviewText ? (
                        <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                          "{result.reviewText}"
                        </p>
                      ) : (
                        <p className="text-sm text-slate-600 italic">No review text extracted</p>
                      )}
                    </div>
                    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Reason</p>
                      <p className="text-sm text-indigo-300">{result.reason || '—'}</p>
                    </div>
                  </div>
                )}

                {/* ── Score tab ── */}
                {activeTab === 'score' && (
                  <div className="space-y-3">
                    {/* Total score bar */}
                    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-slate-300">Total Score</span>
                        <span className="text-3xl font-bold" style={{
                          color: result.score >= 70 ? '#34d399' : result.score >= 40 ? '#fbbf24' : '#f87171'
                        }}>
                          {result.score}<span className="text-base font-normal text-slate-500">/100</span>
                        </span>
                      </div>
                      <div className="h-2.5 rounded-full bg-slate-700 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${result.score}%`,
                            background: result.score >= 70 ? '#10b981' : result.score >= 40 ? '#f59e0b' : '#ef4444'
                          }} />
                      </div>
                      <div className="flex justify-between mt-1.5 text-[10px] text-slate-600">
                        <span>0</span>
                        <span className="text-amber-600">40 Hold</span>
                        <span className="text-emerald-600">70 Approve</span>
                        <span>100</span>
                      </div>
                    </div>

                    {/* Category breakdown */}
                    {result.scoreBreakdown ? (
                      <div className="space-y-2">
                        {SCORE_CATEGORIES.map(cat => {
                          const val = result.scoreBreakdown![cat.key as keyof ScoreBreakdown] ?? 0;
                          const pct = cat.max > 0 ? (val / cat.max) * 100 : 0;
                          const barColor = val === cat.max ? '#10b981' : val > 0 ? '#6366f1' : '#334155';
                          return (
                            <div key={cat.key} className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-base">{cat.icon}</span>
                                  <div>
                                    <p className="text-sm font-semibold text-slate-200">{cat.label}</p>
                                    <p className="text-[10px] text-slate-500">{cat.desc}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="text-lg font-bold" style={{ color: val > 0 ? '#e2e8f0' : '#475569' }}>
                                    {val}
                                  </span>
                                  <span className="text-xs text-slate-600">/{cat.max}</span>
                                </div>
                              </div>
                              <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-500"
                                  style={{ width: `${pct}%`, background: barColor }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 text-sm text-slate-500 text-center">
                        Score breakdown not available (rerun to get breakdown)
                      </div>
                    )}

                    {/* Decision */}
                    <div className={`rounded-xl border p-4 ${statusColor}`}>
                      <p className="text-xs uppercase tracking-widest mb-1 opacity-70">Decision</p>
                      <p className="font-bold text-lg uppercase">{result.status}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {result.status === 'approved'
                          ? 'Score ≥ 70, stars ≥ 3, review text present → certificate will be sent'
                          : 'Score < 70 or stars < 3 or missing review → held for admin review'}
                      </p>
                    </div>
                  </div>
                )}

                {/* ── Raw tab ── */}
                {activeTab === 'raw' && (
                  <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 max-h-[480px] overflow-y-auto">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3 font-mono">
                      {result.totalLines} lines extracted by PaddleOCR
                    </p>
                    <div className="space-y-0.5 font-mono">
                      {result.allLines.map((line, i) => (
                        <div key={i} className="flex gap-3 text-xs hover:bg-slate-700/30 px-1 py-0.5 rounded">
                          <span className="text-slate-600 shrink-0 w-5 text-right select-none">{i}</span>
                          <span className="text-slate-300 break-all">{line}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Debug tab ── */}
                {activeTab === 'debug' && (
                  <div className="space-y-3">
                    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 font-mono">analyze.py output</p>
                      <pre className="text-[11px] text-slate-300 whitespace-pre-wrap break-all font-mono leading-relaxed">
                        {JSON.stringify(result.analyzeResult, null, 2)}
                      </pre>
                    </div>
                    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 font-mono">score breakdown</p>
                      <pre className="text-[11px] text-slate-300 whitespace-pre-wrap font-mono">
                        {JSON.stringify(result.scoreBreakdown, null, 2)}
                      </pre>
                    </div>
                    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 font-mono">confidence</p>
                      <p className="text-sm text-slate-300 font-mono">{result.confidence.toFixed(1)}%</p>
                    </div>
                  </div>
                )}
              </>
            )}

            {!result && !loading && (
              <div className="border border-slate-800 rounded-xl p-12 text-center text-slate-600">
                <p className="text-4xl mb-3">🔍</p>
                <p className="text-sm">Upload an image and click Run OCR</p>
                <p className="text-xs mt-1 text-slate-700">
                  Tests the full analyze.py pipeline including star detection, name matching, and scoring
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Row helper ────────────────────────────────────────────────────────────────
function Row({
  label, value, badge,
}: {
  label: string;
  value: React.ReactNode;
  badge?: { text: string; ok: boolean | null };
}) {
  const badgeStyle = badge?.ok === true
    ? 'bg-emerald-900/40 text-emerald-400 border-emerald-700/50'
    : badge?.ok === false
    ? 'bg-red-900/40 text-red-400 border-red-700/50'
    : 'bg-slate-800 text-slate-500 border-slate-700';

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
      <div>
        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-sm text-slate-200">{value}</p>
      </div>
      {badge && (
        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-widest shrink-0 ${badgeStyle}`}>
          {badge.text}
        </span>
      )}
    </div>
  );
}
