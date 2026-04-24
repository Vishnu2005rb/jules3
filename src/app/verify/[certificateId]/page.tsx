'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';

export default function PublicVerifyPage({ params }: { params: Promise<{ certificateId: string }> }) {
  const { certificateId } = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/verify/${certificateId}`)
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [certificateId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0720] flex items-center justify-center text-white font-sans">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-purple-500 rounded-full mb-4"></div>
          <p className="text-white">Verifying Certificate...</p>
        </div>
      </div>
    );
  }

  if (!data || data.error) {
    return (
      <div className="min-h-screen bg-[#0f0720] flex items-center justify-center text-white p-6 font-sans">
        <div className="max-w-md w-full bg-red-500/10 border border-red-500/20 p-10 rounded-3xl text-center">
          <div className="text-5xl mb-6">❌</div>
          <h1 className="text-2xl font-bold mb-2 text-white">Invalid Certificate</h1>
          <p className="text-gray-400 mb-8">The certificate ID provided does not exist or has been revoked.</p>
          <Link href="/verify" className="inline-block px-8 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition font-bold text-white">
            Try Another ID
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0720] flex items-center justify-center text-white p-6 relative overflow-hidden font-sans">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 blur-[120px] rounded-full"></div>

      <div className="max-w-2xl w-full bg-white/5 border border-purple-500/20 backdrop-blur-2xl p-10 md:p-16 rounded-[40px] text-center relative z-10">
        {data.isAuthentic ? (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-bold mb-10">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            VERIFIED AUTHENTIC
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold mb-10">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            INTEGRITY BREACH DETECTED
          </div>
        )}

        <h1 className="text-3xl md:text-5xl font-bold mb-2 text-white">{data.submission?.name || 'Participant'}</h1>
        <p className="text-gray-400 text-lg mb-10">Has successfully participated in</p>

        <div className="bg-purple-500/10 border border-purple-500/20 rounded-3xl p-8 mb-10">
          <h2 className="text-2xl md:text-3xl font-black text-purple-400 uppercase tracking-tight">{data.submission?.event?.name || 'Hackathon Event'}</h2>
        </div>

        <div className="grid grid-cols-2 gap-8 text-left border-t border-white/5 pt-10">
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Issue Date</p>
            <p className="font-medium text-white">{new Date(data.issuedAt).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Certificate ID</p>
            <p className="font-mono text-sm text-purple-300">{data.certificateId}</p>
          </div>
        </div>

        <div className="mt-12">
           <Link href="/" className="text-gray-500 hover:text-white transition text-sm">
             ← Back to CertiVerify AI
           </Link>
        </div>
      </div>
    </div>
  );
}
