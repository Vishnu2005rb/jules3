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

  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [clipboard, setClipboard] = useState<any>(null);

  // Editor State for Certificate Template
  const [certConfig, setCertConfig] = useState<any>({
    name: 'Standard Certificate',
    width: 800,
    height: 560,
    elements: [
      { id: '1', type: 'text', label: 'Title', content: 'CERTIFICATE OF PARTICIPATION', x: 400, y: 80, fontSize: 32, color: '#4f46e5', align: 'center', fontFamily: 'sans-serif' },
      { id: '2', type: 'text', label: 'Name Placeholder', content: 'PARTICIPANT NAME', x: 400, y: 240, fontSize: 42, color: '#000000', align: 'center', fontFamily: 'serif' },
      { id: '3', type: 'text', label: 'Event Name', content: 'EVENT NAME', x: 400, y: 340, fontSize: 24, color: '#7c3aed', align: 'center', fontFamily: 'sans-serif' },
      { id: '4', type: 'qr', label: 'Verification QR', x: 650, y: 400, size: 90 },
      { id: '5', type: 'text', label: 'Date', content: 'Issued on: 2024-05-20', x: 100, y: 450, fontSize: 14, color: '#666666', align: 'left', fontFamily: 'sans-serif' },
      { id: '6', type: 'text', label: 'Cert ID', content: 'ID: CERT-12345-67890', x: 100, y: 480, fontSize: 12, color: '#999999', align: 'left', fontFamily: 'monospace' }
    ],
    border: { width: 12, color: '#4f46e5', radius: 20, style: 'solid' }
  });

  // Editor State for Form Template
  const [formConfig, setFormConfig] = useState<any>({
    name: 'Standard Registration',
    fields: [
      { label: 'College/Company', type: 'text', required: true },
      { label: 'Role', type: 'select', required: true, options: ['Participant', 'Mentor', 'Volunteer'] }
    ],
    headerConfig: {
      companyLogo: '',
      collegeLogo: '',
      collegeName: 'Global Institute of Technology',
      companyName: 'CertiVerify AI',
      eventName: 'Spring Hackathon 2024',
      layout: 'centered'
    }
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
        ? { id: editingId, type: 'certificate', name: certConfig.name, config: certConfig }
        : { id: editingId, type: 'form', name: formConfig.name, fields: formConfig.fields, headerConfig: formConfig.headerConfig };

      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch('/api/admin/templates', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setEditingId(null);
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFormConfig({
        ...formConfig,
        headerConfig: { ...formConfig.headerConfig, [key]: reader.result }
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-[#0a0516] text-white p-6 md:p-12 font-sans relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-600/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-16">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <Link href="/admin/dashboard" className="text-purple-400 text-[10px] font-black tracking-[0.3em] uppercase hover:text-purple-300 transition-colors mb-4 inline-block">← SYSTEM PORTAL</Link>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight">Layout <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Studio</span></h1>
            <p className="text-gray-500 font-medium text-lg mt-2">Architecting automated submission protocols and authenticators</p>
          </motion.div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setEditingId(null); setIsModalOpen(true); }}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 px-10 py-5 rounded-[24px] font-black text-xs uppercase tracking-widest shadow-[0_10px_40px_-10px_rgba(124,58,237,0.5)] transition-all"
          >
            Create New {activeTab === 'form' ? 'Protocol' : 'Authenticator'}
          </motion.button>
        </header>

        <div className="flex gap-2 bg-black/40 p-2 rounded-[24px] border border-white/5 w-fit mb-16 shadow-2xl">
          <button onClick={() => setActiveTab('form')} className={`px-8 py-3.5 rounded-[18px] text-[10px] font-black tracking-[0.2em] transition-all uppercase ${activeTab === 'form' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>Submission Forms</button>
          <button onClick={() => setActiveTab('certificate')} className={`px-8 py-3.5 rounded-[18px] text-[10px] font-black tracking-[0.2em] transition-all uppercase ${activeTab === 'certificate' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>Cert Blueprints</button>
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
                  className="glass-dark border border-white/5 p-12 rounded-[48px] group hover:border-purple-500/40 transition-all duration-500 relative overflow-hidden flex flex-col h-full shadow-2xl"
                >
                  <div className="relative z-10 flex-grow">
                    <h3 className="text-3xl font-black mb-3 group-hover:text-purple-300 transition-colors tracking-tight leading-none">{template.name}</h3>
                    <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest mb-10">UID: {template.id.substring(0, 14)}</p>
                  </div>
                  <div className="flex gap-4 relative z-10 pt-10 border-t border-white/5">
                    <button
                      onClick={() => {
                        setEditingId(template.id);
                        if (activeTab === 'form') {
                          setFormConfig({ name: template.name, fields: template.fields, headerConfig: template.headerConfig || formConfig.headerConfig });
                        } else {
                          setCertConfig({ name: template.name, ...template.config });
                        }
                        setIsModalOpen(true);
                      }}
                      className="flex-1 py-4 rounded-[20px] bg-white/5 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5"
                    >Configure</button>
                    <button onClick={() => handleDelete(template.id, activeTab)} className="px-6 py-4 rounded-[20px] bg-red-500/5 text-red-500 hover:bg-red-500/10 transition-all border border-red-500/10">🗑️</button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 md:p-12 backdrop-blur-3xl bg-black/90">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="bg-[#0c061a] border border-white/10 w-full max-w-7xl max-h-[95vh] overflow-hidden rounded-[60px] flex flex-col shadow-2xl">
              <div className="p-12 border-b border-white/5 flex justify-between items-center">
                <h2 className="text-4xl font-black tracking-tight">{activeTab === 'certificate' ? 'Blueprint Architect' : 'Protocol Designer'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="w-14 h-14 rounded-full bg-white/5 hover:bg-red-500/20 hover:text-red-500 transition-all flex items-center justify-center text-3xl font-light">&times;</button>
              </div>

              <div className="flex-1 overflow-hidden grid grid-cols-1 xl:grid-cols-12 gap-0">
                {activeTab === 'certificate' ? (
                  <>
                    <div className="xl:col-span-3 border-r border-white/5 bg-black/20 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                      <div className="space-y-3">
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] ml-1">Blueprint Name</label>
                        <input type="text" value={certConfig.name} onChange={(e) => setCertConfig({...certConfig, name: e.target.value})} className="input-field py-3 text-xs" />
                      </div>
                      <div className="pt-6 border-t border-white/5">
                         <h4 className="text-[10px] font-black text-white uppercase tracking-widest mb-6 flex justify-between items-center">
                           Elements
                           <button onClick={() => {
                             const newEl = { id: Math.random().toString(36).substr(2, 9), type: 'text', label: 'New Text', content: 'NEW ELEMENT', x: 100, y: 100, fontSize: 20, color: '#000000', align: 'left', fontFamily: 'sans-serif' };
                             setCertConfig({...certConfig, elements: [...certConfig.elements, newEl]});
                             setSelectedElementId(newEl.id);
                           }} className="text-purple-400 hover:text-purple-300 transition-colors">+ ADD</button>
                         </h4>
                         <div className="space-y-2">
                           {certConfig.elements.map((el: any) => (
                             <div key={el.id} onClick={() => setSelectedElementId(el.id)} className={`p-3 rounded-xl border text-[10px] font-bold cursor-pointer transition-all flex justify-between items-center ${selectedElementId === el.id ? 'bg-purple-600/20 border-purple-500 text-white' : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10'}`}>
                               <span className="truncate pr-2">{el.label}</span>
                               <div className="flex gap-2">
                                 <button onClick={(e) => { e.stopPropagation(); setClipboard({...el, id: Math.random().toString(36).substr(2, 9), label: el.label + ' (Copy)', x: el.x + 20, y: el.y + 20}); }} className="opacity-50 hover:opacity-100">📋</button>
                                 <button onClick={(e) => { e.stopPropagation(); setCertConfig({...certConfig, elements: certConfig.elements.filter((x: any) => x.id !== el.id)}); if (selectedElementId === el.id) setSelectedElementId(null); }} className="opacity-50 hover:opacity-100 text-red-500">🗑️</button>
                               </div>
                             </div>
                           ))}
                           {clipboard && <button onClick={() => { setCertConfig({...certConfig, elements: [...certConfig.elements, clipboard]}); setSelectedElementId(clipboard.id); setClipboard(null); }} className="w-full py-2 border border-dashed border-purple-500/30 rounded-xl text-[9px] font-black text-purple-400 hover:bg-purple-500/5">PASTE ELEMENT</button>}
                         </div>
                      </div>
                      {selectedElementId && (
                        <div className="pt-6 border-t border-white/5 space-y-6">
                          <h4 className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Configuration</h4>
                          <div className="space-y-2">
                             <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest ml-1">Label</label>
                             <input type="text" value={certConfig.elements.find((e: any) => e.id === selectedElementId)?.label} onChange={(e) => {
                               const newElements = certConfig.elements.map((el: any) => el.id === selectedElementId ? {...el, label: e.target.value} : el);
                               setCertConfig({...certConfig, elements: newElements});
                             }} className="input-field py-2 text-xs" />
                          </div>
                          {certConfig.elements.find((e: any) => e.id === selectedElementId)?.type === 'text' && (
                            <>
                              <div className="space-y-2">
                                <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest ml-1">Content</label>
                                <input type="text" value={certConfig.elements.find((e: any) => e.id === selectedElementId)?.content} onChange={(e) => {
                                  const newElements = certConfig.elements.map((el: any) => el.id === selectedElementId ? {...el, content: e.target.value} : el);
                                  setCertConfig({...certConfig, elements: newElements});
                                }} className="input-field py-2 text-xs" />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest ml-1">Font Size</label>
                                  <input type="number" value={certConfig.elements.find((e: any) => e.id === selectedElementId)?.fontSize} onChange={(e) => {
                                    const newElements = certConfig.elements.map((el: any) => el.id === selectedElementId ? {...el, fontSize: parseInt(e.target.value)} : el);
                                    setCertConfig({...certConfig, elements: newElements});
                                  }} className="input-field py-2 text-xs" />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest ml-1">Color</label>
                                  <input type="color" value={certConfig.elements.find((e: any) => e.id === selectedElementId)?.color} onChange={(e) => {
                                    const newElements = certConfig.elements.map((el: any) => el.id === selectedElementId ? {...el, color: e.target.value} : el);
                                    setCertConfig({...certConfig, elements: newElements});
                                  }} className="w-full h-10 bg-transparent border-none p-0 cursor-pointer rounded-lg" />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest ml-1">Font Family</label>
                                <select value={certConfig.elements.find((e: any) => e.id === selectedElementId)?.fontFamily} onChange={(e) => {
                                  const newElements = certConfig.elements.map((el: any) => el.id === selectedElementId ? {...el, fontFamily: e.target.value} : el);
                                  setCertConfig({...certConfig, elements: newElements});
                                }} className="input-field py-2 text-xs">
                                  <option value="sans-serif">Sans Serif</option>
                                  <option value="serif">Serif</option>
                                  <option value="monospace">Monospace</option>
                                </select>
                              </div>
                            </>
                          )}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest ml-1">X Pos</label>
                              <input type="number" value={certConfig.elements.find((e: any) => e.id === selectedElementId)?.x} onChange={(e) => {
                                const newElements = certConfig.elements.map((el: any) => el.id === selectedElementId ? {...el, x: parseInt(e.target.value)} : el);
                                setCertConfig({...certConfig, elements: newElements});
                              }} className="input-field py-2 text-xs" />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest ml-1">Y Pos</label>
                              <input type="number" value={certConfig.elements.find((e: any) => e.id === selectedElementId)?.y} onChange={(e) => {
                                const newElements = certConfig.elements.map((el: any) => el.id === selectedElementId ? {...el, y: parseInt(e.target.value)} : el);
                                setCertConfig({...certConfig, elements: newElements});
                              }} className="input-field py-2 text-xs" />
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="pt-6 border-t border-white/5 space-y-4">
                        <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Global Border</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest ml-1">Width</label>
                            <input type="number" value={certConfig.border.width} onChange={(e) => setCertConfig({...certConfig, border: {...certConfig.border, width: parseInt(e.target.value)}})} className="input-field py-2 text-xs" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest ml-1">Radius</label>
                            <input type="number" value={certConfig.border.radius} onChange={(e) => setCertConfig({...certConfig, border: {...certConfig.border, radius: parseInt(e.target.value)}})} className="input-field py-2 text-xs" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest ml-1">Color</label>
                          <input type="color" value={certConfig.border.color} onChange={(e) => setCertConfig({...certConfig, border: {...certConfig.border, color: e.target.value}})} className="w-full h-10 bg-transparent border-none p-0 cursor-pointer rounded-lg" />
                        </div>
                      </div>
                    </div>
                    <div className="xl:col-span-9 bg-black/40 p-12 flex items-center justify-center overflow-auto custom-scrollbar">
                      <div className="bg-white shadow-2xl relative flex-shrink-0" style={{ width: certConfig.width, height: certConfig.height, borderRadius: certConfig.border.radius, border: `${certConfig.border.width}px ${certConfig.border.style} ${certConfig.border.color}` }}>
                        {certConfig.elements.map((el: any) => (
                          <motion.div
                            key={el.id}
                            drag
                            dragMomentum={false}
                            onDragEnd={(_, info) => {
                              const newX = Math.round(el.x + info.offset.x);
                              const newY = Math.round(el.y + info.offset.y);
                              const newElements = certConfig.elements.map((x: any) => x.id === el.id ? { ...x, x: newX, y: newY } : x);
                              setCertConfig({ ...certConfig, elements: newElements });
                            }}
                            onClick={() => setSelectedElementId(el.id)}
                            style={{ position: 'absolute', left: el.x, top: el.y, transform: el.align === 'center' ? 'translateX(-50%)' : el.align === 'right' ? 'translateX(-100%)' : 'none', zIndex: selectedElementId === el.id ? 20 : 10 }}
                            className={`p-1 border-2 ${selectedElementId === el.id ? 'border-purple-500' : 'border-transparent hover:border-purple-500/30 cursor-move'}`}
                          >
                             {el.type === 'text' ? <div style={{ fontSize: el.fontSize, color: el.color, fontFamily: el.fontFamily, whiteSpace: 'nowrap' }} className="font-bold">{el.content}</div> : <div style={{ width: el.size, height: el.size }} className="bg-black flex items-center justify-center text-white text-[10px] font-black">QR CODE</div>}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="xl:col-span-12 overflow-y-auto p-12 space-y-12 custom-scrollbar">
                    <div className="max-w-4xl mx-auto space-y-12">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                          <div className="space-y-8">
                             <h3 className="text-xl font-black text-purple-400 uppercase tracking-widest">Protocol Metadata</h3>
                             <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] ml-1">Protocol Identification</label>
                                <input type="text" value={formConfig.name} onChange={(e) => setFormConfig({...formConfig, name: e.target.value})} className="input-field py-4" placeholder="e.g. Master Contributor Protocol" />
                             </div>
                             <h3 className="text-xl font-black text-purple-400 uppercase tracking-widest pt-8">Header Configuration</h3>
                             <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-4">
                                   <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Company Logo</label>
                                   <div className="h-32 rounded-2xl border border-white/10 bg-white/5 flex flex-col items-center justify-center relative overflow-hidden group">
                                      {formConfig.headerConfig.companyLogo ? <img src={formConfig.headerConfig.companyLogo} className="h-full object-contain" /> : <span className="text-xs font-bold text-gray-600">No Logo</span>}
                                      <input type="file" onChange={(e) => handleFileUpload(e, 'companyLogo')} className="absolute inset-0 opacity-0 cursor-pointer" />
                                   </div>
                                </div>
                                <div className="space-y-4">
                                   <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">College Logo</label>
                                   <div className="h-32 rounded-2xl border border-white/10 bg-white/5 flex flex-col items-center justify-center relative overflow-hidden group">
                                      {formConfig.headerConfig.collegeLogo ? <img src={formConfig.headerConfig.collegeLogo} className="h-full object-contain" /> : <span className="text-xs font-bold text-gray-600">No Logo</span>}
                                      <input type="file" onChange={(e) => handleFileUpload(e, 'collegeLogo')} className="absolute inset-0 opacity-0 cursor-pointer" />
                                   </div>
                                </div>
                             </div>
                             <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">College Name</label>
                                <input type="text" value={formConfig.headerConfig.collegeName} onChange={(e) => setFormConfig({...formConfig, headerConfig: {...formConfig.headerConfig, collegeName: e.target.value}})} className="input-field" />
                             </div>
                             <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Company Name</label>
                                <input type="text" value={formConfig.headerConfig.companyName} onChange={(e) => setFormConfig({...formConfig, headerConfig: {...formConfig.headerConfig, companyName: e.target.value}})} className="input-field" />
                             </div>
                          </div>
                          <div className="space-y-8">
                             <h3 className="text-xl font-black text-purple-400 uppercase tracking-widest">Field Definitions</h3>
                             <button onClick={addField} className="w-full py-4 border border-dashed border-purple-500/30 rounded-2xl text-[10px] font-black text-purple-400 hover:bg-purple-500/5 transition-all">ADD NEW PARAMETER +</button>
                             <div className="space-y-4">
                                {formConfig.fields.map((field: any, i: number) => (
                                  <div key={i} className="glass-dark p-6 rounded-[32px] border border-white/5 space-y-4 relative group">
                                     <button onClick={() => removeField(i)} className="absolute top-4 right-4 text-red-500 opacity-0 group-hover:opacity-100 transition-all">🗑️</button>
                                     <input type="text" value={field.label} onChange={(e) => updateField(i, 'label', e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm font-bold" placeholder="Field Label" />
                                     <div className="grid grid-cols-2 gap-4">
                                        <select value={field.type} onChange={(e) => updateField(i, 'type', e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold">
                                           <option value="text">Text</option>
                                           <option value="number">Number</option>
                                           <option value="email">Email</option>
                                           <option value="select">Dropdown</option>
                                        </select>
                                        <label className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase cursor-pointer">
                                           <input type="checkbox" checked={field.required} onChange={(e) => updateField(i, 'required', e.target.checked)} className="w-4 h-4 rounded bg-white/5 border-white/10" /> Required
                                        </label>
                                     </div>
                                  </div>
                                ))}
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-12 border-t border-white/5 bg-white/[0.02] flex justify-end gap-6">
                <button onClick={() => setIsModalOpen(false)} className="px-10 py-5 rounded-2xl font-black text-xs text-gray-600 hover:text-white transition-all uppercase tracking-[0.2em]">Abort Designer</button>
                <button onClick={handleSave} className="bg-gradient-to-r from-purple-600 to-indigo-600 px-14 py-5 rounded-[24px] font-black text-xs hover:shadow-[0_0_40px_rgba(124,58,237,0.4)] transition-all uppercase tracking-[0.2em] shadow-xl">Commit to Registry</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
