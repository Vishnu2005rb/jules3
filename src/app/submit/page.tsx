'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const GOOGLE_REVIEW_URL = 'https://g.page/r/CQsh3QkT7OjlEBM/review';

export default function SubmitPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [isFetchingInitial, setIsFetchingInitial] = useState(true);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error' | 'duplicate'>('idle');
  
  // Fixed fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    eventId: '',
  });
  
  // Dynamic fields from admin template
  const [dynamicData, setDynamicData] = useState<any>({});
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  
  // Review screenshot (required)
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Certificate preview
  const [certPreviewBase64, setCertPreviewBase64] = useState<string | null>(null);
  const [certPreviewMeta, setCertPreviewMeta] = useState<{ templateName: string; eventName: string } | null>(null);
  const [showCertPreview, setShowCertPreview] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [eventCodeError, setEventCodeError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Validate that email ends with @gmail.com
  const validateEmail = (email: string): string | null => {
    if (!email) return null;
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.endsWith('@gmail.com')) {
      return 'Please use a Gmail address (must end with @gmail.com)';
    }
    return null;
  };

  // Social links (optional)
  const [socialLinks, setSocialLinks] = useState({
    instagram: '',
    linkedin: '',
  });

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
    const searchParams = new URLSearchParams(window.location.search);
    const eventCode = searchParams.get('code');
    const eventIdFromUrl = searchParams.get('eventId');

    if (eventCode) {
      // Fetch event by code
      fetch(`/api/events/${eventCode}?byCode=true`)
        .then(res => res.json())
        .then(data => {
          if (data.id) {
            setSelectedEvent(data);
            setFormData(prev => ({ ...prev, eventId: data.id }));
          } else {
            setEventCodeError('Invalid event code. Please go back and check with your organizer.');
          }
        })
        .catch(err => {
          console.error('Failed to load event', err);
          setEventCodeError('Event not found. Please check your code and try again.');
        })
        .finally(() => setIsFetchingInitial(false));
    } else if (eventIdFromUrl) {
      fetch(`/api/events/${eventIdFromUrl}`)
        .then(res => res.json())
        .then(data => {
          if (data.id) {
            setSelectedEvent(data);
            setFormData(prev => ({ ...prev, eventId: data.id }));
          }
        })
        .catch(err => console.error('Failed to load event', err))
        .finally(() => setIsFetchingInitial(false));
    } else {
      fetch('/api/events')
        .then(res => res.json())
        .then(data => setEvents(data))
        .catch(err => console.error('Failed to load events', err))
        .finally(() => setIsFetchingInitial(false));
    }
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
        body: JSON.stringify({ eventId: formData.eventId }),
      });
      const data = await res.json();
      if (data.previewImage) {
        setCertPreviewBase64(data.previewImage);
        setCertPreviewMeta({ templateName: data.templateName, eventName: data.eventName });
        setShowCertPreview(true);
      } else {
        alert(data.error || 'Could not load certificate preview');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setErrorMessage(null);
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
            reviewLink: GOOGLE_REVIEW_URL,
            socialLinks,
            dynamicFields: dynamicData
          }),
        });

        const data = await res.json();

        if (res.ok) {
          setStatus('success');
          setTimeout(() => router.push('/'), 8000);
        } else if (res.status === 400 && (data.code === 'DUPLICATE' || data.error?.toLowerCase().includes('already submitted') || data.error?.toLowerCase().includes('already been submitted') || data.error?.toLowerCase().includes('duplicate'))) {
          setStatus('duplicate');
        } else {
          setStatus('error');
          setErrorMessage(data.error || 'Submission failed. Please try again.');
        }
      } catch (error) {
        console.error(error);
        setStatus('error');
        setErrorMessage('Network error. Please check your connection and try again.');
      } finally {
        setLoading(false);
      }
    };
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 font-sans"
        style={{ background: 'var(--bg-page)', color: 'var(--text-primary)' }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 180, damping: 22 }}
          className="max-w-md w-full text-center"
        >
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: 'var(--success-bg)', border: '1px solid var(--success-border)' }}>
            <svg className="w-8 h-8" style={{ color: 'var(--success)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Review Submitted!
          </h1>
          <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
            Your review is being verified by our AI system.
          </p>

          <div className="card p-5 mb-6 text-left space-y-4">
            {[
              { icon: '🔍', title: 'AI Verification Running', desc: 'Our OCR engine is analyzing your review screenshot to verify authenticity.' },
              { icon: '📄', title: 'Certificate Generation', desc: 'If approved, your personalized certificate will be generated automatically.' },
              { icon: '📧', title: 'Email Delivery', desc: 'Your certificate will be sent to your email address once verified.' },
            ].map(item => (
              <div key={item.title} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm"
                  style={{ background: 'var(--brand-light)', border: '1px solid var(--brand-border)' }}>
                  {item.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>{item.title}</p>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <button onClick={() => router.push('/')}
            className="w-full py-3 rounded-lg text-sm font-semibold text-white transition-all"
            style={{ background: 'var(--brand)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--brand-dark)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--brand)')}>
            Back to Home
          </button>
          <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
            Redirecting automatically in a few seconds...
          </p>
        </motion.div>
      </div>
    );
  }

  // Duplicate submission screen
  if (status === 'duplicate') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 font-sans"
        style={{ background: 'var(--bg-page)', color: 'var(--text-primary)' }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 180, damping: 22 }}
          className="max-w-md w-full text-center"
        >
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: 'var(--warning-bg)', border: '1px solid var(--warning-border)' }}>
            <svg className="w-8 h-8" style={{ color: 'var(--warning)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Already Submitted
          </h1>
          <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
            We found an existing submission from you for this event.
          </p>

          <div className="card p-5 mb-6 text-left space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg"
              style={{ background: 'var(--warning-bg)', border: '1px solid var(--warning-border)' }}>
              <svg className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--warning)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--warning-text)' }}>
                {errorMessage || 'You have already submitted a review for this event. Each review can only be submitted once.'}
              </p>
            </div>

            {[
              { icon: '📧', title: 'Check Your Email', desc: 'If your submission was approved, your certificate has already been sent. Check your inbox and spam folder.' },
              { icon: '🔍', title: 'Verify Your Certificate', desc: 'Use the certificate ID from your email to verify it on our verification page.' },
            ].map(item => (
              <div key={item.title} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm"
                  style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-default)' }}>
                  {item.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--text-primary)' }}>{item.title}</p>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <button onClick={() => router.push('/verify')}
              className="w-full py-3 rounded-lg text-sm font-semibold text-white transition-all"
              style={{ background: 'var(--brand)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--brand-dark)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--brand)')}>
              Verify My Certificate
            </button>
            <button onClick={() => router.push('/')}
              className="w-full py-3 rounded-lg text-sm font-semibold transition-all"
              style={{ background: 'var(--bg-surface-2)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-surface-3)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-surface-2)')}>
              Back to Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const headerConfig = selectedEvent?.formTemplate?.headerConfig;
  const footerConfig = headerConfig?.footerConfig;
  const customFields = selectedEvent?.formTemplate?.fields || [];

  // Invalid event code — show friendly error instead of empty form
  if (eventCodeError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="max-w-md w-full text-center"
        >
          <div className="relative inline-block mb-8">
            <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full scale-150" />
            <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-2xl shadow-red-500/30 mx-auto">
              <motion.span
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="text-5xl"
              >
                🚫
              </motion.span>
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h1 className="text-3xl font-black mb-3 tracking-tight">Invalid Event Code</h1>
            <p className="text-red-400 font-black text-sm mb-6 uppercase tracking-widest">Code not recognized</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-dark border border-red-500/20 rounded-3xl p-6 mb-8 text-left space-y-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-sm">⚠️</span>
              </div>
              <div>
                <p className="text-sm font-black text-white mb-1">What went wrong?</p>
                <p className="text-xs text-gray-400 leading-relaxed">{eventCodeError}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-sm">💡</span>
              </div>
              <div>
                <p className="text-sm font-black text-white mb-1">What to do</p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Check your registration email or ask your event organizer for the correct code. Codes are case-insensitive.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="space-y-3">
            <button
              onClick={() => window.location.href = '/'}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 font-black text-lg shadow-lg shadow-purple-600/20 hover:scale-[1.02] transition-all"
            >
              Try Again
            </button>
            <p className="text-xs text-gray-600">You'll be taken back to enter a new code</p>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  if (isFetchingInitial) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="flex flex-col items-center gap-6 text-center"
        >
          {/* Animated spinner ring */}
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full border-4 border-purple-500/20" />
            <div className="absolute inset-0 rounded-full border-4 border-t-purple-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
            <div className="absolute inset-3 rounded-full bg-purple-500/10 flex items-center justify-center">
              <span className="text-2xl">🔐</span>
            </div>
          </div>
          <div>
            <p className="text-lg font-black text-white mb-1">Loading Event</p>
            <p className="text-sm text-gray-400">Verifying your event code...</p>
          </div>
          {/* Animated dots */}
          <div className="flex gap-2">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-purple-500"
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-6 sm:py-12 px-3 sm:px-6 text-white font-sans relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* FIXED HEADER */}
        <header className="mb-6 sm:mb-12">
          <div className="glass rounded-[24px] sm:rounded-[40px] border border-white/10 overflow-hidden">
            {/* Header Content - Draggable Elements */}
            <div 
              className="p-10 relative mx-auto" 
              style={{ 
                width: headerConfig?.headerWidth || 800,
                height: headerConfig?.headerHeight || 200, 
                background: headerConfig?.headerBackgroundImage
                  ? `url('${headerConfig.headerBackgroundImage}') center / ${headerConfig.headerBackgroundFit ?? 'cover'} no-repeat`
                  : headerConfig?.headerBackground || 'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(59, 130, 246, 0.1))'
              }}
            >
              {/* Render header elements with absolute positioning */}
              {headerConfig?.headerElements && Array.isArray(headerConfig.headerElements) && headerConfig.headerElements.map((el: any) => (
                <div
                  key={el.id}
                  style={{
                    position: 'absolute',
                    left: el.x,
                    top: el.y,
                    transform: el.align === 'center' ? 'translateX(-50%)' : el.align === 'right' ? 'translateX(-100%)' : 'none',
                  }}
                >
                  {el.type === 'logo' && el.imageUrl ? (
                    <img 
                      src={el.imageUrl} 
                      alt={el.label} 
                      style={{ width: el.width, height: el.height }} 
                      className="object-contain" 
                    />
                  ) : el.type === 'text' ? (
                    <div 
                      style={{ 
                        fontSize: el.fontSize, 
                        color: el.color, 
                        fontWeight: el.fontWeight,
                        textAlign: el.align,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {el.content}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            {/* Progress Indicator */}
            <div className="px-5 sm:px-10 py-4 sm:py-6 bg-black/20 border-t border-white/5">
              <div className="flex items-center justify-center gap-4">
                <div className={`flex-1 h-1.5 sm:h-2 transition-all duration-500 rounded-full ${step >= 1 ? 'bg-purple-500' : 'bg-white/10'}`} />
                <div className={`flex-1 h-1.5 sm:h-2 transition-all duration-500 rounded-full ${step >= 2 ? 'bg-purple-500' : 'bg-white/10'}`} />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-xs font-black text-gray-500 uppercase">Details</span>
                <span className="text-xs font-black text-gray-500 uppercase">Review</span>
              </div>
            </div>
          </div>
        </header>

        {/* BODY - FORM */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-8">
          <div className="glass p-5 sm:p-10 md:p-14 rounded-[24px] sm:rounded-[40px] border border-white/5 shadow-2xl">
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4 sm:space-y-8"
                >
                  <h2 className="text-xl sm:text-2xl font-black text-purple-400 uppercase tracking-wider">Participant Information</h2>
                  
                  {/* Event Selection (if not pre-selected) */}
                  {!selectedEvent && (
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Select Event *</label>
                      <select
                        required
                        className="input-field appearance-none cursor-pointer"
                        value={formData.eventId}
                        onChange={e => handleEventChange(e.target.value)}
                        suppressHydrationWarning
                      >
                        <option value="" className="bg-[#1a0b3c]">Choose an event...</option>
                        {events.map(event => (
                          <option key={event.id} value={event.id} className="bg-[#1a0b3c]">{event.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Fixed Required Fields */}
                  <div className="grid sm:grid-cols-2 gap-3 sm:gap-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. John Doe"
                        className="input-field"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        suppressHydrationWarning
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. yourname@gmail.com"
                        className={`input-field ${emailError ? 'border-red-400 focus:border-red-500' : ''}`}
                        value={formData.email}
                        onChange={e => {
                          setFormData({...formData, email: e.target.value});
                          setEmailError(validateEmail(e.target.value));
                        }}
                        onBlur={e => setEmailError(validateEmail(e.target.value))}
                        suppressHydrationWarning
                      />
                      {emailError && (
                        <p className="text-xs flex items-center gap-1.5 mt-1" style={{ color: 'var(--error-text)' }}>
                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                          </svg>
                          {emailError}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +1 234 567 8900"
                      className="input-field"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      suppressHydrationWarning
                    />
                  </div>

                  {/* Admin Customizable Fields */}
                  {Array.isArray(customFields) && customFields.length > 0 && (
                    <>
                      <div className="pt-4 sm:pt-6 border-t border-white/5">
                        <h3 className="text-base sm:text-lg font-black mb-4 sm:mb-6 text-gray-400 uppercase tracking-wider">Additional Information</h3>
                        <div className="space-y-4 sm:space-y-6">
                          {customFields.map((field: any, idx: number) => (
                            <div key={idx} className="space-y-1.5">
                              <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">
                                {field.label} {field.required && '*'}
                              </label>
                              {field.type === 'select' ? (
                                <select
                                  required={field.required}
                                  className="input-field appearance-none"
                                  value={dynamicData[field.label] || ''}
                                  onChange={e => setDynamicData({...dynamicData, [field.label]: e.target.value})}
                                  suppressHydrationWarning
                                >
                                  <option value="" className="bg-[#1a0b3c]">Select...</option>
                                  {field.options?.map((opt: string) => (
                                    <option key={opt} value={opt} className="bg-[#1a0b3c]">{opt}</option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type={field.type}
                                  required={field.required}
                                  className="input-field"
                                  value={dynamicData[field.label] || ''}
                                  onChange={e => setDynamicData({...dynamicData, [field.label]: e.target.value})}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Actions */}
                  <div className="pt-4 sm:pt-8 border-t border-white/5 space-y-3">
                    <button
                      type="button"
                      onClick={generateCertPreview}
                      disabled={!formData.eventId || previewLoading}
                      className="w-full py-3 sm:py-4 rounded-2xl bg-white/5 border border-white/10 font-bold text-sm hover:bg-white/10 hover:border-purple-500/30 transition-all disabled:opacity-30 flex items-center justify-center gap-3"
                    >
                      {previewLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                          <span>Loading Preview...</span>
                        </>
                      ) : (
                        <>
                          <span className="text-xl">👁️</span>
                          <span>Preview Certificate Template</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      disabled={!formData.name || !formData.email || !formData.phone || !formData.eventId || !!emailError || !formData.email.toLowerCase().endsWith('@gmail.com')}
                      className="w-full py-4 sm:py-5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 font-black text-base sm:text-lg transition-all shadow-xl shadow-purple-600/20 disabled:opacity-30 disabled:grayscale"
                    >
                      Continue to Review Submission →
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4 sm:space-y-8"
                >
                  <h2 className="text-xl sm:text-2xl font-black text-purple-400 uppercase tracking-wider">Review Verification</h2>

                  {/* Google Review URL Display (Fixed) */}
                  <div className="p-4 sm:p-6 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                    <label className="text-xs font-black text-blue-400 uppercase tracking-widest mb-3 block">Official Review Platform</label>
                    <a 
                      href={GOOGLE_REVIEW_URL} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full block text-center py-3 sm:py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-wider shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all"
                    >
                      Click Here to Submit Review
                    </a>
                    <p className="text-xs text-gray-500 mt-3 font-medium">Please submit your review on Google before uploading the screenshot</p>
                  </div>

                  {/* Screenshot Upload (Required Fixed Field) */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Review Screenshot *</label>
                    <div className="border-2 border-dashed border-purple-500/20 rounded-[32px] p-4 text-center hover:border-purple-500/40 transition-all bg-white/[0.02] min-h-[280px] flex items-center justify-center relative group">
                      <input
                        type="file"
                        accept="image/*"
                        required
                        onChange={e => setFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="screenshot-upload"
                      />
                      {!previewUrl ? (
                        <label htmlFor="screenshot-upload" className="cursor-pointer w-full py-16 px-6">
                          <div className="space-y-4">
                            <div className="text-6xl group-hover:scale-110 transition-transform">📸</div>
                            <p className="text-gray-300 font-bold text-lg">Upload Review Screenshot</p>
                            <p className="text-xs text-gray-600 uppercase tracking-widest font-black">PNG, JPG up to 5MB</p>
                            <p className="text-xs text-gray-500 mt-4">Click or drag and drop</p>
                          </div>
                        </label>
                      ) : (
                        <div className="relative w-full h-full p-2">
                          <img src={previewUrl} alt="Review Screenshot" className="max-h-[320px] mx-auto rounded-2xl shadow-2xl transition group-hover:brightness-75" />
                          <label htmlFor="screenshot-upload" className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
                            <span className="bg-white text-black px-8 py-4 rounded-2xl font-black text-sm shadow-2xl">Change Image</span>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>



                  {/* Actions */}
                  <div className="flex gap-3 sm:gap-4 pt-4 sm:pt-8 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 py-4 sm:py-5 rounded-2xl bg-white/5 border border-white/10 font-black hover:bg-white/10 transition-all"
                    >
                      ← Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !file}
                      className="flex-[2] py-4 sm:py-5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 font-black text-base sm:text-lg transition-all shadow-xl shadow-purple-600/20 disabled:opacity-30 hover:scale-[1.02]"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Submitting...</span>
                        </div>
                      ) : 'Submit for Verification'}
                    </button>
                  </div>

                  {/* Error message */}
                  {status === 'error' && errorMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl text-sm font-medium flex items-start gap-3"
                      style={{ background: 'var(--error-bg)', border: '1px solid var(--error-border)', color: 'var(--error-text)' }}
                    >
                      <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                      </svg>
                      <div>
                        <p className="font-semibold mb-0.5">Submission Failed</p>
                        <p className="text-xs">{errorMessage}</p>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </form>

        {/* FIXED FOOTER */}
        <footer
          className="mt-6 sm:mt-12 glass rounded-[24px] sm:rounded-[40px] border border-white/10 p-5 sm:p-8 text-center"
          style={{
            background: footerConfig?.backgroundImage
              ? `url('${footerConfig.backgroundImage}') center / ${footerConfig.backgroundFit ?? 'cover'} no-repeat`
              : footerConfig?.backgroundColor || 'rgba(15, 23, 42, 0.9)',
          }}
        >
          {footerConfig?.footerElements && footerConfig.footerElements.length > 0 ? (
            <div className="relative" style={{ minHeight: footerConfig.height }}>
              {footerConfig.footerElements.map((el: any) => (
                <div
                  key={el.id}
                  style={{
                    position: 'absolute',
                    left: el.x,
                    top: el.y,
                    width: el.width,
                    height: el.height,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {el.type === 'text' ? (
                    <div style={{ fontSize: el.fontSize, color: el.color, whiteSpace: 'nowrap' }}>
                      {el.content}
                    </div>
                  ) : el.type === 'linkedin' ? (
                    <a href="https://www.linkedin.com/company/tarcin-robotic-llp/?originalSubdomain=in" target="_blank" rel="noopener noreferrer" style={{ width: '100%', height: '100%', display: 'block' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="#0077b5"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                    </a>
                  ) : el.type === 'instagram' ? (
                    <a href="https://www.instagram.com/tarcin_robotic/" target="_blank" rel="noopener noreferrer" style={{ width: '100%', height: '100%', display: 'block' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="url(#ig-grad)"><defs><linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#f09433"/><stop offset="25%" stopColor="#e6683c"/><stop offset="50%" stopColor="#dc2743"/><stop offset="75%" stopColor="#cc2366"/><stop offset="100%" stopColor="#bc1888"/></linearGradient></defs><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069v-2.162zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                    </a>
                  ) : el.imageUrl ? (
                    <img src={el.imageUrl} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-left">
                  <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Need Help?</p>
                  <p className="text-sm text-gray-400">{headerConfig?.footerText || 'Contact: support@certverify.ai'}</p>
                </div>
                <div className="flex gap-4">
                  {(headerConfig?.footerSocials || ['facebook', 'twitter', 'instagram', 'linkedin']).map((social: string, idx: number) => (
                    <a 
                      key={idx} 
                      href="#" 
                      className="w-10 h-10 rounded-full bg-white/5 hover:bg-purple-500/20 flex items-center justify-center transition-all text-xl"
                    >
                      {social === 'facebook' ? '📘' : social === 'twitter' ? '🐦' : social === 'instagram' ? '📷' : '💼'}
                    </a>
                  ))}
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-white/5">
                <p className="text-xs text-gray-600 font-medium">© 2026 CertiVerify AI. Powered by AI-driven verification technology.</p>
              </div>
            </>
          )}
        </footer>
      </div>

      {/* Certificate Preview Modal (View Only - No Editing Tools) */}
      {showCertPreview && certPreviewBase64 && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-6 z-[100]">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-5xl flex flex-col h-[90vh] glass-dark rounded-[40px] border border-white/10 overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02] shrink-0">
              <div>
                <h3 className="text-xl font-black">Certificate Template Preview</h3>
                <p className="text-xs text-gray-500 mt-1">
                  {certPreviewMeta?.templateName} &bull; {certPreviewMeta?.eventName}
                </p>
              </div>
              <button
                onClick={() => setShowCertPreview(false)}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-red-500/20 hover:text-red-500 transition-all flex items-center justify-center text-xl font-light"
              >
                &times;
              </button>
            </div>

            {/* Certificate Image Viewer */}
            <div className="flex-1 bg-gray-900 flex items-center justify-center overflow-auto p-4">
              <img
                src={`data:image/png;base64,${certPreviewBase64}`}
                alt="Certificate Preview"
                className="max-w-full max-h-full rounded-xl shadow-2xl object-contain"
                style={{ maxHeight: 'calc(90vh - 160px)' }}
              />
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/5 bg-white/[0.02] text-center shrink-0">
              <p className="text-xs text-gray-500">
                Sample preview only &mdash; your personalized certificate is sent to your email after review verification
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
