'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function TemplateManager() {
  const [forms, setForms] = useState<any[]>([]);
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'form' | 'certificate'>('form');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Editor State for Certificate Template
  const [certConfig, setCertConfig] = useState({
    name: 'Standard Certificate',
    title: 'CERTIFICATE OF PARTICIPATION',
    titleFontSize: 26,
    titleY: 310,
    nameFontSize: 34,
    nameY: 215,
    primaryColor: '#4f46e5',
    accentColor: '#7c3aed',
    borderWidth: 4,
    qrX: 460,
    qrY: 60,
    qrSize: 85
  });

  // Editor State for Form Template
  const [formConfig, setFormConfig] = useState<any>({
    name: 'Standard Registration',
    fields: [
      { label: 'College/Company', type: 'text', required: true },
      { label: 'Role', type: 'select', required: true, options: ['Participant', 'Mentor', 'Volunteer'] }
    ]
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/templates');
      const data = await res.json();
      setForms(data.forms || []);
      setCerts(data.certs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const body = activeTab === 'certificate'
        ? { type: 'certificate', name: certConfig.name, config: certConfig }
        : { type: 'form', name: formConfig.name, fields: formConfig.fields };

      const res = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchTemplates();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const addField = () => {
    setFormConfig({
      ...formConfig,
      fields: [...formConfig.fields, { label: 'New Parameter', type: 'text', required: false }]
    });
  };

  const removeField = (index: number) => {
    const newFields = [...formConfig.fields];
    newFields.splice(index, 1);
    setFormConfig({ ...formConfig, fields: newFields });
  };

  const updateField = (index: number, key: string, value: any) => {
    const newFields = [...formConfig.fields];
    newFields[index] = { ...newFields[index], [key]: value };
    setFormConfig({ ...formConfig, fields: newFields });
  };

  const handleDelete = async (id: string, type: 'form' | 'certificate') => {
    if (!confirm('Permanently delete this template?')) return;
    try {
      await fetch(`/api/admin/templates?id=${id}&type=${type}`, { method: 'DELETE' });
      fetchTemplates();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0516] text-white p-6 md:p-12 font-sans relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-600/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Link href="/admin/dashboard" className="text-purple-400 text-[10px] font-black tracking-[0.3em] uppercase hover:text-purple-300 transition-colors mb-4 inline-block">← SYSTEM PORTAL</Link>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight">Layout <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Studio</span></h1>
            <p className="text-gray-500 font-medium text-lg mt-2">Architecting automated submission protocols and authenticators</p>
          </motion.div>
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 px-10 py-5 rounded-[24px] font-black text-xs uppercase tracking-widest shadow-[0_10px_40px_-10px_rgba(124,58,237,0.5)] hover:shadow-[0_15px_50px_-10px_rgba(124,58,237,0.6)] transition-all"
          >
            Create New {activeTab === 'form' ? 'Protocol' : 'Authenticator'}
          </motion.button>
        </header>

        <div className="flex gap-2 bg-black/40 p-2 rounded-[24px] border border-white/5 w-fit mb-16 shadow-2xl">
          <button
            onClick={() => setActiveTab('form')}
            className={`px-8 py-3.5 rounded-[18px] text-[10px] font-black tracking-[0.2em] transition-all uppercase ${activeTab === 'form' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Submission Forms
          </button>
          <button
            onClick={() => setActiveTab('certificate')}
            className={`px-8 py-3.5 rounded-[18px] text-[10px] font-black tracking-[0.2em] transition-all uppercase ${activeTab === 'certificate' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Cert Blueprints
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-48 gap-6">
             <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
             <p className="text-gray-600 font-black text-[10px] uppercase tracking-[0.3em] animate-pulse">Initializing Studio...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            <AnimatePresence>
              {(activeTab === 'form' ? forms : certs).map((template: any, idx) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: idx * 0.1 }}
                  className="glass-dark border border-white/5 p-12 rounded-[48px] group hover:border-purple-500/40 transition-all duration-500 relative overflow-hidden flex flex-col h-full shadow-2xl"
                >
                  <div className="absolute top-0 right-0 w-40 h-40 bg-purple-600/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-purple-600/10 transition-all" />

                  <div className="relative z-10 flex-grow">
                    <div className="flex justify-between items-start mb-8">
                       <div className="px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[9px] font-black uppercase tracking-widest">
                         Active Layer
                       </div>
                    </div>
                    <h3 className="text-3xl font-black mb-3 group-hover:text-purple-300 transition-colors tracking-tight leading-none">{template.name}</h3>
                    <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest mb-10">UID: {template.id.substring(0, 14)}</p>

                    {activeTab === 'form' && (
                      <div className="space-y-3 mb-8">
                        {template.fields?.slice(0, 3).map((f: any, i: number) => (
                          <div key={i} className="text-[11px] text-gray-500 font-bold flex items-center gap-3">
                             <div className="w-1.5 h-1.5 bg-purple-500/40 rounded-full" />
                             {f.label} <span className="opacity-30 font-black">[{f.type}]</span>
                          </div>
                        ))}
                        {template.fields?.length > 3 && <div className="text-[10px] text-purple-500/60 font-black uppercase tracking-tighter mt-4 ml-4">+ {template.fields.length - 3} Extended Parameters</div>}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4 relative z-10 pt-10 border-t border-white/5">
                    <button className="flex-1 py-4 rounded-[20px] bg-white/5 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5">Configure</button>
                    <button
                      onClick={() => handleDelete(template.id, activeTab)}
                      className="px-6 py-4 rounded-[20px] bg-red-500/5 text-red-500 hover:bg-red-500/10 transition-all border border-red-500/10"
                    >
                      🗑️
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {(activeTab === 'form' ? forms : certs).length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full py-48 text-center glass rounded-[60px] border-2 border-dashed border-white/5 text-gray-600"
              >
                <div className="text-8xl mb-10 opacity-10 grayscale">🎨</div>
                <p className="text-2xl font-black text-gray-500">The studio is currently empty.</p>
                <p className="text-sm font-bold mt-3 opacity-50">Initialize your first layout protocol to begin scaling.</p>
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Advanced Unified Builder Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 md:p-12 backdrop-blur-3xl bg-black/90">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="bg-[#0c061a] border border-white/10 w-full max-w-7xl max-h-[95vh] overflow-hidden rounded-[60px] flex flex-col shadow-[0_0_150px_rgba(0,0,0,0.8)]"
            >
              <div className="p-12 border-b border-white/5 flex justify-between items-center bg-white/[0.01] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
                <div className="relative z-10">
                  <h2 className="text-4xl font-black tracking-tight">{activeTab === 'certificate' ? 'Blueprint Architect' : 'Protocol Designer'}</h2>
                  <p className="text-gray-500 font-black text-[10px] tracking-[0.3em] uppercase mt-2">Unified Template Engineering System</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-14 h-14 rounded-full bg-white/5 hover:bg-red-500/20 hover:text-red-500 transition-all flex items-center justify-center text-3xl font-light shadow-2xl"
                >
                  &times;
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-12 grid grid-cols-1 xl:grid-cols-12 gap-16 custom-scrollbar">
                {activeTab === 'certificate' ? (
                  <>
                    <div className="xl:col-span-4 space-y-10">
                      <div className="space-y-8">
                        <div className="space-y-3">
                          <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] ml-1">Blueprint Designation</label>
                          <input
                            type="text"
                            value={certConfig.name}
                            onChange={(e) => setCertConfig({...certConfig, name: e.target.value})}
                            className="input-field py-4"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] ml-1">Primary Header</label>
                          <input
                            type="text"
                            value={certConfig.title}
                            onChange={(e) => setCertConfig({...certConfig, title: e.target.value})}
                            className="input-field py-4"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] ml-1">Scale (Px)</label>
                            <input
                              type="number"
                              value={certConfig.titleFontSize}
                              onChange={(e) => setCertConfig({...certConfig, titleFontSize: parseInt(e.target.value)})}
                              className="input-field"
                            />
                          </div>
                          <div className="space-y-3">
                            <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] ml-1">Y-Coordinate</label>
                            <input
                              type="number"
                              value={certConfig.titleY}
                              onChange={(e) => setCertConfig({...certConfig, titleY: parseInt(e.target.value)})}
                              className="input-field"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-3">
                            <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] ml-1">Brand Hex</label>
                            <div className="flex items-center gap-4 glass p-3 rounded-2xl border border-white/10">
                              <input
                                type="color"
                                value={certConfig.primaryColor}
                                onChange={(e) => setCertConfig({...certConfig, primaryColor: e.target.value})}
                                className="w-12 h-12 bg-transparent border-none p-0 cursor-pointer rounded-xl overflow-hidden"
                              />
                              <span className="text-[11px] font-mono font-black text-gray-500 uppercase">{certConfig.primaryColor}</span>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] ml-1">Accent Hex</label>
                            <div className="flex items-center gap-4 glass p-3 rounded-2xl border border-white/10">
                              <input
                                type="color"
                                value={certConfig.accentColor}
                                onChange={(e) => setCertConfig({...certConfig, accentColor: e.target.value})}
                                className="w-12 h-12 bg-transparent border-none p-0 cursor-pointer rounded-xl overflow-hidden"
                              />
                              <span className="text-[11px] font-mono font-black text-gray-500 uppercase">{certConfig.accentColor}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="xl:col-span-8 flex flex-col gap-12">
                      <div className="aspect-[3/2] bg-[#fdfdff] rounded-[48px] relative overflow-hidden border-[24px] border-white shadow-[0_60px_120px_-20px_rgba(0,0,0,0.6)] group/preview">
                          <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
                            style={{ backgroundImage: 'radial-gradient(#000 1.5px, transparent 1.5px)', backgroundSize: '30px 30px' }}
                          />
                          <div style={{ borderColor: certConfig.primaryColor, borderWidth: certConfig.borderWidth }} className="absolute inset-6 border-solid opacity-90 transition-all duration-700"></div>
                          <div style={{ borderColor: certConfig.accentColor }} className="absolute inset-10 border border-solid opacity-10"></div>
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-20 text-center">
                            <motion.h3
                              key={certConfig.title}
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              style={{ color: certConfig.primaryColor, fontSize: certConfig.titleFontSize / 2, transform: `translateY(${(300 - certConfig.titleY) / 2.2}px)` }}
                              className="font-black uppercase tracking-tight absolute top-[25%] transition-all"
                            >
                              {certConfig.title}
                            </motion.h3>
                            <div className="mt-12">
                                <p className="text-[8px] text-gray-400 font-black uppercase tracking-[0.3em] mb-3">Cryptographically Verified to</p>
                                <h4 style={{ color: certConfig.accentColor, fontSize: certConfig.nameFontSize / 2 }} className="font-black tracking-tight">CANDIDATE IDENTITY</h4>
                                <div className="w-12 h-1 bg-gray-100 mx-auto my-6 rounded-full" />
                                <p className="text-[8px] text-gray-400 font-bold max-w-[280px] mx-auto leading-relaxed">Recognized for exceptional contribution and validated participation within the global verified hackathon infrastructure.</p>
                            </div>
                          </div>
                          <div style={{ width: certConfig.qrSize / 2, height: certConfig.qrSize / 2, right: (600 - certConfig.qrX - certConfig.qrSize) / 2.2, bottom: certConfig.qrY / 2.2 }} className="absolute bg-white p-2.5 flex flex-col items-center justify-center border border-gray-100 shadow-2xl">
                            <div className="w-full h-full bg-black flex items-center justify-center text-[5px] font-black text-white">QR</div>
                            <div className="mt-1.5 text-[4px] text-gray-300 font-black tracking-widest">SECURE</div>
                          </div>
                      </div>
                      <div className="glass p-10 rounded-[32px] border border-white/5 flex items-center gap-8">
                         <div className="w-16 h-16 rounded-[24px] bg-purple-500/10 flex items-center justify-center text-3xl shadow-inner">⚡</div>
                         <div className="space-y-1">
                            <p className="text-sm font-black text-white uppercase tracking-widest">Architect's Note</p>
                            <p className="text-[11px] text-gray-500 leading-relaxed font-medium">This real-time environment simulates the final PDF vector coordinate system. Styles and alignments will be exported as dynamic rendering rules for the production issuance engine.</p>
                         </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="xl:col-span-12 space-y-12">
                    <div className="max-w-3xl mx-auto space-y-12">
                       <div className="space-y-4">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] ml-1">Protocol Identification</label>
                          <input
                            type="text"
                            value={formConfig.name}
                            onChange={(e) => setFormConfig({...formConfig, name: e.target.value})}
                            className="input-field py-5 text-lg font-bold"
                            placeholder="e.g. Master Contributor Protocol"
                          />
                       </div>

                       <div className="space-y-8">
                          <div className="flex justify-between items-center px-2">
                             <h4 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Parameter Definitions</h4>
                             <button onClick={addField} className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 px-6 py-2.5 rounded-xl border border-purple-500/20 text-[10px] font-black uppercase tracking-widest transition-all">Add Parameter +</button>
                          </div>

                          <div className="grid gap-6">
                             {formConfig.fields.map((field: any, i: number) => (
                               <motion.div
                                 key={i}
                                 initial={{ opacity: 0, x: -20 }}
                                 animate={{ opacity: 1, x: 0 }}
                                 className="glass-dark p-8 rounded-[32px] border border-white/5 flex flex-wrap md:flex-nowrap items-end gap-8 relative group hover:border-purple-500/20 transition-all shadow-xl"
                               >
                                  <div className="flex-grow space-y-3">
                                     <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Field Label</label>
                                     <input
                                       type="text"
                                       value={field.label}
                                       onChange={(e) => updateField(i, 'label', e.target.value)}
                                       className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:border-purple-500/50 font-bold"
                                     />
                                  </div>
                                  <div className="w-full md:w-56 space-y-3">
                                     <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Storage Protocol</label>
                                     <select
                                       value={field.type}
                                       onChange={(e) => updateField(i, 'type', e.target.value)}
                                       className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-sm focus:outline-none cursor-pointer font-bold"
                                     >
                                        <option value="text" className="bg-[#1a0b3c]">String (Text)</option>
                                        <option value="number" className="bg-[#1a0b3c]">Integer (Num)</option>
                                        <option value="email" className="bg-[#1a0b3c]">Verified Email</option>
                                        <option value="select" className="bg-[#1a0b3c]">Enumeration (Dropdown)</option>
                                     </select>
                                  </div>
                                  <div className="flex items-center gap-3 pb-3.5 px-2">
                                     <div className="relative flex items-center">
                                       <input
                                         type="checkbox"
                                         id={`req-${i}`}
                                         checked={field.required}
                                         onChange={(e) => updateField(i, 'required', e.target.checked)}
                                         className="w-5 h-5 rounded-lg bg-white/5 border-white/10 text-purple-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                                       />
                                     </div>
                                     <label htmlFor={`req-${i}`} className="text-[10px] font-black text-gray-500 uppercase cursor-pointer tracking-widest">Required</label>
                                  </div>
                                  <button
                                    onClick={() => removeField(i)}
                                    className="p-3.5 rounded-2xl bg-red-500/5 text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                                  >
                                    🗑️
                                  </button>
                               </motion.div>
                             ))}
                          </div>
                       </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-12 border-t border-white/5 bg-white/[0.02] flex justify-end gap-6 relative overflow-hidden">
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
                <button onClick={() => setIsModalOpen(false)} className="px-10 py-5 rounded-2xl font-black text-xs text-gray-600 hover:text-white transition-all uppercase tracking-[0.2em]">Abort Designer</button>
                <button
                  onClick={handleSave}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 px-14 py-5 rounded-[24px] font-black text-xs hover:shadow-[0_0_40px_rgba(124,58,237,0.4)] transition-all uppercase tracking-[0.2em] shadow-xl"
                >
                  Commit to Registry
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
