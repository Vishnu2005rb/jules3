'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function TemplateManager() {
  const [forms, setForms] = useState<any[]>([]);
  const [certs, setCerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'form' | 'certificate'>('form');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);

  // Editor State for Certificate Template
  const [certConfig, setCertConfig] = useState({
    name: 'New Certificate Template',
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

  const handleSaveCert = async () => {
    try {
      const res = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'certificate',
          name: certConfig.name,
          config: certConfig
        })
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchTemplates();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string, type: 'form' | 'certificate') => {
    if (!confirm('Are you sure?')) return;
    try {
      await fetch(`/api/admin/templates?id=${id}&type=${type}`, { method: 'DELETE' });
      fetchTemplates();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0720] text-white p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-10">
          <div>
            <Link href="/admin/dashboard" className="text-purple-400 text-sm hover:underline mb-2 inline-block">← Back to Dashboard</Link>
            <h1 className="text-4xl font-black bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">Template Manager</h1>
            <p className="text-gray-400">Design submission forms and certificate layouts</p>
          </div>
          <button
            onClick={() => {
              setEditingTemplate(null);
              setIsModalOpen(true);
            }}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-4 rounded-2xl font-bold hover:shadow-[0_0_20px_rgba(124,58,237,0.4)] transition-all"
          >
            Create New {activeTab === 'form' ? 'Form' : 'Certificate'}
          </button>
        </header>

        <div className="flex gap-4 mb-10 bg-white/5 p-1.5 rounded-2xl w-fit border border-white/5">
          <button
            onClick={() => setActiveTab('form')}
            className={`px-8 py-3 rounded-xl font-bold transition-all ${activeTab === 'form' ? 'bg-purple-600 shadow-lg shadow-purple-600/20' : 'text-gray-400 hover:text-white'}`}
          >
            Form Templates
          </button>
          <button
            onClick={() => setActiveTab('certificate')}
            className={`px-8 py-3 rounded-xl font-bold transition-all ${activeTab === 'certificate' ? 'bg-purple-600 shadow-lg shadow-purple-600/20' : 'text-gray-400 hover:text-white'}`}
          >
            Certificate Templates
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-40">
             <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(activeTab === 'form' ? forms : certs).map((template: any) => (
              <div key={template.id} className="bg-white/5 border border-purple-500/10 p-8 rounded-[32px] group hover:border-purple-500/40 transition-all relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 blur-3xl rounded-full -mr-10 -mt-10 group-hover:bg-purple-600/10 transition-all"></div>

                <div className="relative z-10">
                  <h3 className="text-2xl font-bold mb-2 group-hover:text-purple-300 transition-colors">{template.name}</h3>
                  <p className="text-xs text-gray-500 mb-8 font-mono">ID: {template.id.substring(0, 8)}...</p>

                  <div className="flex gap-3">
                    <button className="flex-1 py-3 rounded-xl bg-white/5 text-sm font-bold hover:bg-white/10 transition-all border border-white/5">Edit</button>
                    <button
                      onClick={() => handleDelete(template.id, activeTab)}
                      className="px-4 py-3 rounded-xl bg-red-500/10 text-red-400 text-sm font-bold hover:bg-red-500/20 transition-all border border-red-500/10"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {(activeTab === 'form' ? forms : certs).length === 0 && (
              <div className="col-span-full py-32 text-center border-2 border-dashed border-purple-500/10 rounded-[40px] text-gray-500 bg-purple-500/[0.02]">
                <div className="text-4xl mb-4 opacity-20">🎨</div>
                <p className="text-lg">No {activeTab} templates found.</p>
                <p className="text-sm">Create your first one to get started!</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Simplified Certificate Builder Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-xl bg-black/60">
          <div className="bg-[#1a1033] border border-purple-500/20 w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[40px] flex flex-col shadow-2xl">
            <div className="p-8 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Certificate Template Builder</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white text-2xl">×</button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Template Name</label>
                  <input
                    type="text"
                    value={certConfig.name}
                    onChange={(e) => setCertConfig({...certConfig, name: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Primary Title</label>
                  <input
                    type="text"
                    value={certConfig.title}
                    onChange={(e) => setCertConfig({...certConfig, title: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Title Font Size</label>
                    <input
                      type="number"
                      value={certConfig.titleFontSize}
                      onChange={(e) => setCertConfig({...certConfig, titleFontSize: parseInt(e.target.value)})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Title Y Pos</label>
                    <input
                      type="number"
                      value={certConfig.titleY}
                      onChange={(e) => setCertConfig({...certConfig, titleY: parseInt(e.target.value)})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Primary Color</label>
                    <input
                      type="color"
                      value={certConfig.primaryColor}
                      onChange={(e) => setCertConfig({...certConfig, primaryColor: e.target.value})}
                      className="w-full h-12 bg-white/5 border border-white/10 rounded-xl p-1 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Accent Color</label>
                    <input
                      type="color"
                      value={certConfig.accentColor}
                      onChange={(e) => setCertConfig({...certConfig, accentColor: e.target.value})}
                      className="w-full h-12 bg-white/5 border border-white/10 rounded-xl p-1 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                 <div className="aspect-[3/2] bg-white rounded-lg relative overflow-hidden border-4 border-gray-100 shadow-inner scale-90 origin-top">
                    {/* Visual Preview (Mock) */}
                    <div style={{ borderColor: certConfig.primaryColor, borderWidth: certConfig.borderWidth }} className="absolute inset-2 border-solid"></div>
                    <div style={{ borderColor: certConfig.accentColor }} className="absolute inset-4 border border-solid opacity-30"></div>

                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                       <h3 style={{ color: certConfig.primaryColor, fontSize: certConfig.titleFontSize / 2.5, top: (400 - certConfig.titleY) / 2.5 }} className="absolute font-bold uppercase">
                         {certConfig.title}
                       </h3>
                       <p className="text-[6px] text-gray-400 mt-2">This is to certify that</p>
                       <h4 style={{ color: certConfig.accentColor, fontSize: certConfig.nameFontSize / 2.5 }} className="font-bold mt-1">John Doe</h4>
                       <p className="text-[6px] text-gray-400 mt-1">has successfully participated in Awesome Hackathon</p>
                    </div>

                    <div style={{ width: certConfig.qrSize / 2.5, height: certConfig.qrSize / 2.5, right: (600 - certConfig.qrX - certConfig.qrSize) / 2.5, bottom: certConfig.qrY / 2.5 }} className="absolute bg-black p-1 flex items-center justify-center">
                       <div className="w-full h-full bg-white flex items-center justify-center text-[4px] font-mono">QR</div>
                    </div>
                 </div>
                 <div className="bg-purple-500/5 p-6 rounded-3xl border border-purple-500/10">
                    <p className="text-xs text-gray-400 leading-relaxed">
                      This is a dynamic preview. The final certificate will be generated as a high-quality PDF using the coordinates and styles defined above.
                    </p>
                 </div>
              </div>
            </div>

            <div className="p-8 border-t border-white/5 bg-white/[0.02] flex justify-end gap-4">
              <button onClick={() => setIsModalOpen(false)} className="px-8 py-3 rounded-xl font-bold text-gray-400 hover:text-white transition">Cancel</button>
              <button
                onClick={handleSaveCert}
                className="bg-purple-600 px-10 py-3 rounded-xl font-bold hover:bg-purple-700 transition shadow-lg shadow-purple-600/20"
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
