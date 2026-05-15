'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';


// ─── Types ────────────────────────────────────────────────────────────────────
interface Submission {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
  certificate?: any;
  event?: { id: string; name: string };
}

interface Event {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  _count?: { submissions: number };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  approved: '#10b981',
  hold:     '#f59e0b',
  rejected: '#ef4444',
  pending:  '#6366f1',
};

const STATUS_BG: Record<string, string> = {
  approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  hold:     'bg-amber-500/10 text-amber-400 border-amber-500/20',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
  pending:  'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
};

// ─── Tooltip ──────────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg px-3 py-2.5 shadow-xl text-xs"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-lg)' }}>
      {label && <p className="mb-1.5 font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-semibold" style={{ color: p.color }}>
          {p.name}: <span style={{ color: 'var(--text-primary)' }}>{p.value}</span>
        </p>
      ))}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }: {
  label: string; value: string | number; sub?: string; accent?: string;
}) {
  return (
    <div className="card p-5">
      <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-2xl font-bold" style={{ color: accent || 'var(--text-primary)' }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
    </div>
  );
}

function SectionCard({ title, children, action }: {
  title: string; children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── Event Selector ───────────────────────────────────────────────────────────
function EventSelector({ events, selected, onChange }: {
  events: Event[]; selected: string; onChange: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {['all', ...events.map(e => e.id)].map(id => {
        const label = id === 'all' ? 'All Events' : events.find(e => e.id === id)?.name ?? id;
        const isActive = selected === id;
        return (
          <button key={id} onClick={() => onChange(id)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all truncate max-w-[160px]"
            style={{
              background: isActive ? 'var(--brand-light)' : 'var(--bg-surface-2)',
              border: `1px solid ${isActive ? 'var(--brand-border)' : 'var(--border-default)'}`,
              color: isActive ? 'var(--brand)' : 'var(--text-muted)',
            }}
            title={label}>
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<string>('all');

  useEffect(() => {
    async function load() {
      try {
        const [evRes, subRes] = await Promise.all([
          fetch('/api/admin/events'),
          fetch('/api/admin/submissions'),
        ]);
        const evData = await evRes.json();
        const subData = await subRes.json();
        setEvents(Array.isArray(evData) ? evData : []);
        setAllSubmissions(Array.isArray(subData) ? subData : []);
      } catch (err) {
        console.error('Analytics load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ── Filtered submissions based on selected event ──────────────────────────
  const subs = useMemo(() => {
    if (selectedEvent === 'all') return allSubmissions;
    return allSubmissions.filter(s => s.event?.id === selectedEvent);
  }, [allSubmissions, selectedEvent]);

  // ── Derived stats ─────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const approved  = subs.filter(s => s.status === 'approved').length;
    const hold      = subs.filter(s => s.status === 'hold').length;
    const rejected  = subs.filter(s => s.status === 'rejected').length;
    const pending   = subs.filter(s => s.status === 'pending').length;
    const certs     = subs.filter(s => s.certificate).length;
    const rate      = subs.length > 0 ? Math.round((approved / subs.length) * 100) : 0;

    const now = new Date();
    const ongoing   = events.filter(e => new Date(e.startDate) <= now && new Date(e.endDate) >= now).length;
    const completed = events.filter(e => new Date(e.endDate) < now).length;

    return { approved, hold, rejected, pending, certs, rate, ongoing, completed };
  }, [subs, events]);

  // ── Submissions by day (last 14 days) ─────────────────────────────────────
  const submissionsByDay = useMemo(() => {
    const days: Record<string, { date: string; total: number; approved: number; hold: number; rejected: number }> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      days[key] = { date: key, total: 0, approved: 0, hold: 0, rejected: 0 };
    }
    subs.forEach(s => {
      const key = new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (days[key]) {
        days[key].total++;
        if (s.status === 'approved') days[key].approved++;
        if (s.status === 'hold')     days[key].hold++;
        if (s.status === 'rejected') days[key].rejected++;
      }
    });
    return Object.values(days);
  }, [subs]);

  // ── Status breakdown (donut) ──────────────────────────────────────────────
  const statusBreakdown = useMemo(() => [
    { name: 'Approved', value: stats.approved, color: STATUS_COLORS.approved },
    { name: 'Hold',     value: stats.hold,     color: STATUS_COLORS.hold },
    { name: 'Rejected', value: stats.rejected, color: STATUS_COLORS.rejected },
    { name: 'Pending',  value: stats.pending,  color: STATUS_COLORS.pending },
  ].filter(d => d.value > 0), [stats]);

  // ── Per-event participation (only shown in "All Events" view) ─────────────
  const eventParticipation = useMemo(() => {
    if (selectedEvent !== 'all') return [];
    const map: Record<string, { name: string; total: number; approved: number; hold: number; rejected: number }> = {};
    allSubmissions.forEach(s => {
      const id   = s.event?.id   || 'unknown';
      const name = s.event?.name || 'Unknown';
      if (!map[id]) map[id] = { name: name.length > 18 ? name.slice(0, 18) + '…' : name, total: 0, approved: 0, hold: 0, rejected: 0 };
      map[id].total++;
      if (s.status === 'approved') map[id].approved++;
      if (s.status === 'hold')     map[id].hold++;
      if (s.status === 'rejected') map[id].rejected++;
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 8);
  }, [allSubmissions, selectedEvent]);

  // ── Score distribution for selected event ────────────────────────────────
  const scoreDistribution = useMemo(() => {
    const buckets = [
      { range: '0–20',  count: 0 },
      { range: '21–40', count: 0 },
      { range: '41–60', count: 0 },
      { range: '61–80', count: 0 },
      { range: '81–100',count: 0 },
    ];
    (subs as any[]).forEach(s => {
      const score = s.verificationScore ?? 0;
      if (score <= 20)       buckets[0].count++;
      else if (score <= 40)  buckets[1].count++;
      else if (score <= 60)  buckets[2].count++;
      else if (score <= 80)  buckets[3].count++;
      else                   buckets[4].count++;
    });
    return buckets;
  }, [subs]);

  // ── Recent activity ───────────────────────────────────────────────────────
  const recentActivity = useMemo(() =>
    [...subs]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10),
    [subs]
  );

  const selectedEventName = selectedEvent === 'all'
    ? 'All Events'
    : events.find(e => e.id === selectedEvent)?.name ?? 'Event';

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading analytics…</p>
        </div>
      </div>
    );
  }

  const axisStyle = { fill: '#9ca3af', fontSize: 11 };
  const gridStyle = { stroke: '#f0f1f5', strokeDasharray: '3 3' };

  return (
    <div className="min-h-screen p-5 md:p-8 font-sans" style={{ background: 'var(--bg-page)', color: 'var(--text-primary)' }}>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/admin/dashboard" className="text-xs transition-colors" style={{ color: 'var(--text-muted)' }}>
                ← Dashboard
              </Link>
            </div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Analytics</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {selectedEvent === 'all'
                ? `Overview across ${events.length} event${events.length !== 1 ? 's' : ''}`
                : `Showing data for: ${selectedEventName}`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link href="/admin/events" className="btn-secondary text-xs px-3 py-2">Events</Link>
            <Link href="/admin/templates" className="btn-secondary text-xs px-3 py-2">Templates</Link>
          </div>
        </div>

        {/* ── Event Filter ── */}
        <div className="card p-4">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Filter by Event</p>
          <EventSelector events={events} selected={selectedEvent} onChange={setSelectedEvent} />
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Submissions"  value={subs.length} />
          <StatCard label="Approved"     value={stats.approved}  accent="#10b981" />
          <StatCard label="On Hold"      value={stats.hold}      accent="#f59e0b" />
          <StatCard label="Rejected"     value={stats.rejected}  accent="#ef4444" />
          <StatCard label="Certificates" value={stats.certs}     accent="#6366f1" />
          <StatCard
            label="Approval Rate"
            value={`${stats.rate}%`}
            accent={stats.rate >= 70 ? '#10b981' : stats.rate >= 40 ? '#f59e0b' : '#ef4444'}
            sub={`${stats.approved} of ${subs.length}`}
          />
        </div>

        {/* ── Global event stats (only in All Events view) ── */}
        {selectedEvent === 'all' && (
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Total Events"     value={events.length} />
            <StatCard label="Active Events"    value={stats.ongoing}   accent="#10b981" />
            <StatCard label="Completed Events" value={stats.completed} accent="#6366f1" />
          </div>
        )}

        {/* ── Charts Row 1: Timeline + Status Donut ── */}
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <SectionCard title={`Submissions — Last 14 Days${selectedEvent !== 'all' ? ` · ${selectedEventName}` : ''}`}>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={submissionsByDay} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gApproved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...gridStyle} />
                  <XAxis dataKey="date" tick={axisStyle} axisLine={false} tickLine={false} interval={1} />
                  <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)' }} />
                  <Area type="monotone" dataKey="total"    name="Total"    stroke="#6366f1" fill="url(#gTotal)"    strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="approved" name="Approved" stroke="#10b981" fill="url(#gApproved)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="hold"     name="Hold"     stroke="#f59e0b" fill="none"            strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                </AreaChart>
              </ResponsiveContainer>
            </SectionCard>
          </div>

          <SectionCard title="Status Breakdown">
            {statusBreakdown.length === 0 ? (
              <div className="h-[220px] flex items-center justify-center text-sm text-gray-500">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={statusBreakdown}
                    cx="50%" cy="45%"
                    innerRadius={52} outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusBreakdown.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </SectionCard>
        </div>

        {/* ── Charts Row 2: Event Participation (All) OR Score Distribution (Single) ── */}
        <div className="grid lg:grid-cols-2 gap-4">
          {selectedEvent === 'all' ? (
            /* All Events: participants per event */
            <SectionCard title="Participants per Event">
              {eventParticipation.length === 0 ? (
                <div className="h-[220px] flex items-center justify-center text-sm text-gray-500">No data</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={eventParticipation} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                    <CartesianGrid {...gridStyle} />
                    <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
                    <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)' }} />
                    <Bar dataKey="total"    name="Total"    fill="#6366f1" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="approved" name="Approved" fill="#10b981" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="hold"     name="Hold"     fill="#f59e0b" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </SectionCard>
          ) : (
            /* Single Event: approval rate per event (comparison bar) */
            <SectionCard title={`Status Breakdown · ${selectedEventName}`}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={[
                    { name: 'Approved', value: stats.approved, fill: '#10b981' },
                    { name: 'Hold',     value: stats.hold,     fill: '#f59e0b' },
                    { name: 'Rejected', value: stats.rejected, fill: '#ef4444' },
                    { name: 'Pending',  value: stats.pending,  fill: '#6366f1' },
                  ]}
                  margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
                >
                  <CartesianGrid {...gridStyle} />
                  <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
                  <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="value" name="Count" radius={[4, 4, 0, 0]}>
                    {[
                      { fill: '#10b981' },
                      { fill: '#f59e0b' },
                      { fill: '#ef4444' },
                      { fill: '#6366f1' },
                    ].map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </SectionCard>
          )}

          {/* Score distribution */}
          <SectionCard title={`Verification Score Distribution${selectedEvent !== 'all' ? ` · ${selectedEventName}` : ''}`}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={scoreDistribution} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid {...gridStyle} />
                <XAxis dataKey="range" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" name="Submissions" radius={[3, 3, 0, 0]}>
                  {scoreDistribution.map((_, i) => (
                    <Cell key={i} fill={['#ef4444', '#f59e0b', '#f59e0b', '#10b981', '#10b981'][i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </SectionCard>
        </div>

        {/* ── Daily Approval vs Hold line chart ── */}
        <SectionCard title={`Daily Approval vs Hold${selectedEvent !== 'all' ? ` · ${selectedEventName}` : ''}`}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={submissionsByDay} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid {...gridStyle} />
              <XAxis dataKey="date" tick={axisStyle} axisLine={false} tickLine={false} interval={1} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)' }} />
              <Line type="monotone" dataKey="approved" name="Approved" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 3 }} />
              <Line type="monotone" dataKey="hold"     name="Hold"     stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 3 }} />
              <Line type="monotone" dataKey="rejected" name="Rejected" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444', r: 3 }} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </SectionCard>

        {/* ── Recent Activity ── */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Recent Submissions
              {selectedEvent !== 'all' && <span className="font-normal ml-2" style={{ color: 'var(--text-muted)' }}>· {selectedEventName}</span>}
            </h3>
            <Link href="/admin/dashboard" className="text-xs font-medium transition-colors" style={{ color: 'var(--brand)' }}>
              View all →
            </Link>
          </div>

          {recentActivity.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No submissions yet</div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
              {recentActivity.map((sub) => (
                <div key={sub.id} className="flex items-center gap-4 px-5 py-3.5 transition-colors"
                  style={{ cursor: 'default' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-surface-2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white"
                    style={{ background: 'var(--brand)' }}>
                    {sub.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{sub.name}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{sub.event?.name || '—'}</p>
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    <span className={`badge text-[10px] ${STATUS_BG[sub.status] || 'badge-neutral'}`}>
                      {sub.status}
                    </span>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }} suppressHydrationWarning>
                      {new Date(sub.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
