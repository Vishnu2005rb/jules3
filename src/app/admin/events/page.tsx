'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

function AdminNav({ active }: { active: string }) {
  const links = [
    { href: '/admin/dashboard', label: 'Submissions' },
    { href: '/admin/events',    label: 'Events' },
    { href: '/admin/analytics', label: 'Analytics' },
    { href: '/admin/templates', label: 'Templates' },
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
        <Link href="/" className="text-xs transition-colors" style={{ color: 'var(--text-muted)' }}>← Public Site</Link>
      </div>
    </nav>
  );
}

export default function EventManager() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [forms, setForms] = useState<any[]>([]);
  const [certs, setCerts] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState({
    name: '', eventCode: '', startDate: '', endDate: '',
    formTemplateId: '', certificateTemplateId: ''
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [evRes, tplRes] = await Promise.all([
        fetch('/api/admin/events'), fetch('/api/admin/templates')
      ]);
      const evData  = await evRes.json();
      const tplData = await tplRes.json();
      setEvents(Array.isArray(evData) ? evData : []);
      setForms(tplData.forms || []);
      setCerts(tplData.certs || []);
    } catch { setEvents([]); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    try {
      const method = editingId ? 'PUT' : 'POST';
      const body   = editingId ? { ...newEvent, id: editingId } : newEvent;
      const res    = await fetch('/api/admin/events', {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) { setSubmitError(data.error || 'Failed to save event.'); return; }
      setIsModalOpen(false); setEditingId(null); setSubmitError('');
      fetchData();
      setNewEvent({ name: '', eventCode: '', startDate: '', endDate: '', formTemplateId: '', certificateTemplateId: '' });
    } catch { setSubmitError('Network error. Please try again.'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this event and all associated data?')) return;
    await fetch(`/api/admin/events?id=${id}`, { method: 'DELETE' });
    fetchData();
  };

  const now = new Date();
  const getStatus = (ev: any) => {
    if (new Date(ev.endDate) < now) return { label: 'Ended',  color: 'badge-neutral' };
    if (new Date(ev.startDate) > now) return { label: 'Upcoming', color: 'badge-info' };
    return { label: 'Active', color: 'badge-success' };
  };

  return (
    <div className="min-h-screen font-sans" style={{ background: 'var(--bg-page)', color: 'var(--text-primary)' }}>
      <AdminNav active="Events" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Events</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Create and manage certification events</p>
          </div>
          <button onClick={() => { setEditingId(null); setNewEvent({ name: '', eventCode: '', startDate: '', endDate: '', formTemplateId: '', certificateTemplateId: '' }); setIsModalOpen(true); }}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all"
            style={{ background: 'var(--brand)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--brand-dark)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--brand)')}>
            + Create Event
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: 'var(--border-default)', borderTopColor: 'var(--brand)' }} />
          </div>
        ) : events.length === 0 ? (
          <div className="card p-16 text-center">
            <p className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>No events yet</p>
            <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>Create your first event to get started.</p>
            <button onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ background: 'var(--brand)' }}>
              Create Event
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map((event, idx) => {
              const status = getStatus(event);
              return (
                <motion.div key={event.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06 }} className="card p-5 flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <span className={`badge ${status.color}`}>{status.label}</span>
                    <button onClick={() => navigator.clipboard.writeText(event.eventCode)}
                      className="text-xs px-2 py-1 rounded-md font-mono font-semibold transition-all"
                      style={{ background: 'var(--brand-light)', color: 'var(--brand)', border: '1px solid var(--brand-border)' }}
                      title="Click to copy">
                      {event.eventCode}
                    </button>
                  </div>

                  <h3 className="font-semibold text-base mb-3 leading-tight" style={{ color: 'var(--text-primary)' }}>
                    {event.name}
                  </h3>

                  <div className="space-y-2 text-sm flex-1" style={{ color: 'var(--text-muted)' }}>
                    <div className="flex justify-between">
                      <span>Dates</span>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {new Date(event.startDate).toLocaleDateString()} – {new Date(event.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Submissions</span>
                      <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {event._count?.submissions || 0}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                      <span>Form</span>
                      <span style={{ color: event.formTemplate ? 'var(--success)' : 'var(--text-muted)' }}>
                        {event.formTemplate?.name || 'Not assigned'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Certificate</span>
                      <span style={{ color: event.certificateTemplate ? 'var(--success)' : 'var(--text-muted)' }}>
                        {event.certificateTemplate?.name || 'Not assigned'}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <button onClick={() => {
                      setEditingId(event.id);
                      setNewEvent({
                        name: event.name, eventCode: event.eventCode,
                        startDate: event.startDate.split('T')[0], endDate: event.endDate.split('T')[0],
                        formTemplateId: event.formTemplateId || '', certificateTemplateId: event.certificateTemplateId || ''
                      });
                      setIsModalOpen(true);
                    }}
                      className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
                      style={{ background: 'var(--bg-surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}>
                      Edit
                    </button>
                    <button onClick={() => handleDelete(event.id)}
                      className="px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                      style={{ background: 'var(--error-bg)', color: 'var(--error-text)', border: '1px solid var(--error-border)' }}>
                      Delete
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'var(--bg-overlay)' }}>
          <motion.div initial={{ opacity: 0, scale: 0.97, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-lg rounded-xl shadow-xl flex flex-col max-h-[90vh]"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>

            <div className="flex items-center justify-between px-6 py-4"
              style={{ borderBottom: '1px solid var(--border-default)' }}>
              <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {editingId ? 'Edit Event' : 'Create Event'}
              </h2>
              <button onClick={() => { setIsModalOpen(false); setSubmitError(''); }}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                style={{ background: 'var(--bg-surface-2)', color: 'var(--text-muted)' }}>✕</button>
            </div>

            <form id="event-form" onSubmit={handleCreate} className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5"
                  style={{ color: 'var(--text-muted)' }}>Event Name</label>
                <input suppressHydrationWarning type="text" required placeholder="e.g. Global AI Hackathon 2026"
                  className="input-field" value={newEvent.name}
                  onChange={e => setNewEvent({ ...newEvent, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5"
                  style={{ color: 'var(--text-muted)' }}>Event Code</label>
                <input suppressHydrationWarning type="text" required placeholder="e.g. HACK2026"
                  className="input-field text-center font-mono font-bold tracking-widest uppercase"
                  value={newEvent.eventCode}
                  onChange={e => setNewEvent({ ...newEvent, eventCode: e.target.value.toUpperCase() })} />
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  Users enter this code to access the submission form
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5"
                    style={{ color: 'var(--text-muted)' }}>Start Date</label>
                  <input suppressHydrationWarning type="date" required className="input-field" value={newEvent.startDate}
                    onChange={e => setNewEvent({ ...newEvent, startDate: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5"
                    style={{ color: 'var(--text-muted)' }}>End Date</label>
                  <input suppressHydrationWarning type="date" required className="input-field" value={newEvent.endDate}
                    onChange={e => setNewEvent({ ...newEvent, endDate: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5"
                    style={{ color: 'var(--text-muted)' }}>Form Template</label>
                  <select className="input-field appearance-none" value={newEvent.formTemplateId}
                    onChange={e => setNewEvent({ ...newEvent, formTemplateId: e.target.value })}>
                    <option value="">None</option>
                    {forms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                  {forms.length === 0 && (
                    <Link href="/admin/templates" className="text-xs mt-1 inline-block" style={{ color: 'var(--brand)' }}>
                      Create template first →
                    </Link>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5"
                    style={{ color: 'var(--text-muted)' }}>Certificate Template</label>
                  <select className="input-field appearance-none" value={newEvent.certificateTemplateId}
                    onChange={e => setNewEvent({ ...newEvent, certificateTemplateId: e.target.value })}>
                    <option value="">None</option>
                    {certs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {certs.length === 0 && (
                    <Link href="/admin/templates" className="text-xs mt-1 inline-block" style={{ color: 'var(--brand)' }}>
                      Create template first →
                    </Link>
                  )}
                </div>
              </div>
              {submitError && (
                <div className="p-3 rounded-lg text-sm" style={{ background: 'var(--error-bg)', color: 'var(--error-text)', border: '1px solid var(--error-border)' }}>
                  {submitError}
                </div>
              )}
            </form>

            <div className="flex justify-end gap-3 px-6 py-4" style={{ borderTop: '1px solid var(--border-default)' }}>
              <button type="button" onClick={() => { setIsModalOpen(false); setSubmitError(''); }}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{ background: 'var(--bg-surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)' }}>
                Cancel
              </button>
              <button type="submit" form="event-form"
                className="px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all"
                style={{ background: 'var(--brand)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--brand-dark)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--brand)')}>
                {editingId ? 'Save Changes' : 'Create Event'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
