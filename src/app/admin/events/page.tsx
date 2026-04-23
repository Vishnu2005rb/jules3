'use client';

import { useState, useEffect } from 'react';

export default function EventManager() {
  const [events, setEvents] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/admin/events');
      const data = await res.json();
      if (Array.isArray(data)) {
        setEvents(data);
      }
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
      setFormData({ name: '', startDate: '', endDate: '' });
      fetchEvents();
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0720] text-white p-6 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-bold">Event Manager</h1>
            <p className="text-gray-400">Configure hackathons and certificate templates</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="bg-purple-600 px-6 py-3 rounded-xl font-bold hover:bg-purple-700 transition"
          >
            Create New Event
          </button>
        </header>

        {showAdd && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-50">
            <div className="bg-[#1a0b3c] border border-purple-500/20 p-8 rounded-3xl w-full max-w-md shadow-2xl">
              <h2 className="text-2xl font-bold mb-6">New Event</h2>
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
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-3 rounded-xl bg-white/5 font-bold">Cancel</button>
                  <button type="submit" className="flex-1 py-3 rounded-xl bg-purple-600 font-bold">Create</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="grid gap-6">
          {events.map(event => (
            <div key={event.id} className="bg-white/5 border border-purple-500/10 p-6 rounded-3xl flex justify-between items-center group hover:border-purple-500/30 transition">
              <div>
                <h3 className="text-xl font-bold mb-1">{event.name}</h3>
                <p className="text-gray-500 text-sm">
                  {new Date(event.startDate).toLocaleDateString()} — {new Date(event.endDate).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-3">
                <button className="px-4 py-2 rounded-lg bg-white/5 text-sm font-medium hover:bg-white/10 transition">
                  Edit Template
                </button>
                <button className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 transition">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
