'use client';

import { useState, useEffect } from 'react';

export default function EventManager() {
  const [events, setEvents] = useState<any[]>([]);
  const [forms, setForms] = useState<any[]>([]);
  const [certs, setCerts] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    formTemplateId: '',
    certificateTemplateId: '',
  });

  useEffect(() => {
    fetchEvents();
    fetchTemplates();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/admin/events');
      const data = await res.json();
      if (Array.isArray(data)) setEvents(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/admin/templates');
      const data = await res.json();
      setForms(data.forms || []);
      setCerts(data.certs || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      setShowAdd(false);
      setFormData({ name: '', startDate: '', endDate: '', formTemplateId: '', certificateTemplateId: '' });
      fetchEvents();
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0720] text-white p-6 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-bold">Event Manager</h1>
            <p className="text-gray-400">Configure hackathons and automate certificate issuance</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="bg-purple-600 px-6 py-3 rounded-xl font-bold hover:bg-purple-700 transition shadow-[0_0_20px_rgba(168,85,247,0.3)]"
          >
            Create New Event
          </button>
        </header>

        {showAdd && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-50">
            <div className="bg-[#1a0b3c] border border-purple-500/20 p-8 rounded-3xl w-full max-w-xl shadow-2xl">
              <h2 className="text-2xl font-bold mb-6">New Event Configuration</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Event Name</label>
                  <input
                    type="text" required
                    className="w-full bg-white/5 border border-purple-500/20 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Start Date</label>
                    <input
                      type="date" required
                      className="w-full bg-white/5 border border-purple-500/20 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
                      value={formData.startDate}
                      onChange={e => setFormData({...formData, startDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">End Date</label>
                    <input
                      type="date" required
                      className="w-full bg-white/5 border border-purple-500/20 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
                      value={formData.endDate}
                      onChange={e => setFormData({...formData, endDate: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Form Template</label>
                    <select
                      required
                      className="w-full bg-white/5 border border-purple-500/20 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
                      value={formData.formTemplateId}
                      onChange={e => setFormData({...formData, formTemplateId: e.target.value})}
                    >
                      <option value="">Select Template</option>
                      {forms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Cert Template</label>
                    <select
                      required
                      className="w-full bg-white/5 border border-purple-500/20 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
                      value={formData.certificateTemplateId}
                      onChange={e => setFormData({...formData, certificateTemplateId: e.target.value})}
                    >
                      <option value="">Select Template</option>
                      {certs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-4 pt-6">
                  <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-3 rounded-xl bg-white/5 font-bold">Cancel</button>
                  <button type="submit" className="flex-1 py-3 rounded-xl bg-purple-600 font-bold">Save Configuration</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="grid gap-6">
          {events.map(event => {
            const isActive = new Date() >= new Date(event.startDate) && new Date() <= new Date(event.endDate);
            return (
              <div key={event.id} className="bg-white/5 border border-purple-500/10 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center group hover:border-purple-500/30 transition">
                <div className="mb-4 md:mb-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-bold">{event.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {isActive ? 'Active' : 'Closed'}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm">
                    {new Date(event.startDate).toLocaleDateString()} — {new Date(event.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                  <button className="flex-1 md:flex-none px-4 py-2 rounded-lg bg-white/5 text-sm font-medium hover:bg-white/10 transition">
                    Settings
                  </button>
                  <button className="flex-1 md:flex-none px-4 py-2 rounded-lg bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 transition">
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
