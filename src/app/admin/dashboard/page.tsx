'use client';

import { useState, useEffect } from 'react';

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
    <div className="min-h-screen bg-[#0f0720] text-white p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-400">Manage review submissions and approvals</p>
          </div>
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative">
              <input
                type="text"
                placeholder="Search name or email..."
                className="bg-white/5 border border-purple-500/20 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-purple-500 w-64"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
              {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'HOLD'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition uppercase ${filter === f ? 'bg-purple-600 shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Analytics Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white/5 border border-purple-500/10 p-6 rounded-3xl">
            <p className="text-gray-400 text-sm font-medium mb-1">Total Submissions</p>
            <p className="text-3xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-white/5 border border-purple-500/10 p-6 rounded-3xl">
            <p className="text-gray-400 text-sm font-medium mb-1">Approval Rate</p>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-bold text-green-400">{approvalRate}%</p>
              <p className="text-xs text-gray-500 mb-1">of total</p>
            </div>
          </div>
          <div className="bg-white/5 border border-purple-500/10 p-6 rounded-3xl">
            <p className="text-gray-400 text-sm font-medium mb-1">Rejected</p>
            <p className="text-3xl font-bold text-red-400">{stats.rejected}</p>
          </div>
          <div className="bg-white/5 border border-purple-500/10 p-6 rounded-3xl">
            <p className="text-gray-400 text-sm font-medium mb-1">Pending Review</p>
            <p className="text-3xl font-bold text-yellow-400">{stats.pending}</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading submissions...</div>
        ) : (
          <div className="grid gap-6">
            {filteredSubmissions.length === 0 && (
              <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-purple-500/20 text-gray-500">
                No submissions found for the selected filter.
              </div>
            )}
            {filteredSubmissions.map(sub => (
              <div key={sub.id} className="bg-white/5 border border-purple-500/10 rounded-3xl p-6 flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-64 h-64 bg-black rounded-2xl overflow-hidden flex-shrink-0 border border-purple-500/20">
                  {sub.reviewImageUrl ? (
                    <img src={sub.reviewImageUrl} alt="Review" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 text-sm p-4 text-center">
                      Image Cleaned After Delivery
                    </div>
                  )}
                </div>

                <div className="flex-grow space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-bold">{sub.name}</h2>
                      <p className="text-purple-400 text-sm font-medium">{sub.event?.name}</p>
                      <p className="text-gray-500 text-xs">{sub.email} • {sub.phone || 'No Phone'}</p>
                    </div>
                    <div className={`px-4 py-1 rounded-full text-xs font-bold uppercase ${
                      sub.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                      sub.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {sub.status}
                    </div>
                  </div>

                  <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">OCR Extracted Text</p>
                    <p className="text-sm text-gray-300 line-clamp-3 italic">{sub.extractedText || 'No text extracted'}</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-[10px] text-gray-500 uppercase font-bold">Score</p>
                      <p className="text-sm font-bold">{sub.verificationScore}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                      <p className="text-[10px] text-gray-500 uppercase font-bold">Date</p>
                      <p className="text-sm font-bold">{new Date(sub.createdAt).toLocaleDateString()}</p>
                    </div>
                    <a href={sub.reviewLink} target="_blank" className="block p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition">
                      <p className="text-[10px] text-gray-500 uppercase font-bold">Review Link</p>
                      <p className="text-xs text-blue-400 font-bold truncate">View Source ↗</p>
                    </a>
                  </div>
                </div>

                <div className="md:w-48 flex flex-col gap-3 justify-center">
                  <button
                    onClick={() => updateStatus(sub.id, 'approved')}
                    className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 font-bold text-sm transition disabled:opacity-50"
                    disabled={sub.status === 'approved'}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => updateStatus(sub.id, 'rejected')}
                    className="w-full py-3 rounded-xl bg-red-600/20 border border-red-600/50 hover:bg-red-600/40 text-red-400 font-bold text-sm transition"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => updateStatus(sub.id, 'hold')}
                    className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 font-bold text-sm transition"
                  >
                    Hold
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
