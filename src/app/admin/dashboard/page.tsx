'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function AdminDashboard() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/submissions');
      const data = await res.json();
      if (Array.isArray(data)) {
        setSubmissions(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/admin/submissions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      fetchSubmissions();
    }
  };

  const filteredSubmissions = submissions.filter(s => {
    const matchesFilter = filter === 'ALL' || s.status.toUpperCase() === filter;
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
                         s.email.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: submissions.length,
    approved: submissions.filter(s => s.status === 'approved').length,
    rejected: submissions.filter(s => s.status === 'rejected').length,
    pending: submissions.filter(s => s.status === 'pending').length,
  };

  const approvalRate = stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#0a0516] text-white p-6 md:p-12 font-sans relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-600/5 blur-[120px] rounded-full -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 blur-[120px] rounded-full translate-x-1/2 translate-y-1/2" />

      <div className="max-w-7xl mx-auto relative z-10">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">Admin <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Intelligence</span></h1>
            <p className="text-gray-500 font-medium text-lg tracking-wide">Real-time submission monitoring & verification</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto"
          >
             <Link href="/admin/events" className="glass px-8 py-4 rounded-2xl font-black text-sm hover:bg-white/10 transition-all border border-white/5 text-center">Events</Link>
             <Link href="/admin/templates" className="bg-purple-600 px-8 py-4 rounded-2xl font-black text-sm hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/20 text-center">Template Builder</Link>
          </motion.div>
        </header>

        {/* Search & Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-dark border border-white/5 p-4 rounded-[32px] mb-12 flex flex-col md:flex-row gap-6 items-center shadow-2xl"
        >
            <div className="relative flex-1 w-full">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
              <input
                type="text"
                placeholder="Search candidates..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-sm focus:outline-none focus:border-purple-500/50 transition-all placeholder:text-gray-600 font-medium"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-1.5 bg-black/40 p-1.5 rounded-[20px] border border-white/5 w-full md:w-auto overflow-x-auto no-scrollbar">
              {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'HOLD'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-6 py-2.5 rounded-[14px] text-[10px] font-black tracking-widest transition-all uppercase whitespace-nowrap ${filter === f ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  {f}
                </button>
              ))}
            </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {[
            { label: 'Total Volume', value: stats.total, icon: '📊' },
            { label: 'Success Rate', value: `${approvalRate}%`, sub: 'avg', icon: '✨', color: 'text-green-400' },
            { label: 'Flags', value: stats.rejected, icon: '⚠️', color: 'text-red-400' },
            { label: 'Waiting', value: stats.pending, icon: '⏳', color: 'text-yellow-400' },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="glass p-8 rounded-[32px] hover:border-purple-500/30 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-600/5 blur-2xl rounded-full -mr-8 -mt-8 group-hover:bg-purple-600/10 transition-all" />
              <div className="flex justify-between items-start mb-4">
                <span className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">{stat.label}</span>
                <span className="text-xl">{stat.icon}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <p className={`text-4xl font-black tracking-tighter ${stat.color || 'text-white'}`}>{stat.value}</p>
                {stat.sub && <p className="text-[10px] text-gray-600 font-black uppercase">{stat.sub}</p>}
              </div>
            </motion.div>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-6">
             <div className="w-14 h-14 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
             <p className="text-gray-500 font-bold tracking-widest text-xs uppercase animate-pulse">Synchronizing Records...</p>
          </div>
        ) : (
          <div className="space-y-10">
            {filteredSubmissions.length === 0 && (
              <div className="text-center py-32 glass rounded-[40px] border-2 border-dashed border-white/5 text-gray-600">
                <div className="text-6xl mb-6 opacity-20">📂</div>
                <p className="text-xl font-bold">No records found matching current query.</p>
              </div>
            )}
            {filteredSubmissions.map((sub, idx) => (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (idx % 5) * 0.1 }}
                className="glass-dark border border-white/5 rounded-[40px] p-8 md:p-12 flex flex-col xl:flex-row gap-12 hover:border-purple-500/20 transition-all group relative overflow-hidden"
              >
                <div className="w-full xl:w-96 h-96 bg-[#050210] rounded-[32px] overflow-hidden flex-shrink-0 border border-white/5 shadow-2xl relative group-hover:shadow-purple-500/5 transition-all">
                  {sub.reviewImageUrl ? (
                    <img src={sub.reviewImageUrl} alt="Review" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-700 p-8 text-center bg-black/50">
                      <div className="text-5xl mb-6 opacity-10">🔒</div>
                      <p className="text-sm font-black uppercase tracking-widest">Image Purged</p>
                      <p className="text-[10px] mt-2 opacity-50 font-bold uppercase">Privacy-First Architecture</p>
                    </div>
                  )}
                  <div className="absolute top-6 left-6">
                     <div className={`px-5 py-2 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] backdrop-blur-xl border ${
                        sub.status === 'approved' ? 'bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_15px_rgba(74,222,128,0.15)]' :
                        sub.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_15px_rgba(248,113,113,0.15)]' :
                        'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 shadow-[0_0_15px_rgba(250,204,21,0.15)]'
                      }`}>
                        {sub.status}
                      </div>
                  </div>
                </div>

                <div className="flex-grow space-y-10 relative z-10">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                    <div className="space-y-4">
                      <div>
                        <h2 className="text-3xl font-black mb-1.5 group-hover:text-purple-300 transition-colors tracking-tight">{sub.name}</h2>
                        <div className="inline-block px-3 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-widest">
                          {sub.event?.name}
                        </div>
                      </div>
                      <div className="text-gray-500 text-sm font-medium flex flex-wrap gap-x-8 gap-y-2">
                        <span className="flex items-center gap-2">📧 {sub.email}</span>
                        <span className="flex items-center gap-2">📱 {sub.phone || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="glass px-8 py-5 rounded-3xl text-center min-w-[140px] border border-white/5">
                       <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1.5">AI Score</p>
                       <p className="text-3xl font-black text-white">{sub.verificationScore}</p>
                    </div>
                  </div>

                  <div className="bg-black/40 p-8 rounded-[32px] border border-white/5 group-hover:bg-black/60 transition-all relative">
                    <div className="absolute top-4 right-4 text-[10px] font-black text-purple-500/30 uppercase tracking-widest">OCR Logic Output</div>
                    <p className="text-gray-400 leading-relaxed italic font-medium">"{sub.extractedText || 'Extraction process skipped or data empty.'}"</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="p-5 rounded-[24px] bg-white/[0.03] border border-white/5">
                      <p className="text-[9px] text-gray-600 uppercase font-black tracking-widest mb-2">Timestamp</p>
                      <p className="text-sm font-bold">{new Date(sub.createdAt).toLocaleString()}</p>
                    </div>
                    <a href={sub.reviewLink} target="_blank" className="p-5 rounded-[24px] bg-blue-500/[0.03] border border-blue-500/10 hover:bg-blue-500/10 transition-all group/link">
                      <p className="text-[9px] text-gray-600 uppercase font-black tracking-widest mb-2">Primary Source</p>
                      <p className="text-sm text-blue-400 font-bold flex items-center gap-2">External Link <span className="group-hover/link:translate-x-1 transition-transform">↗</span></p>
                    </a>
                    {sub.socialLinks && (
                       <div className="p-5 rounded-[24px] bg-white/[0.03] border border-white/5 flex items-center justify-between">
                          <p className="text-[9px] text-gray-600 uppercase font-black tracking-widest">Social Meta</p>
                          <div className="flex gap-3">
                             {sub.socialLinks.linkedin && <span title="LinkedIn" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center grayscale hover:grayscale-0 transition cursor-help">🔗</span>}
                             {sub.socialLinks.instagram && <span title="Instagram" className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center grayscale hover:grayscale-0 transition cursor-help">📸</span>}
                          </div>
                       </div>
                    )}
                  </div>
                </div>

                <div className="xl:w-64 flex flex-col gap-4 justify-center relative z-10 border-t xl:border-t-0 xl:border-l border-white/5 pt-10 xl:pt-0 xl:pl-10">
                  <button
                    onClick={() => updateStatus(sub.id, 'approved')}
                    className="w-full py-5 rounded-[20px] bg-green-600 hover:bg-green-500 font-black text-xs transition-all shadow-lg shadow-green-900/20 disabled:opacity-20 disabled:cursor-not-allowed group-hover:scale-[1.02]"
                    disabled={sub.status === 'approved'}
                  >
                    AUTHORIZE
                  </button>
                  <button
                    onClick={() => updateStatus(sub.id, 'rejected')}
                    className="w-full py-5 rounded-[20px] bg-red-600/10 border border-red-600/30 hover:bg-red-600/20 text-red-500 font-black text-xs transition-all"
                  >
                    DISCARD
                  </button>
                  <button
                    onClick={() => updateStatus(sub.id, 'hold')}
                    className="w-full py-5 rounded-[20px] bg-white/5 hover:bg-white/10 text-gray-500 font-black text-xs transition-all border border-white/5"
                  >
                    FLAG ON HOLD
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
