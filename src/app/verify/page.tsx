'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
    <div className="min-h-screen bg-[#0f0720] flex items-center justify-center p-6 text-white font-sans">
      <div className="w-full max-w-xl text-center">
        <h1 className="text-4xl font-bold mb-4 text-white">Verify a Certificate</h1>
        <p className="text-gray-400 mb-10">Enter the unique certificate ID to verify its authenticity.</p>

        <form onSubmit={handleVerify} className="relative group">
          <input
            type="text"
            placeholder="e.g. CERT-12345-ABCDE"
            className="w-full bg-white/5 border border-purple-500/20 rounded-2xl px-8 py-6 text-xl focus:outline-none focus:border-purple-500 transition shadow-2xl text-white"
            value={certId}
            onChange={e => setCertId(e.target.value)}
          />
          <button
            type="submit"
            className="absolute right-3 top-3 bottom-3 px-8 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 font-bold hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition text-white"
          >
            Verify
          </button>
        </form>

        <div className="mt-12 grid grid-cols-3 gap-6 opacity-50">
           <div className="text-xs uppercase tracking-widest font-bold text-gray-400">Secure</div>
           <div className="text-xs uppercase tracking-widest font-bold text-gray-400">Immutable</div>
           <div className="text-xs uppercase tracking-widest font-bold text-gray-400">Official</div>
        </div>
      </div>
    </div>
  );
}
