'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function VerifySearchPage() {
  const [certId, setCertId] = useState('');
  const router = useRouter();

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (certId.trim()) {
      router.push(`/verify/${certId.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0516] text-white flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/10 blur-[120px] rounded-full animate-pulse-glow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-900/10 blur-[120px] rounded-full animate-pulse-glow" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full relative z-10"
      >
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="inline-block w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-4xl mb-8 shadow-2xl"
          >
            🛡️
          </motion.div>
          <h1 className="text-5xl font-black mb-4 tracking-tight">Trust <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Verification</span></h1>
          <p className="text-gray-500 font-bold text-sm tracking-widest uppercase">Validate cryptographic authenticity</p>
        </div>

        <form onSubmit={handleVerify} className="glass p-10 md:p-14 rounded-[40px] border border-white/5 shadow-2xl space-y-8">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Certificate ID</label>
            <input
              type="text"
              required
              placeholder="e.g. CERT-1713987456-AX92"
              className="input-field text-center font-mono text-lg tracking-wider"
              value={certId}
              onChange={e => setCertId(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full py-5 rounded-2xl bg-purple-600 hover:bg-purple-500 font-black text-xs transition-all shadow-xl shadow-purple-600/20 uppercase tracking-[0.2em] group"
          >
            <span className="group-hover:scale-110 inline-block transition-transform">Initialize Protocol</span>
          </button>
        </form>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center text-gray-600 text-xs font-bold uppercase tracking-tighter"
        >
          Secured by CertiVerify AI Cryptographic Infrastructure
        </motion.p>
      </motion.div>
    </div>
  );
}
