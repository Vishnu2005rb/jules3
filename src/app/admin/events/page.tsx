'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function EventManager() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [forms, setForms] = useState<any[]>([]);
  const [certs, setCerts] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState({
    name: '',
    startDate: '',
    endDate: '',
    formTemplateId: '',
    certificateTemplateId: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [eventsRes, templatesRes] = await Promise.all([
        fetch('/api/admin/events'),
        fetch('/api/admin/templates')
      ]);
      const eventsData = await eventsRes.json();
      const templatesData = await templatesRes.json();

      setEvents(eventsData);
      setForms(templatesData.forms || []);
      setCerts(templatesData.certs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId ? { ...newEvent, id: editingId } : newEvent;

      const res = await fetch('/api/admin/events', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setEditingId(null);
        fetchData();
        setNewEvent({ name: '', startDate: '', endDate: '', formTemplateId: '', certificateTemplateId: '' });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Cancel this event and remove all associated data?')) return;
    try {
      await fetch(`/api/admin/events?id=${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0516] text-white p-6 md:p-12 font-sans relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-blue-600/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Link href="/admin/dashboard" className="text-purple-400 text-xs font-black tracking-widest uppercase hover:text-purple-300 transition-colors mb-4 inline-block">← Management Portal</Link>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">Event <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Controller</span></h1>
            <p className="text-gray-500 font-medium text-lg mt-1">Deploy and monitor automated hackathon pipelines</p>
          </motion.div>
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 px-10 py-5 rounded-2xl font-black text-sm hover:shadow-[0_0_30px_rgba(37,99,235,0.3)] transition-all group"
          >
            <span className="group-hover:scale-110 inline-block transition-transform">Initialize New Event</span>
          </motion.button>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-40">
             <div className="w-14 h-14 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {events.map((event, idx) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="glass-dark border border-white/5 p-10 rounded-[40px] group hover:border-blue-500/30 transition-all relative overflow-hidden flex flex-col h-full shadow-2xl"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl rounded-full -mr-10 -mt-10 transition-all" />

                <div className="relative z-10 flex-grow">
                  <div className="flex justify-between items-start mb-6">
                    <div className="px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest">
                      Live Environment
                    </div>
                    <div className="text-[10px] font-black text-gray-700 tracking-tighter uppercase">{event.id.substring(0, 10)}</div>
                  </div>
                  <h3 className="text-2xl font-black mb-6 group-hover:text-blue-300 transition-colors tracking-tight">{event.name}</h3>

                  <div className="space-y-4 mb-10">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                       <span className="uppercase tracking-widest text-[9px] font-black opacity-50">Timeline</span>
                       <span>{new Date(event.startDate).toLocaleDateString()} — {new Date(event.endDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold text-gray-500">
                       <span className="uppercase tracking-widest text-[9px] font-black opacity-50">Submissions</span>
                       <span className="text-white">{event._count?.submissions || 0} Records</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 relative z-10 pt-8 border-t border-white/5">
                  <button
                    onClick={() => {
                      setEditingId(event.id);
                      setNewEvent({
                        name: event.name,
                        startDate: event.startDate.split('T')[0],
                        endDate: event.endDate.split('T')[0],
                        formTemplateId: event.formTemplateId || '',
                        certificateTemplateId: event.certificateTemplateId || ''
                      });
                      setIsModalOpen(true);
                    }}
                    className="flex-1 py-4 rounded-2xl bg-white/5 text-[11px] font-black uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5"
                  >
                    Configure
                  </button>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="px-6 py-4 rounded-2xl bg-red-500/5 text-red-500 hover:bg-red-500/10 transition-all border border-red-500/10"
                  >
                    🗑️
                  </button>
                </div>
              </motion.div>
            ))}

            {events.length === 0 && (
              <div className="col-span-full py-40 text-center glass rounded-[40px] border-2 border-dashed border-white/5 text-gray-600">
                <div className="text-7xl mb-8 opacity-10">🌍</div>
                <p className="text-xl font-bold">The environment is quiet.</p>
                <p className="text-sm font-medium mt-2">Scale your reach by deploying your first event.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Initialize Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-2xl bg-black/80">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-[#0f0720] border border-white/10 w-full max-w-2xl overflow-hidden rounded-[48px] flex flex-col shadow-2xl"
          >
            <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <h2 className="text-3xl font-black tracking-tight">Deploy Event</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white text-3xl font-light">&times;</button>
            </div>

            <form onSubmit={handleCreate} className="p-10 space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Event Designation</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Global AI Hackathon 2026"
                  className="input-field"
                  value={newEvent.name}
                  onChange={e => setNewEvent({...newEvent, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Activation Date</label>
                  <input
                    type="date"
                    required
                    className="input-field"
                    value={newEvent.startDate}
                    onChange={e => setNewEvent({...newEvent, startDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Termination Date</label>
                  <input
                    type="date"
                    required
                    className="input-field"
                    value={newEvent.endDate}
                    onChange={e => setNewEvent({...newEvent, endDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Form Schema</label>
                  <select
                    required
                    className="input-field appearance-none"
                    value={newEvent.formTemplateId}
                    onChange={e => setNewEvent({...newEvent, formTemplateId: e.target.value})}
                  >
                    <option value="">Select Protocol...</option>
                    {forms.map(f => <option key={f.id} value={f.id} className="bg-[#1a0b3c]">{f.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Certificate Layout</label>
                  <select
                    required
                    className="input-field appearance-none"
                    value={newEvent.certificateTemplateId}
                    onChange={e => setNewEvent({...newEvent, certificateTemplateId: e.target.value})}
                  >
                    <option value="">Select Blueprint...</option>
                    {certs.map(c => <option key={c.id} value={c.id} className="bg-[#1a0b3c]">{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="pt-6 flex justify-end gap-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-4 text-xs font-black text-gray-500 hover:text-white transition-all uppercase tracking-widest">Cancel</button>
                <button
                  type="submit"
                  className="bg-blue-600 px-10 py-4 rounded-2xl font-black text-xs hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 uppercase tracking-widest"
                >
                  Confirm Deployment
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
