'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

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
      <div className="min-h-screen bg-[#0a0516] flex items-center justify-center text-white font-sans">
        <div className="flex flex-col items-center gap-10">
          <div className="relative">
             <div className="w-20 h-20 border-4 border-purple-500/20 rounded-full" />
             <div className="absolute top-0 left-0 w-20 h-20 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-gray-500 font-black text-[10px] uppercase tracking-[0.4em] animate-pulse">Running Cryptographic Integrity Check...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0516] flex items-center justify-center text-white p-6 md:p-12 relative overflow-hidden font-sans">
      {/* Dynamic Aura */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-purple-600/[0.03] blur-[150px] rounded-full animate-pulse-glow pointer-events-none" />

      <AnimatePresence mode="wait">
        {!data || data.error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="max-w-xl w-full glass-dark border border-red-500/10 p-16 md:p-20 rounded-[64px] text-center shadow-3xl relative"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500/30 to-transparent" />
            <div className="text-8xl mb-10 grayscale opacity-50">🚫</div>
            <h1 className="text-4xl font-black mb-6 tracking-tight">Record Mismatch</h1>
            <p className="text-gray-500 font-medium mb-12 leading-relaxed text-lg">The identifier provided does not exist within our secure cryptographic ledger system.</p>
            <Link href="/verify" className="inline-block px-12 py-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all font-black text-xs uppercase tracking-widest shadow-xl">
              Initiate New Search
            </Link>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl w-full glass p-12 md:p-24 rounded-[80px] border border-white/5 text-center relative z-10 shadow-[0_80px_150px_-40px_rgba(0,0,0,0.8)] overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-purple-600/[0.03] blur-3xl rounded-full" />

            {/* Authenticity Badge */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className={`inline-flex items-center gap-4 px-8 py-3.5 rounded-full border text-[10px] font-black uppercase tracking-[0.3em] mb-16 shadow-2xl relative ${
                data.isAuthentic
                ? 'bg-green-500/5 border-green-500/20 text-green-400 shadow-green-500/10'
                : 'bg-red-500/5 border-red-500/20 text-red-400 shadow-red-500/10'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${data.isAuthentic ? 'bg-green-500 animate-pulse' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`}></span>
              {data.isAuthentic ? 'Ledger Authenticity Confirmed' : 'Cryptographic Integrity Compromised'}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <h1 className="text-5xl md:text-8xl font-black mb-6 tracking-tighter text-white leading-none">{data.submission?.name}</h1>
              <p className="text-gray-500 text-xl md:text-2xl font-bold mb-16 tracking-tight">Has successfully participated in</p>

              <div className="bg-purple-600/[0.03] border border-purple-500/10 rounded-[48px] p-12 md:p-16 mb-16 relative group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <h2 className="text-4xl md:text-6xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent uppercase tracking-tight relative z-10 leading-tight">
                  {data.submission?.event?.name}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 text-left border-t border-white/5 pt-16">
                <div className="space-y-3">
                  <p className="text-[10px] text-gray-600 uppercase font-black tracking-[0.3em]">Issuance Timestamp</p>
                  <p className="font-black text-2xl text-white tracking-tight">{new Date(data.issuedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] text-gray-600 uppercase font-black tracking-[0.3em]">Secure Ledger ID</p>
                  <p className="font-mono text-xs text-purple-400/80 break-all bg-black/40 px-5 py-4 rounded-[20px] border border-white/5 shadow-inner leading-relaxed">
                    {data.certificateId}
                  </p>
                </div>
              </div>

              <div className="mt-24 flex flex-col items-center gap-10">
                 <Link href="/" className="group flex flex-col items-center gap-6 no-underline">
                   <span className="text-gray-600 group-hover:text-purple-400 transition-all text-[10px] font-black uppercase tracking-[0.4em]">Return to Mainframe</span>
                   <div className="w-1 h-12 bg-gradient-to-b from-purple-500/40 via-purple-500/10 to-transparent rounded-full group-hover:h-16 transition-all duration-500" />
                 </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
