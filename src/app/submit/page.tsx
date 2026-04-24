'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function SubmitPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    eventId: '',
    reviewLink: '',
    instagram: '',
    linkedin: '',
  });
  const [dynamicData, setDynamicData] = useState<any>({});
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [certPreviewUrl, setCertPreviewUrl] = useState<string | null>(null);
  const [showCertPreview, setShowCertPreview] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    fetch('/api/events')
      .then(res => res.json())
      .then(data => setEvents(data))
      .catch(err => console.error('Failed to load events', err));
  }, []);

  const handleEventChange = (id: string) => {
    const event = events.find(e => e.id === id);
    setSelectedEvent(event);
    setFormData({ ...formData, eventId: id });
    setDynamicData({});
  };

  const generateCertPreview = async () => {
    setPreviewLoading(true);
    try {
      const res = await fetch('/api/submissions/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name, eventId: formData.eventId }),
      });
      const data = await res.json();
      setCertPreviewUrl(data.previewUrl);
      setShowCertPreview(true);
    } catch (err) {
      console.error(err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setStatus('submitting');

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64 = reader.result;

      try {
        const res = await fetch('/api/submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            reviewImageUrl: base64,
            socialLinks: { instagram: formData.instagram, linkedin: formData.linkedin },
            dynamicFields: dynamicData
          }),
        });

        if (res.ok) {
          setStatus('success');
          setTimeout(() => router.push('/'), 5000);
        } else {
          setStatus('error');
        }
      } catch (error) {
        console.error(error);
        setStatus('error');
      } finally {
        setLoading(false);
      }
    };
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-[#0a0516] flex items-center justify-center p-6 text-white text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md p-12 rounded-[40px] glass-dark border border-purple-500/20 backdrop-blur-2xl"
        >
          <div className="text-7xl mb-8 animate-bounce">🎉</div>
          <h1 className="text-4xl font-black mb-6">Submission Received!</h1>
          <p className="text-gray-400 text-lg mb-10 leading-relaxed">
            Our AI is now verifying your review. Approved certificates are dispatched instantly.
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 font-black text-lg shadow-lg shadow-purple-600/20 hover:scale-[1.02] transition-all"
          >
            Return Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0516] py-24 px-6 text-white font-sans relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-2xl mx-auto relative z-10">
        <header className="mb-16 text-center">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-black mb-4 tracking-tight"
          >
            Claim Your <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Certificate</span>
          </motion.h1>
          <div className="flex items-center justify-center gap-4">
            <div className={`w-10 h-1 transition-all duration-500 rounded-full ${step === 1 ? 'bg-purple-500' : 'bg-white/10'}`} />
            <div className={`w-10 h-1 transition-all duration-500 rounded-full ${step === 2 ? 'bg-purple-500' : 'bg-white/10'}`} />
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8 glass p-10 md:p-14 rounded-[40px] border border-white/5 shadow-2xl relative overflow-hidden">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      className="input-field"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. john@example.com"
                      className="input-field"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Select Event</label>
                  <select
                    required
                    className="input-field appearance-none cursor-pointer"
                    value={formData.eventId}
                    onChange={e => handleEventChange(e.target.value)}
                  >
                    <option value="" className="bg-[#1a0b3c]">Choose an event...</option>
                    {events.map(event => (
                      <option key={event.id} value={event.id} className="bg-[#1a0b3c]">{event.name}</option>
                    ))}
                  </select>
                </div>

                {selectedEvent?.formTemplate?.fields && (selectedEvent.formTemplate.fields as any[]).map((field, idx) => (
                  <div key={idx} className="space-y-2">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">{field.label}</label>
                    {field.type === 'select' ? (
                      <select
                        required={field.required}
                        className="input-field appearance-none"
                        onChange={e => setDynamicData({...dynamicData, [field.label]: e.target.value})}
                      >
                        <option value="" className="bg-[#1a0b3c]">Select...</option>
                        {field.options?.map((opt: string) => <option key={opt} value={opt} className="bg-[#1a0b3c]">{opt}</option>)}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        required={field.required}
                        className="input-field"
                        onChange={e => setDynamicData({...dynamicData, [field.label]: e.target.value})}
                      />
                    )}
                  </div>
                ))}

                <div className="pt-6 border-t border-white/5 flex flex-col gap-4">
                  <button
                    type="button"
                    onClick={generateCertPreview}
                    disabled={!formData.name || !formData.eventId || previewLoading}
                    className="w-full py-4 rounded-2xl bg-white/5 border border-white/5 font-bold text-sm hover:bg-white/10 transition-all disabled:opacity-30 flex items-center justify-center gap-3"
                  >
                    {previewLoading ? (
                      <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    ) : '👁️'}
                    Preview Layout
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={!formData.name || !formData.email || !formData.eventId}
                    className="w-full py-5 rounded-2xl bg-purple-600 hover:bg-purple-500 font-black text-lg transition-all shadow-xl shadow-purple-600/10 disabled:opacity-30 disabled:grayscale"
                  >
                    Next Step
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Review URL</label>
                  <input
                    type="url"
                    required
                    placeholder="https://google.com/maps/..."
                    className="input-field"
                    value={formData.reviewLink}
                    onChange={e => setFormData({...formData, reviewLink: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Evidence</label>
                  <div className="border-2 border-dashed border-purple-500/20 rounded-[32px] p-2 text-center hover:border-purple-500/40 transition-all bg-white/[0.02] min-h-[250px] flex items-center justify-center relative group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => setFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="screenshot-upload"
                    />
                    {!previewUrl ? (
                      <label htmlFor="screenshot-upload" className="cursor-pointer w-full py-12 px-6">
                        <div className="space-y-4">
                          <div className="text-5xl group-hover:scale-110 transition-transform">📸</div>
                          <p className="text-gray-400 font-bold">Drop review screenshot here</p>
                          <p className="text-[10px] text-gray-600 uppercase tracking-widest font-black">PNG, JPG up to 5MB</p>
                        </div>
                      </label>
                    ) : (
                      <div className="relative w-full h-full p-2">
                        <img src={previewUrl} alt="Preview" className="max-h-[300px] mx-auto rounded-2xl shadow-2xl transition group-hover:brightness-50" />
                        <label htmlFor="screenshot-upload" className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
                          <span className="bg-white text-black px-6 py-3 rounded-2xl font-black text-sm shadow-xl">Replace Image</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Instagram</label>
                    <input
                      type="text"
                      placeholder="@handle"
                      className="input-field"
                      value={formData.instagram}
                      onChange={e => setFormData({...formData, instagram: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">LinkedIn</label>
                    <input
                      type="text"
                      placeholder="linkedin.com/in/..."
                      className="input-field"
                      value={formData.linkedin}
                      onChange={e => setFormData({...formData, linkedin: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-6 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-5 rounded-2xl bg-white/5 border border-white/5 font-black hover:bg-white/10 transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !file}
                    className="flex-[2] py-5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 font-black text-lg transition-all shadow-xl shadow-purple-600/20 disabled:opacity-30"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-3">
                         <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                         <span>Analyzing...</span>
                      </div>
                    ) : 'Final Submission'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        {showCertPreview && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-6 z-[100]">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-5xl flex flex-col h-[85vh] glass-dark rounded-[40px] border border-white/10 overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                <h3 className="text-2xl font-black">Layout Preview</h3>
                <button
                  onClick={() => setShowCertPreview(false)}
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-red-500/20 hover:text-red-500 transition-all flex items-center justify-center text-xl"
                >
                  &times;
                </button>
              </div>
              <div className="flex-grow p-1">
                <iframe src={certPreviewUrl!} className="w-full h-full border-none rounded-b-[40px]" title="Certificate Preview"></iframe>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
