'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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
    <div className="min-h-screen bg-[#0f0720] text-white p-6 md:p-12 font-sans relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full translate-x-1/2 translate-y-1/2"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-16">
          <div>
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-white via-white to-purple-400 bg-clip-text text-transparent mb-2">Admin Dashboard</h1>
            <p className="text-gray-400 text-lg">Real-time submission intelligence & management</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
             <Link href="/admin/events" className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 font-bold hover:bg-white/10 transition text-center">Manage Events</Link>
             <Link href="/admin/templates" className="px-6 py-3 rounded-xl bg-purple-600 font-bold hover:bg-purple-700 transition shadow-lg shadow-purple-600/20 text-center">Templates</Link>
          </div>
        </header>

        {/* Search & Filter Bar */}
        <div className="bg-white/5 border border-white/5 backdrop-blur-xl p-4 rounded-3xl mb-12 flex flex-col md:flex-row gap-6 items-center">
            <div className="relative flex-1 w-full">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
              <input
                type="text"
                placeholder="Search by name, email or phone..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-purple-500/50 transition-all"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-1 bg-black/20 p-1.5 rounded-2xl border border-white/5 w-full md:w-auto overflow-x-auto no-scrollbar">
              {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'HOLD'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-6 py-2 rounded-xl text-xs font-black transition-all uppercase whitespace-nowrap ${filter === f ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  {f}
                </button>
              ))}
            </div>
        </div>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {[
            { label: 'Total Submissions', value: stats.total, color: 'text-white' },
            { label: 'Approval Rate', value: `${approvalRate}%`, sub: 'of total', color: 'text-green-400' },
            { label: 'Rejected', value: stats.rejected, color: 'text-red-400' },
            { label: 'Pending Review', value: stats.pending, color: 'text-yellow-400' },
          ].map((stat, idx) => (
            <div key={idx} className="bg-gradient-to-br from-white/10 to-transparent border border-white/10 p-8 rounded-[32px] hover:border-purple-500/20 transition-all group">
              <p className="text-gray-500 text-xs font-black uppercase tracking-widest mb-2 group-hover:text-purple-400 transition-colors">{stat.label}</p>
              <div className="flex items-baseline gap-2">
                <p className={`text-4xl font-black ${stat.color}`}>{stat.value}</p>
                {stat.sub && <p className="text-xs text-gray-600 font-bold">{stat.sub}</p>}
              </div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
             <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
             <p className="text-gray-500 font-bold animate-pulse">Synchronizing Data...</p>
          </div>
        ) : (
          <div className="grid gap-10">
            {filteredSubmissions.length === 0 && (
              <div className="text-center py-32 bg-white/[0.02] rounded-[40px] border-2 border-dashed border-white/5 text-gray-500">
                <div className="text-6xl mb-6 opacity-20">📂</div>
                <p className="text-xl font-bold">No submissions match your criteria.</p>
                <p className="text-sm mt-1">Try adjusting your filters or search terms.</p>
              </div>
            )}
            {filteredSubmissions.map(sub => (
              <div key={sub.id} className="bg-white/5 border border-white/5 backdrop-blur-3xl rounded-[40px] p-8 md:p-10 flex flex-col xl:flex-row gap-10 hover:border-purple-500/20 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/5 blur-[80px] rounded-full -mr-20 -mt-20 group-hover:bg-purple-600/10 transition-all"></div>

                <div className="w-full xl:w-80 h-80 bg-[#050210] rounded-[32px] overflow-hidden flex-shrink-0 border border-white/5 shadow-2xl relative">
                  {sub.reviewImageUrl ? (
                    <img src={sub.reviewImageUrl} alt="Review" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 p-8 text-center bg-black/40">
                      <div className="text-4xl mb-4 opacity-20">🔒</div>
                      <p className="text-sm font-bold">Image Purged</p>
                      <p className="text-[10px] mt-2 opacity-50 uppercase tracking-tighter">Privacy Protection Active</p>
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                     <div className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest backdrop-blur-md border ${
                        sub.status === 'approved' ? 'bg-green-500/20 text-green-400 border-green-500/20' :
                        sub.status === 'rejected' ? 'bg-red-500/20 text-red-400 border-red-500/20' :
                        'bg-yellow-500/20 text-yellow-400 border-yellow-500/20'
                      }`}>
                        {sub.status}
                      </div>
                  </div>
                </div>

                <div className="flex-grow space-y-8 relative z-10">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div>
                      <h2 className="text-3xl font-black mb-1 group-hover:text-purple-300 transition-colors">{sub.name}</h2>
                      <p className="text-purple-400 text-sm font-bold tracking-wide uppercase">{sub.event?.name}</p>
                      <p className="text-gray-500 text-sm mt-3 flex items-center gap-4">
                        <span>📧 {sub.email}</span>
                        <span>📱 {sub.phone || 'N/A'}</span>
                      </p>
                    </div>
                    <div className="bg-purple-500/10 border border-purple-500/20 px-6 py-4 rounded-3xl text-center min-w-[120px]">
                       <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Score</p>
                       <p className="text-2xl font-black text-white">{sub.verificationScore}</p>
                    </div>
                  </div>

                  <div className="bg-black/30 p-6 rounded-3xl border border-white/5 group-hover:bg-black/40 transition-all">
                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-3">AI Analysis: OCR Data</p>
                    <p className="text-sm text-gray-400 leading-relaxed italic font-medium">"{sub.extractedText || 'Extraction failed or empty.'}"</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                      <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Submission Time</p>
                      <p className="text-sm font-bold">{new Date(sub.createdAt).toLocaleString()}</p>
                    </div>
                    <a href={sub.reviewLink} target="_blank" className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 hover:bg-blue-500/10 transition group/link">
                      <p className="text-[10px] text-gray-500 uppercase font-black mb-1">Review Source</p>
                      <p className="text-sm text-blue-400 font-bold flex items-center gap-2">View Link <span className="group-hover/link:translate-x-1 transition-transform">↗</span></p>
                    </a>
                    {sub.socialLinks && (
                       <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex gap-4 items-center">
                          <p className="text-[10px] text-gray-500 uppercase font-black">Socials</p>
                          <div className="flex gap-2">
                             {sub.socialLinks.linkedin && <span title="LinkedIn" className="opacity-50 hover:opacity-100 transition cursor-help">🔗</span>}
                             {sub.socialLinks.instagram && <span title="Instagram" className="opacity-50 hover:opacity-100 transition cursor-help">📸</span>}
                          </div>
                       </div>
                    )}
                  </div>
                </div>

                <div className="xl:w-56 flex flex-col gap-3 justify-center relative z-10 border-t xl:border-t-0 xl:border-l border-white/5 pt-8 xl:pt-0 xl:pl-8">
                  <button
                    onClick={() => updateStatus(sub.id, 'approved')}
                    className="w-full py-4 rounded-2xl bg-green-600 hover:bg-green-500 font-black text-sm transition-all shadow-lg shadow-green-900/20 disabled:opacity-30 disabled:cursor-not-allowed"
                    disabled={sub.status === 'approved'}
                  >
                    APPROVE
                  </button>
                  <button
                    onClick={() => updateStatus(sub.id, 'rejected')}
                    className="w-full py-4 rounded-2xl bg-red-600/10 border border-red-600/30 hover:bg-red-600/20 text-red-500 font-black text-sm transition-all"
                  >
                    REJECT
                  </button>
                  <button
                    onClick={() => updateStatus(sub.id, 'hold')}
                    className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-400 font-black text-sm transition-all border border-white/5"
                  >
                    PUT ON HOLD
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
