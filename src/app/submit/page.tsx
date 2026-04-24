'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SubmitPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert('Please upload a screenshot');

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
      <div className="min-h-screen bg-[#0f0720] flex items-center justify-center p-6 text-white text-center">
        <div className="max-w-md p-10 rounded-3xl bg-white/5 border border-purple-500/20 backdrop-blur-xl">
          <div className="text-6xl mb-6">🎉</div>
          <h1 className="text-3xl font-bold mb-4">Submission Received!</h1>
          <p className="text-gray-400 mb-8">
            Our AI is now verifying your review. If your score is high enough, your certificate will be emailed to you instantly.
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 font-bold"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0720] py-20 px-6 text-white">
      <div className="max-w-2xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4">Claim Your Certificate</h1>
          <p className="text-gray-400">Step {step} of 2</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 bg-white/5 p-8 md:p-12 rounded-3xl border border-purple-500/10">
          {step === 1 ? (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-white/5 border border-purple-500/20 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
                  <input
                    type="email"
                    required
                    className="w-full bg-white/5 border border-purple-500/20 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Select Event</label>
                <select
                  required
                  className="w-full bg-white/5 border border-purple-500/20 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
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
                <div key={idx}>
                  <label className="block text-sm font-medium text-gray-400 mb-2">{field.label}</label>
                  {field.type === 'select' ? (
                    <select
                      required={field.required}
                      className="w-full bg-white/5 border border-purple-500/20 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
                      onChange={e => setDynamicData({...dynamicData, [field.label]: e.target.value})}
                    >
                      <option value="" className="bg-[#1a0b3c]">Select...</option>
                      {field.options?.map((opt: string) => <option key={opt} value={opt} className="bg-[#1a0b3c]">{opt}</option>)}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      required={field.required}
                      className="w-full bg-white/5 border border-purple-500/20 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
                      onChange={e => setDynamicData({...dynamicData, [field.label]: e.target.value})}
                    />
                  )}
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Phone Number</label>
                <input
                  type="tel"
                  className="w-full bg-white/5 border border-purple-500/20 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!formData.name || !formData.email || !formData.eventId}
                className="w-full py-4 rounded-xl bg-purple-600 hover:bg-purple-700 transition font-bold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Review Link (Google/Social)</label>
                <input
                  type="url"
                  required
                  placeholder="https://g.page/review/..."
                  className="w-full bg-white/5 border border-purple-500/20 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
                  value={formData.reviewLink}
                  onChange={e => setFormData({...formData, reviewLink: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Review Screenshot</label>
                <div className="border-2 border-dashed border-purple-500/20 rounded-2xl p-4 text-center hover:border-purple-500/40 transition bg-white/5 min-h-[200px] flex items-center justify-center relative overflow-hidden">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => setFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="screenshot-upload"
                  />
                  {!previewUrl ? (
                    <label htmlFor="screenshot-upload" className="cursor-pointer w-full py-8">
                      <div className="space-y-2">
                        <div className="text-3xl">📸</div>
                        <p className="text-gray-400">Click to upload your review screenshot</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest">Supports PNG, JPG</p>
                      </div>
                    </label>
                  ) : (
                    <div className="relative group w-full">
                      <img src={previewUrl} alt="Preview" className="max-h-[300px] mx-auto rounded-lg shadow-2xl transition group-hover:opacity-50" />
                      <label htmlFor="screenshot-upload" className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
                        <span className="bg-purple-600 px-4 py-2 rounded-full text-sm font-bold shadow-xl">Change Image</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Instagram (Optional)</label>
                  <input
                    type="text"
                    className="w-full bg-white/5 border border-purple-500/20 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
                    value={formData.instagram}
                    onChange={e => setFormData({...formData, instagram: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">LinkedIn (Optional)</label>
                  <input
                    type="text"
                    className="w-full bg-white/5 border border-purple-500/20 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
                    value={formData.linkedin}
                    onChange={e => setFormData({...formData, linkedin: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-4 rounded-xl border border-purple-500/20 hover:bg-white/5 transition font-bold"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || !file}
                  className="flex-[2] py-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 font-bold disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Submit Verification'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
