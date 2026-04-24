'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        // Use window.location for a hard refresh to ensure middleware picks up the cookie
        window.location.href = '/admin/dashboard';
      } else {
        const data = await res.json();
        setError(data.error || 'Access Denied');
      }
    } catch (err) {
      setError('System authentication error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0516] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Decorative Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full relative z-10"
      >
        <div className="text-center mb-12">
           <div className="inline-block w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-xl shadow-purple-600/20 mb-6 flex items-center justify-center text-3xl">
             🔐
           </div>
           <h1 className="text-4xl font-black mb-2 tracking-tight">Admin <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Portal</span></h1>
           <p className="text-gray-500 font-bold text-sm tracking-widest uppercase">Secure Verification Infrastructure</p>
        </div>

        <form onSubmit={handleLogin} className="glass p-10 md:p-12 rounded-[40px] border border-white/5 shadow-2xl space-y-8">
          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl text-xs font-black text-center uppercase tracking-widest"
            >
              ⚠️ {error}
            </motion.div>
          )}

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Terminal ID</label>
              <input
                type="text"
                required
                placeholder="Username"
                className="input-field"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Access Protocol</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                className="input-field"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 rounded-2xl bg-purple-600 hover:bg-purple-500 font-black text-xs transition-all shadow-xl shadow-purple-600/20 uppercase tracking-[0.2em] disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Initialize Session'}
          </button>
        </form>

        <div className="mt-12 text-center">
           <Link href="/" className="text-gray-600 hover:text-purple-400 transition-colors text-xs font-black uppercase tracking-widest">
             ← Return to Mainframe
           </Link>
        </div>
      </motion.div>
    </div>
  );
}
