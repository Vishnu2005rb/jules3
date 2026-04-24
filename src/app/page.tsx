'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function LandingPage() {
  const [recentUsers, setRecentUsers] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/social-proof')
      .then(res => res.json())
      .then(data => setRecentUsers(data))
      .catch(err => console.error('Failed to load social proof', err));
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-[#0a0516] text-white selection:bg-purple-500/30 font-sans relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full -translate-x-1/2 -translate-y-1/2 animate-pulse-glow" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full translate-x-1/2 translate-y-1/2 animate-pulse-glow" />
      <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-indigo-600/5 blur-[100px] rounded-full -translate-x-1/2 -translate-y-1/2" />

      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="container mx-auto px-6 py-8 flex justify-between items-center relative z-20"
      >
        <div className="text-2xl font-black tracking-tighter bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent glow-text-purple">
          CertiVerify AI
        </div>
        <div className="space-x-8 hidden md:flex items-center">
          <Link href="#features" className="text-sm font-medium hover:text-purple-400 transition-colors text-gray-400">Features</Link>
          <Link href="/verify" className="text-sm font-medium hover:text-purple-400 transition-colors text-gray-400">Verify</Link>
          <Link href="/admin/login" className="text-sm font-medium hover:text-purple-400 transition-colors text-gray-400">Admin</Link>
          <Link href="/submit" className="glass px-8 py-3 rounded-2xl font-bold text-sm border border-purple-500/20 hover:border-purple-500/40 hover:bg-purple-500/10 transition-all duration-300 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
            Get Certified
          </Link>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <main className="container mx-auto px-6 pt-24 pb-32 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold tracking-widest uppercase mb-8">
              AI-Powered Verification Engine
            </span>
            <h1 className="text-6xl md:text-8xl font-black mb-8 leading-[1.1] tracking-tight text-white">
              Automated Trust for <br />
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-500 bg-clip-text text-transparent">Hackathon Heroes</span>
            </h1>
            <p className="text-gray-400 text-xl md:text-2xl mb-12 max-w-2xl mx-auto leading-relaxed">
              Submit your reviews, let our AI verify your impact, and claim your official certificates in seconds.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
          >
            <Link href="/submit" className="group relative w-full sm:w-auto">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-300" />
              <div className="relative bg-white text-black px-12 py-5 rounded-2xl font-black text-lg hover:bg-gray-100 transition duration-300 text-center">
                Submit Review
              </div>
            </Link>
            <Link href="/verify" className="w-full sm:w-auto glass-dark px-12 py-5 rounded-2xl font-bold text-lg border border-white/5 hover:border-white/20 transition duration-300 text-center">
              Verify Certificate
            </Link>
          </motion.div>
        </div>
      </main>

      {/* Social Proof */}
      {recentUsers.length > 0 && (
        <section className="py-16 relative">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="flex flex-wrap justify-center gap-4"
            >
              {recentUsers.map((user, i) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="glass px-6 py-3 rounded-2xl flex items-center gap-3 border border-white/5 hover:border-purple-500/30 transition-all duration-300 group cursor-default"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-xs font-black shadow-lg">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-200 group-hover:text-white transition-colors">{user.name}</p>
                    <p className="text-[10px] text-purple-400 font-bold uppercase tracking-tighter">{user.event?.name}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* Features Grid */}
      <section id="features" className="py-32 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black mb-6">Built for the Future</h2>
            <p className="text-gray-500 text-lg">Scalable, secure, and entirely automated.</p>
          </div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8"
          >
            <FeatureCard
              title="AI-OCR Verification"
              description="Proprietary OCR engine extracts and validates participation data with 99% accuracy."
              icon="🤖"
              delay={0.1}
            />
            <FeatureCard
              title="Dynamic Generation"
              description="Instant high-quality PDF issuance with custom templates and dynamic fields."
              icon="📄"
              delay={0.2}
            />
            <FeatureCard
              title="Public Verification"
              description="Cryptographic hashing ensures every certificate is tamper-proof and verifiable."
              icon="✅"
              delay={0.3}
            />
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 glass-dark border-y border-white/5 relative">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            <StatItem label="Certificates Issued" value="1,240+" />
            <StatItem label="Global Events" value="64" />
            <StatItem label="Processing Speed" value="< 1.5s" />
            <StatItem label="Happy Users" value="98%" />
          </div>
        </div>
      </section>

      <footer className="py-20 text-center">
        <p className="text-gray-600 text-sm font-medium">
          © 2026 CertiVerify AI. Part of the Hackathon Global Infrastructure.
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({ title, description, icon, delay }: { title: string, description: string, icon: string, delay: number }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
      }}
      className="p-10 rounded-[32px] glass border border-white/5 hover:border-purple-500/30 transition-all duration-500 group relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 blur-3xl rounded-full -mr-10 -mt-10 group-hover:bg-purple-600/10 transition-all" />
      <div className="text-5xl mb-8 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500 inline-block">{icon}</div>
      <h3 className="text-2xl font-black mb-4 text-white group-hover:text-purple-300 transition-colors">{title}</h3>
      <p className="text-gray-500 leading-relaxed text-lg group-hover:text-gray-400 transition-colors">{description}</p>
    </motion.div>
  );
}

function StatItem({ label, value }: { label: string, value: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      <div className="text-4xl md:text-5xl font-black bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent mb-2">
        {value}
      </div>
      <div className="text-xs font-black text-purple-400 uppercase tracking-widest">{label}</div>
    </motion.div>
  );
}
