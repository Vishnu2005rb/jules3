'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { FormTemplateBuilder } from './FormTemplateBuilder';

// --- Constants ---
const CANVAS_W = 1122;
const CANVAS_H = 794;
const GRID_SIZE = 50;
const MAX_HISTORY = 50;
const ALIGN_TOLERANCE = 5;

// --- Types ---
type FontFamily = string;
type Alignment = 'left' | 'center' | 'right';

interface BaseEl { id: string; x: number; y: number; zIndex: number; }
interface TextEl extends BaseEl {
  type: 'text'; content: string; fontSize: number;
  color: string; fontFamily: FontFamily; alignment: Alignment;
}
interface ImageEl extends BaseEl {
  type: 'image'; imageUrl: string; width: number; height: number;
}
type CanvasEl = TextEl | ImageEl;

interface TemplateConfig {
  name: string; width: number; height: number;
  backgroundImage?: string; elements: CanvasEl[];
  certIdConfig?: { prefix: string; padding: number };
}

interface AlignGuide { type: 'v' | 'h'; pos: number; }

const SAMPLE = {
  participantName: 'John Doe', eventName: 'Sample Event 2024',
  date: '2024-05-20', certificateId: 'CER_EVENTNAME_0001',
};

const GOOGLE_FONTS = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Nunito',
  'Work Sans', 'Fira Sans', 'Source Sans Pro', 'Ubuntu', 'Raleway', 'Mulish',
  'DM Sans', 'Outfit', 'Plus Jakarta Sans', 'Manrope', 'Sora', 'Lexend',
  'Figtree', 'Karla', 'Rubik', 'Barlow', 'Quicksand', 'Comfortaa',
  'Playfair Display', 'Merriweather', 'Crimson Text', 'Libre Baskerville',
  'Lora', 'EB Garamond', 'Cormorant Garamond',
  'Oswald', 'Bebas Neue', 'Barlow Condensed', 'Exo 2', 'Rajdhani',
  'Dancing Script', 'Pacifico', 'Great Vibes', 'Satisfy', 'Caveat',
  'Kalam', 'Patrick Hand',
  'Courier New', 'Space Mono', 'Fira Code',
  'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana',
];

function loadGoogleFont(fontName: string) {
  if (!fontName || typeof document === 'undefined') return;
  const systemFonts = ['Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana', 'Courier New'];
  if (systemFonts.includes(fontName)) return;
  const linkId = `gf-${fontName.replace(/\s+/g, '-').toLowerCase()}`;
  if (document.getElementById(linkId)) return;
  const link = document.createElement('link');
  link.id = linkId;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

function toCssFontFamily(fontName: string | undefined) {
  const name = (fontName ?? '').trim() || 'Inter';
  const safeName = /[\s"']/g.test(name) ? `"${name.replace(/"/g, '\\"')}"` : name;
  return `${safeName}, ui-sans-serif, system-ui, sans-serif`;
}

function replacePlaceholders(text: string, certIdPreview?: string) {
  const certId = certIdPreview ?? SAMPLE.certificateId;
  return text
    .replace(/\{\{participantName\}\}/g, SAMPLE.participantName)
    .replace(/\{\{eventName\}\}/g, SAMPLE.eventName)
    .replace(/\{\{date\}\}/g, SAMPLE.date)
    .replace(/\{\{certificateId\}\}/g, certId);
}

function uid() { return `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }

function emptyConfig(name = ''): TemplateConfig {
  return { name, width: CANVAS_W, height: CANVAS_H, elements: [] };
}

function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }
function snapVal(v: number) { return Math.round(v / GRID_SIZE) * GRID_SIZE; }

// --- Certificate Builder ---
interface CertBuilderProps {
  initialTemplate?: { id: string; name: string; config: unknown } | null;
  onClose: () => void;
  onSaved: () => void;
}

function CertificateBuilder({ initialTemplate, onClose, onSaved }: CertBuilderProps) {
  const [config, setConfigRaw] = useState<TemplateConfig>(() => {
    if (initialTemplate) {
      try {
        const c = initialTemplate.config as TemplateConfig;
        return { ...emptyConfig(initialTemplate.name), ...c, name: initialTemplate.name };
      } catch { return emptyConfig(initialTemplate.name); }
    }
    return emptyConfig('');
  });
  const [history, setHistory] = useState<TemplateConfig[]>([]);
  const [future, setFuture] = useState<TemplateConfig[]>([]);

  const pushHistory = useCallback((prev: TemplateConfig) => {
    setHistory(h => [...h.slice(-MAX_HISTORY + 1), prev]);
    setFuture([]);
  }, []);

  const setConfig = useCallback((updater: TemplateConfig | ((c: TemplateConfig) => TemplateConfig)) => {
    setConfigRaw(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      pushHistory(prev);
      return next;
    });
  }, [pushHistory]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedEl = config.elements.find(e => e.id === selectedId) ?? null;
  const dragRef = useRef<{ elId: string; startMouseX: number; startMouseY: number; elStartX: number; elStartY: number; } | null>(null);
  const [showGrid, setShowGrid] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [guides, setGuides] = useState<AlignGuide[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function recalc() {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      const s = Math.min((width - 32) / CANVAS_W, (height - 32) / CANVAS_H, 1);
      setScale(Math.max(0.1, s));
    }
    recalc();
    window.addEventListener('resize', recalc);
    return () => window.removeEventListener('resize', recalc);
  }, []);

  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [nameError, setNameError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const undo = useCallback(() => {
    if (!history.length) return;
    const prev = history[history.length - 1];
    setFuture(f => [config, ...f]);
    setHistory(h => h.slice(0, -1));
    setConfigRaw(prev);
  }, [history, config]);

  const redo = useCallback(() => {
    if (!future.length) return;
    const next = future[0];
    setHistory(h => [...h, config]);
    setFuture(f => f.slice(1));
    setConfigRaw(next);
  }, [future, config]);

  const addText = () => {
    const el: TextEl = { id: uid(), type: 'text', x: 561, y: 397, zIndex: config.elements.length, content: 'New Text', fontSize: 24, color: '#000000', fontFamily: 'Inter', alignment: 'center' };
    setConfig(c => ({ ...c, elements: [...c.elements, el] }));
    setSelectedId(el.id);
    loadGoogleFont('Inter');
  };

  const addImage = () => {
    const el: ImageEl = { id: uid(), type: 'image', x: 561, y: 397, zIndex: config.elements.length, imageUrl: '', width: 100, height: 100 };
    setConfig(c => ({ ...c, elements: [...c.elements, el] }));
    setSelectedId(el.id);
  };

  const updateEl = (id: string, patch: Partial<CanvasEl>) => {
    setConfig(c => ({ ...c, elements: c.elements.map(e => e.id === id ? { ...e, ...patch } as CanvasEl : e) }));
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    setConfig(c => ({ ...c, elements: c.elements.filter(e => e.id !== selectedId) }));
    setSelectedId(null);
    setConfirmDelete(false);
  };

  const duplicate = () => {
    if (!selectedEl) return;
    const newEl: CanvasEl = { ...selectedEl, id: uid(), x: clamp(selectedEl.x + 20, 0, CANVAS_W), y: clamp(selectedEl.y + 20, 0, CANVAS_H), zIndex: config.elements.length };
    setConfig(c => ({ ...c, elements: [...c.elements, newEl] }));
    setSelectedId(newEl.id);
  };

  const bringToFront = () => {
    if (!selectedId) return;
    setConfig(c => { const others = c.elements.filter(e => e.id !== selectedId); const el = c.elements.find(e => e.id === selectedId)!; return { ...c, elements: [...others, el] }; });
  };

  const sendToBack = () => {
    if (!selectedId) return;
    setConfig(c => { const others = c.elements.filter(e => e.id !== selectedId); const el = c.elements.find(e => e.id === selectedId)!; return { ...c, elements: [el, ...others] }; });
  };

  const bgInputRef = useRef<HTMLInputElement>(null);
  const [bgError, setBgError] = useState('');

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg'].includes(file.type)) { setBgError('Only PNG and JPG formats are supported'); return; }
    setBgError('');
    const reader = new FileReader();
    reader.onload = ev => { setConfig(c => ({ ...c, backgroundImage: ev.target?.result as string })); };
    reader.readAsDataURL(file);
  };

  const onElMouseDown = (e: React.MouseEvent, elId: string) => {
    e.stopPropagation();
    setSelectedId(elId);
    const el = config.elements.find(x => x.id === elId)!;
    dragRef.current = { elId, startMouseX: e.clientX, startMouseY: e.clientY, elStartX: el.x, elStartY: el.y };
  };

  const onCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragRef.current) return;
    const { elId, startMouseX, startMouseY, elStartX, elStartY } = dragRef.current;
    const dx = (e.clientX - startMouseX) / scale;
    const dy = (e.clientY - startMouseY) / scale;
    let nx = clamp(elStartX + dx, 0, CANVAS_W);
    let ny = clamp(elStartY + dy, 0, CANVAS_H);
    if (snapToGrid) { nx = snapVal(nx); ny = snapVal(ny); }
    const newGuides: AlignGuide[] = [];
    config.elements.forEach(other => {
      if (other.id === elId) return;
      if (Math.abs(other.x - nx) < ALIGN_TOLERANCE) { newGuides.push({ type: 'v', pos: other.x }); nx = other.x; }
      if (Math.abs(other.y - ny) < ALIGN_TOLERANCE) { newGuides.push({ type: 'h', pos: other.y }); ny = other.y; }
    });
    setGuides(newGuides);
    setConfigRaw(c => ({ ...c, elements: c.elements.map(el => el.id === elId ? { ...el, x: nx, y: ny } as CanvasEl : el) }));
  }, [scale, snapToGrid, config.elements]);

  const onCanvasMouseUp = useCallback(() => {
    if (dragRef.current) { dragRef.current = null; setGuides([]); }
  }, []);

  const handleElImageUpload = (e: React.ChangeEvent<HTMLInputElement>, elId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg'].includes(file.type)) return;
    const reader = new FileReader();
    reader.onload = ev => { updateEl(elId, { imageUrl: ev.target?.result as string } as Partial<ImageEl>); };
    reader.readAsDataURL(file);
  };

  const validateName = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return 'Template name is required';
    if (trimmed.length < 3) return 'Template name must be at least 3 characters';
    if (trimmed.length > 100) return 'Template name must be at most 100 characters';
    return '';
  };

  const save = async () => {
    const err = validateName(config.name);
    if (err) { setNameError(err); return; }
    setNameError('');
    setSaving(true);
    setSaveMsg('');
    try {
      const body = { type: 'certificate', name: config.name.trim(), config: { ...config, name: config.name.trim() }, ...(initialTemplate ? { id: initialTemplate.id } : {}) };
      const res = await fetch('/api/admin/templates', { method: initialTemplate ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Save failed');
      setSaveMsg('Template saved successfully');
      onSaved();
    } catch { setSaveMsg('Failed to save template'); } finally { setSaving(false); }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA';
      if (e.key === '?') { setShowShortcuts(s => !s); return; }
      if (e.key === 'Delete' && !isInput && selectedId) { e.preventDefault(); setConfirmDelete(true); return; }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); return; }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); redo(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); save(); return; }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, undo, redo]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col no-theme-bg"
      style={{
        fontFamily: 'var(--font-sans), ui-sans-serif, system-ui, sans-serif',
        background: 'radial-gradient(1200px 600px at 20% 0%, rgba(99,102,241,0.16), transparent 60%), radial-gradient(900px 500px at 90% 0%, rgba(168,85,247,0.14), transparent 55%), linear-gradient(135deg, #f8faff 0%, #f0f4ff 50%, #fafbff 100%)',
      }}
    >
      <div className="h-16 flex items-center justify-between px-4 sm:px-5 bg-white/70 backdrop-blur-xl border-b border-gray-200/60 shrink-0" style={{ boxShadow: '0 1px 0 rgba(0,0,0,0.06)' }}>
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900 text-sm px-3 py-2 rounded-xl hover:bg-gray-100/80 transition-all active:scale-[0.98]">X Close</button>
          <span className="text-gray-800 font-semibold text-sm">Certificate Template Builder</span>
          <span className="text-gray-500 text-xs">{Math.round(scale * 100)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowShortcuts(true)} className="text-gray-500 hover:text-gray-900 text-xs px-2 py-1 rounded hover:bg-gray-100 transition-colors">? Shortcuts</button>
          <button onClick={() => setShowPreview(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all hover:-translate-y-px active:translate-y-0 shadow-sm">
            Preview
          </button>
          <button onClick={save} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold px-4 py-2 rounded-xl transition-all hover:-translate-y-px active:translate-y-0 shadow-sm">
            {saving ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>

      {saveMsg && (
        <div className={`text-center text-xs font-semibold py-1.5 ${saveMsg.includes('success') ? 'bg-emerald-50 text-emerald-700 border-b border-emerald-200' : 'bg-red-50 text-red-700 border-b border-red-200'}`}>{saveMsg}</div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="w-72 bg-white/65 backdrop-blur-xl border-r border-gray-200/60 flex flex-col overflow-y-auto shrink-0 p-3 gap-3">
          <div className="bg-white/80 border border-gray-200/70 rounded-2xl p-3 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
            <label className="text-gray-700 text-xs font-semibold block mb-1">Template Name</label>
            <input className={`w-full bg-white text-gray-800 text-sm rounded px-2 py-1.5 border ${nameError ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:border-indigo-500`}
              value={config.name} onChange={e => { setConfigRaw(c => ({ ...c, name: e.target.value })); setNameError(''); }} placeholder="Enter name..." />
            {nameError && <p className="text-red-400 text-xs mt-1">{nameError}</p>}
          </div>
          <div className="bg-white/80 border border-gray-200/70 rounded-2xl p-3 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
            <label className="text-gray-700 text-xs font-semibold block mb-1">Template Image</label>
            <button onClick={() => bgInputRef.current?.click()} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-2 py-2 rounded-xl transition-all active:scale-[0.98]">Upload Template Image</button>
            <input ref={bgInputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleBgUpload} />
            {bgError && <p className="text-red-400 text-xs mt-1">{bgError}</p>}
            {config.backgroundImage && (
              <button onClick={() => setConfig(c => ({ ...c, backgroundImage: undefined }))} className="w-full mt-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-2 py-2 rounded-xl transition-all active:scale-[0.98]">Remove Template Image</button>
            )}
          </div>
          <div className="bg-white/80 border border-gray-200/70 rounded-2xl p-3 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
            <label className="text-gray-700 text-xs font-semibold block mb-1">Add Elements</label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={addText} className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold px-2 py-2.5 rounded-xl transition-all hover:-translate-y-px">+ Text</button>
              <button onClick={addImage} className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-semibold px-2 py-2.5 rounded-xl transition-all hover:-translate-y-px">+ Logo</button>
            </div>
          </div>
          <div className="bg-white/80 border border-gray-200/70 rounded-2xl p-3 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
            <label className="text-gray-700 text-xs font-semibold block mb-1">Dynamic Fields</label>
            <p className="text-gray-500 text-[11px] mb-2 leading-tight">Tap to insert placeholders quickly</p>
            {[
              { label: 'Participant Name', placeholder: '{{participantName}}', color: '#6366f1', fontSize: 36 },
              { label: 'Event Name', placeholder: '{{eventName}}', color: '#000000', fontSize: 20 },
              { label: 'Issue Date', placeholder: '{{date}}', color: '#666666', fontSize: 14 },
              { label: 'Certificate ID', placeholder: '{{certificateId}}', color: '#999999', fontSize: 11 },
            ].map(({ label, placeholder, color, fontSize }) => (
              <button key={placeholder} onClick={() => {
                const el: TextEl = { id: uid(), type: 'text', x: 561, y: 397, zIndex: config.elements.length, content: placeholder, fontSize, color, fontFamily: 'Inter', alignment: 'center' };
                setConfig(c => ({ ...c, elements: [...c.elements, el] }));
                setSelectedId(el.id);
                loadGoogleFont('Inter');
              }} className="w-full bg-white hover:bg-gray-50 text-gray-800 text-xs px-2.5 py-2 rounded-xl mb-1.5 text-left border border-gray-300 hover:border-indigo-400 transition-all">
                <div className="font-semibold">{label}</div>
                <div className="text-[10px] text-indigo-600 mt-0.5">{placeholder}</div>
              </button>
            ))}
          </div>
          <div className="bg-white/80 border border-gray-200/70 rounded-2xl p-3 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
            <label className="text-gray-700 text-xs font-semibold block mb-1">Certificate ID Format</label>
            <p className="text-gray-500 text-[11px] mb-2 leading-tight">
              Customize how IDs are generated for this template. Each certificate gets an auto-incremented number.
            </p>
            <div className="space-y-2">
              <div>
                <label className="text-gray-500 text-[11px] mb-1 block">Prefix</label>
                <input
                  type="text"
                  placeholder="e.g. CER_HACKATHON"
                  maxLength={40}
                  className="w-full bg-white text-gray-800 text-xs rounded px-2 py-1.5 border border-gray-300 focus:outline-none focus:border-indigo-500 uppercase"
                  value={config.certIdConfig?.prefix ?? ''}
                  onChange={e => {
                    const prefix = e.target.value.toUpperCase().replace(/[^A-Z0-9_\-]/g, '');
                    setConfigRaw(c => ({ ...c, certIdConfig: { prefix, padding: c.certIdConfig?.padding ?? 4 } }));
                  }}
                />
              </div>
              <div>
                <label className="text-gray-500 text-[11px] mb-1 block">Number Padding (digits)</label>
                <div className="flex gap-1">
                  {[3, 4, 5, 6].map(n => (
                    <button
                      key={n}
                      onClick={() => setConfigRaw(c => ({ ...c, certIdConfig: { prefix: c.certIdConfig?.prefix ?? '', padding: n } }))}
                      className={`flex-1 text-xs py-1.5 rounded border transition-all ${(config.certIdConfig?.padding ?? 4) === n ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              {/* Live preview */}
              <div className="mt-1 px-2.5 py-2 rounded-xl bg-indigo-50 border border-indigo-200">
                <p className="text-[10px] text-indigo-500 font-semibold uppercase tracking-widest mb-0.5">Preview</p>
                <p className="text-xs font-mono text-indigo-800 font-bold">
                  {config.certIdConfig?.prefix?.trim()
                    ? `${config.certIdConfig.prefix.trim().toUpperCase()}_${'1'.padStart(config.certIdConfig.padding ?? 4, '0')}`
                    : `CERT-${Date.now().toString().slice(-8)}-A7K9M`}
                </p>
                <p className="text-[10px] text-indigo-400 mt-0.5">
                  {config.certIdConfig?.prefix?.trim()
                    ? `Next: ...${config.certIdConfig.prefix.trim().toUpperCase()}_${'2'.padStart(config.certIdConfig.padding ?? 4, '0')}, _${'3'.padStart(config.certIdConfig.padding ?? 4, '0')}...`
                    : 'No prefix set — using default random format'}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white/80 border border-gray-200/70 rounded-2xl p-3 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
            <label className="text-gray-700 text-xs font-semibold block mb-1">Grid</label>
            <label className="flex items-center gap-2 text-gray-600 text-xs cursor-pointer mb-1">
              <input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} /> Show Grid
            </label>
            <label className="flex items-center gap-2 text-gray-600 text-xs cursor-pointer">
              <input type="checkbox" checked={snapToGrid} onChange={e => setSnapToGrid(e.target.checked)} /> Snap to Grid
            </label>
          </div>
          <div className="bg-white/80 border border-gray-200/70 rounded-2xl p-3 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
            <label className="text-gray-700 text-xs font-semibold block mb-1">History</label>
            <div className="flex gap-1">
              <button onClick={undo} disabled={!history.length} className="flex-1 bg-white hover:bg-gray-50 disabled:opacity-40 text-gray-700 text-xs px-2 py-1.5 rounded border border-gray-300">Undo</button>
              <button onClick={redo} disabled={!future.length} className="flex-1 bg-white hover:bg-gray-50 disabled:opacity-40 text-gray-700 text-xs px-2 py-1.5 rounded border border-gray-300">Redo</button>
            </div>
          </div>
          <div className="flex-1 bg-white/80 border border-gray-200/70 rounded-2xl p-3 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
            <label className="text-gray-700 text-xs font-semibold block mb-1">Elements ({config.elements.length})</label>
            <div className="flex flex-col gap-1">
              {[...config.elements].reverse().map(el => (
                <button key={el.id} onClick={() => setSelectedId(el.id)}
                  className={`text-left text-xs px-2 py-1.5 rounded truncate ${selectedId === el.id ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}>
                  {el.type === 'text' ? `T: ${(el as TextEl).content.slice(0, 20)}` : `I: Logo ${el.id.slice(-4)}`}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div ref={containerRef} className="flex-1 flex items-center justify-center overflow-auto p-6 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.08),transparent_55%),linear-gradient(180deg,#f0f4ff_0%,#f8faff_100%)]"
          onMouseMove={onCanvasMouseMove} onMouseUp={onCanvasMouseUp} onMouseLeave={onCanvasMouseUp}>
          <div style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}>
            <div style={{ width: CANVAS_W, height: CANVAS_H, position: 'relative', background: config.backgroundImage ? `url(${config.backgroundImage}) center/cover no-repeat` : '#ffffff', border: '1px solid rgba(17,24,39,0.14)', boxShadow: '0 8px 32px rgba(0,0,0,0.10)', cursor: dragRef.current ? 'grabbing' : 'default', overflow: 'hidden' }}
              onClick={() => setSelectedId(null)}>
              {showGrid && (
                <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.3 }} width={CANVAS_W} height={CANVAS_H}>
                  {Array.from({ length: Math.floor(CANVAS_W / GRID_SIZE) + 1 }, (_, i) => (
                    <line key={`v${i}`} x1={i * GRID_SIZE} y1={0} x2={i * GRID_SIZE} y2={CANVAS_H} stroke="#888" strokeWidth="1" />
                  ))}
                  {Array.from({ length: Math.floor(CANVAS_H / GRID_SIZE) + 1 }, (_, i) => (
                    <line key={`h${i}`} x1={0} y1={i * GRID_SIZE} x2={CANVAS_W} y2={i * GRID_SIZE} stroke="#888" strokeWidth="1" />
                  ))}
                </svg>
              )}
              {guides.map((g, i) => g.type === 'v' ? (
                <div key={i} style={{ position: 'absolute', left: g.pos, top: 0, width: 1, height: CANVAS_H, background: '#00bfff', pointerEvents: 'none', zIndex: 9999 }} />
              ) : (
                <div key={i} style={{ position: 'absolute', top: g.pos, left: 0, height: 1, width: CANVAS_W, background: '#00bfff', pointerEvents: 'none', zIndex: 9999 }} />
              ))}
              {config.elements.map((el, idx) => (
                <div
                  key={el.id}
                  onMouseDown={e => onElMouseDown(e, el.id)}
                  onClick={e => { e.stopPropagation(); setSelectedId(el.id); }}
                  style={{ position: 'absolute', left: el.x, top: el.y, zIndex: idx + 1, cursor: 'grab', outline: selectedId === el.id ? '2px solid #6366f1' : 'none', outlineOffset: 2, userSelect: 'none' }}>
                  {el.type === 'text' ? (
                    <span style={{ fontSize: (el as TextEl).fontSize, color: (el as TextEl).color, fontFamily: toCssFontFamily((el as TextEl).fontFamily), textAlign: (el as TextEl).alignment, display: 'block', whiteSpace: 'pre' }}>
                      {(el as TextEl).content}
                    </span>
                  ) : (
                    <div style={{ width: (el as ImageEl).width, height: (el as ImageEl).height, display: 'flex', alignItems: 'center', justifyContent: 'center', background: (el as ImageEl).imageUrl ? 'transparent' : '#e5e7eb', border: (el as ImageEl).imageUrl ? 'none' : '2px dashed #9ca3af' }}>
                      {(el as ImageEl).imageUrl ? <img src={(el as ImageEl).imageUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="logo" /> : <span style={{ fontSize: 12, color: '#6b7280' }}>Logo</span>}
                    </div>
                  )}
                </div>
              ))}
              <div style={{ position: 'absolute', bottom: 4, right: 6, fontSize: 10, color: 'rgba(0,0,0,0.3)', pointerEvents: 'none' }}>{CANVAS_W} x {CANVAS_H} px</div>
            </div>
          </div>
        </div>

        <div className="w-72 bg-white/65 backdrop-blur-xl border-l border-gray-200/60 flex flex-col overflow-y-auto shrink-0 p-3 gap-3">
          {selectedEl ? (
            <>
              <div className="bg-white/80 border border-gray-200/70 rounded-2xl px-3 py-2 text-gray-800 text-sm font-semibold">Element Properties</div>
              <div className="bg-white/80 border border-gray-200/70 rounded-2xl p-3 grid grid-cols-2 gap-2">
                <div>
                  <label className="text-gray-500 text-xs">X</label>
                  <input type="number" className="w-full bg-white text-gray-800 text-xs rounded px-2 py-1.5 border border-gray-300 focus:outline-none focus:border-indigo-500"
                    value={Math.round(selectedEl.x)} onChange={e => updateEl(selectedEl.id, { x: clamp(Number(e.target.value), 0, CANVAS_W) })} />
                </div>
                <div>
                  <label className="text-gray-500 text-xs">Y</label>
                  <input type="number" className="w-full bg-white text-gray-800 text-xs rounded px-2 py-1.5 border border-gray-300 focus:outline-none focus:border-indigo-500"
                    value={Math.round(selectedEl.y)} onChange={e => updateEl(selectedEl.id, { y: clamp(Number(e.target.value), 0, CANVAS_H) })} />
                </div>
              </div>
              <div className="bg-white/80 border border-gray-200/70 rounded-2xl p-3 space-y-3">
                {selectedEl.type === 'text' && <TextProps el={selectedEl as TextEl} onChange={patch => updateEl(selectedEl.id, patch)} />}
                {selectedEl.type === 'image' && <ImageProps el={selectedEl as ImageEl} onChange={patch => updateEl(selectedEl.id, patch)} onUpload={e => handleElImageUpload(e, selectedEl.id)} />}
              </div>
              <div className="bg-white/80 border border-gray-200/70 rounded-2xl p-3">
                <label className="text-gray-700 text-xs font-semibold block mb-1">Layering</label>
                <div className="flex gap-1">
                  <button onClick={bringToFront} className="flex-1 bg-white hover:bg-gray-50 text-gray-700 text-xs px-2 py-2 rounded-xl border border-gray-300 transition-all active:scale-[0.98]">Front</button>
                  <button onClick={sendToBack} className="flex-1 bg-white hover:bg-gray-50 text-gray-700 text-xs px-2 py-2 rounded-xl border border-gray-300 transition-all active:scale-[0.98]">Back</button>
                </div>
              </div>
              <div className="bg-white/80 border border-gray-200/70 rounded-2xl p-3">
                <label className="text-gray-700 text-xs font-semibold block mb-1">Actions</label>
                <button onClick={duplicate} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-2 py-2 rounded-xl mb-2 transition-all hover:-translate-y-px active:translate-y-0">Duplicate</button>
                <button onClick={() => setConfirmDelete(true)} className="w-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-2 py-2 rounded-xl transition-all hover:-translate-y-px active:translate-y-0">Delete</button>
              </div>
            </>
          ) : (
            <div className="bg-white/80 border border-gray-200/70 rounded-2xl p-4 text-gray-500 text-xs text-center mt-2">Select an element to edit its properties</div>
          )}
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center">
          <div className="bg-white border border-gray-200 rounded-xl p-6 w-80 shadow-xl">
            <h3 className="text-gray-900 font-semibold mb-2">Delete Element?</h3>
            <p className="text-gray-600 text-sm mb-4">This action cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmDelete(false)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm px-3 py-1 rounded">Cancel</button>
              <button onClick={deleteSelected} className="bg-red-600 hover:bg-red-700 text-white text-sm px-3 py-1 rounded">Delete</button>
            </div>
          </div>
        </div>
      )}
      {showPreview && <PreviewModal config={config} onClose={() => setShowPreview(false)} />}
      {showShortcuts && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center">
          <div className="bg-gray-800 rounded-lg p-6 w-80 border border-gray-700">
            <h3 className="text-white font-semibold mb-3">Keyboard Shortcuts</h3>
            <table className="w-full text-sm text-gray-300">
              <tbody>
                {[['Ctrl+Z', 'Undo'], ['Ctrl+Y', 'Redo'], ['Ctrl+S', 'Save'], ['Delete', 'Delete selected'], ['?', 'Toggle shortcuts']].map(([k, v]) => (
                  <tr key={k}><td className="py-1 pr-4 font-mono text-indigo-300">{k}</td><td>{v}</td></tr>
                ))}
              </tbody>
            </table>
            <button onClick={() => setShowShortcuts(false)} className="mt-4 w-full bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm px-3 py-1 rounded">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Searchable Font Picker ---
function CertFontPicker({ value, onChange }: { value: string; onChange: (font: string) => void }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadGoogleFont(value); }, [value]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const filtered = GOOGLE_FONTS.filter(f => f.toLowerCase().includes(query.toLowerCase()));

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-2 py-1.5 bg-white border border-gray-300 rounded text-xs hover:border-indigo-400 focus:outline-none focus:border-indigo-500"
      >
        <span style={{ fontFamily: toCssFontFamily(value) }} className="text-gray-800 truncate">{value || 'Select font...'}</span>
        <span className="text-gray-400">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input
              autoFocus
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search fonts..."
              className="w-full px-2 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded focus:outline-none focus:border-indigo-400 text-gray-800"
            />
          </div>
          <div className="max-h-52 overflow-y-auto">
            {filtered.map(font => (
              <button
                key={font}
                type="button"
                onMouseEnter={() => loadGoogleFont(font)}
                onClick={() => {
                  loadGoogleFont(font);
                  onChange(font);
                  setOpen(false);
                  setQuery('');
                }}
                className={`w-full text-left px-3 py-2 text-xs transition-colors ${value === font ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                <div className="truncate">{font}</div>
                <div className="truncate text-[10px] text-gray-500 mt-0.5" style={{ fontFamily: toCssFontFamily(font) }}>
                  The quick brown fox jumps over the lazy dog
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Text Properties Panel ---
function TextProps({ el, onChange }: { el: TextEl; onChange: (p: Partial<TextEl>) => void }) {
  useEffect(() => { loadGoogleFont(el.fontFamily); }, [el.fontFamily]);
  return (
    <>
      <div>
        <label className="text-gray-700 text-xs">Content</label>
        <textarea className="w-full bg-white text-gray-800 text-xs rounded px-2 py-1.5 border border-gray-300 focus:outline-none focus:border-indigo-500 resize-none" rows={3}
          value={el.content} onChange={e => onChange({ content: e.target.value })} />
        <p className="text-gray-500 text-xs mt-0.5">Use: {"{{participantName}}"} {"{{eventName}}"} {"{{date}}"} {"{{certificateId}}"}</p>
      </div>
      <div>
        <label className="text-gray-700 text-xs">Font Size ({el.fontSize}px)</label>
        <input type="range" min={8} max={120} value={el.fontSize} className="w-full h-1 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" onChange={e => onChange({ fontSize: Number(e.target.value) })} />
        <input type="number" min={8} max={120} value={el.fontSize} className="w-full bg-white text-gray-800 text-xs rounded px-2 py-1.5 border border-gray-300 mt-2 focus:outline-none focus:border-indigo-500"
          onChange={e => onChange({ fontSize: clamp(Number(e.target.value), 8, 120) })} />
      </div>
      <div>
        <label className="text-gray-700 text-xs">Color</label>
        <div className="flex gap-2 items-center">
          <input type="color" value={el.color} onChange={e => onChange({ color: e.target.value })} className="w-8 h-8 rounded cursor-pointer bg-transparent border-0" />
          <input type="text" value={el.color} onChange={e => onChange({ color: e.target.value })} className="flex-1 bg-white text-gray-800 text-xs rounded px-2 py-1.5 border border-gray-300 focus:outline-none focus:border-indigo-500" />
        </div>
      </div>
      <div>
        <label className="text-gray-700 text-xs">Font Family</label>
        <CertFontPicker value={el.fontFamily || 'Inter'} onChange={font => onChange({ fontFamily: font as FontFamily })} />
      </div>
      <div>
        <label className="text-gray-700 text-xs">Alignment</label>
        <div className="flex gap-1">
          {(['left', 'center', 'right'] as Alignment[]).map(a => (
            <button key={a} onClick={() => onChange({ alignment: a })}
              className={`flex-1 text-xs px-2 py-1.5 rounded ${el.alignment === a ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`}>
              {a}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

// --- Image Properties Panel ---
function ImageProps({ el, onChange, onUpload }: { el: ImageEl; onChange: (p: Partial<ImageEl>) => void; onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void; }) {
  const imgInputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <div>
        <label className="text-gray-700 text-xs">Image</label>
        <button onClick={() => imgInputRef.current?.click()} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-2 py-1.5 rounded">Upload Image</button>
        <input ref={imgInputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={onUpload} />
      </div>
      <div>
        <label className="text-gray-700 text-xs">Width (20-800)</label>
        <input type="number" min={20} max={800} value={el.width} className="w-full bg-white text-gray-800 text-xs rounded px-2 py-1.5 border border-gray-300 focus:outline-none focus:border-indigo-500"
          onChange={e => onChange({ width: clamp(Number(e.target.value), 20, 800) })} />
      </div>
      <div>
        <label className="text-gray-700 text-xs">Height (20-600)</label>
        <input type="number" min={20} max={600} value={el.height} className="w-full bg-white text-gray-800 text-xs rounded px-2 py-1.5 border border-gray-300 focus:outline-none focus:border-indigo-500"
          onChange={e => onChange({ height: clamp(Number(e.target.value), 20, 600) })} />
      </div>
    </>
  );
}

// --- Preview Modal ---
function PreviewModal({ config, onClose }: { config: TemplateConfig; onClose: () => void }) {
  const certIdPreview = config.certIdConfig?.prefix?.trim()
    ? `${config.certIdConfig.prefix.trim().toUpperCase()}_${'1'.padStart(config.certIdConfig.padding ?? 4, '0')}`
    : SAMPLE.certificateId;

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xl flex flex-col max-h-full overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
          <div>
            <span className="text-gray-800 font-semibold text-sm">Preview (Sample Data)</span>
            <span className="ml-3 text-xs text-indigo-600 font-mono bg-indigo-50 px-2 py-0.5 rounded">ID: {certIdPreview}</span>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900 text-sm px-2 py-1 rounded hover:bg-gray-100">X Close</button>
        </div>
        <div className="overflow-auto p-4 flex items-center justify-center bg-black/20">
          <div style={{ width: CANVAS_W, height: CANVAS_H, position: 'relative', background: config.backgroundImage ? `url(${config.backgroundImage}) center/cover no-repeat` : '#ffffff', border: '1px solid rgba(17,24,39,0.14)', boxShadow: '0 8px 32px rgba(0,0,0,0.10)', overflow: 'hidden' }}>
            {config.elements.map((el, idx) => (
              <div key={el.id} style={{ position: 'absolute', left: el.x, top: el.y, zIndex: idx + 1 }}>
                {el.type === 'text' ? (
                  <span style={{ fontSize: (el as TextEl).fontSize, color: (el as TextEl).color, fontFamily: toCssFontFamily((el as TextEl).fontFamily), textAlign: (el as TextEl).alignment, display: 'block', whiteSpace: 'pre' }}>
                    {replacePlaceholders((el as TextEl).content, certIdPreview)}
                  </span>
                ) : (
                  <div style={{ width: (el as ImageEl).width, height: (el as ImageEl).height }}>
                    {(el as ImageEl).imageUrl ? <img src={(el as ImageEl).imageUrl} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="logo" /> : <div style={{ width: '100%', height: '100%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#6b7280' }}>Logo</div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Main Templates Page ---
export default function TemplatesPage() {
  const [activeTab, setActiveTab] = useState<'form' | 'certificate'>('form');
  const [certs, setCerts] = useState<any[]>([]);
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [formBuilderOpen, setFormBuilderOpen] = useState(false);
  const [editingForm, setEditingForm] = useState<any>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/templates');
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        const text = await res.text();
        throw new Error(`Expected JSON from /api/admin/templates, got ${ct || 'unknown content-type'}: ${text.slice(0, 120)}`);
      }
      const data = await res.json();
      setCerts(Array.isArray(data.certs) ? data.certs : []);
      setForms(Array.isArray(data.forms) ? data.forms : []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleDeleteCert = async (id: string) => {
    if (!confirm('Delete this certificate template?')) return;
    await fetch(`/api/admin/templates?id=${id}&type=certificate`, { method: 'DELETE' });
    fetchAll();
  };

  const handleDeleteForm = async (id: string) => {
    if (!confirm('Delete this form template?')) return;
    await fetch(`/api/admin/templates?id=${id}&type=form`, { method: 'DELETE' });
    fetchAll();
  };

  if (builderOpen) {
    return <CertificateBuilder initialTemplate={editingTemplate} onClose={() => { setBuilderOpen(false); setEditingTemplate(null); }} onSaved={() => { fetchAll(); }} />;
  }

  if (formBuilderOpen) {
    return <FormTemplateBuilder initialTemplate={editingForm} onClose={() => { setFormBuilderOpen(false); setEditingForm(null); }} onSaved={() => { fetchAll(); }} />;
  }

  return (
    <div className="min-h-screen text-white p-6 md:p-12 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-12">
          <div>
            <Link href="/admin/dashboard" className="text-purple-400 text-xs font-black tracking-widest uppercase hover:text-purple-300 transition-colors mb-4 inline-block">
              &larr; Management Portal
            </Link>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
              Layout <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Studio</span>
            </h1>
            <p className="text-gray-500 font-medium text-lg mt-1">Design form and certificate templates</p>
          </div>
          <button
            onClick={() => { if (activeTab === 'certificate') { setEditingTemplate(null); setBuilderOpen(true); } else { setEditingForm(null); setFormBuilderOpen(true); } }}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 px-10 py-5 rounded-2xl font-black text-sm hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-all"
          >
            + New {activeTab === 'certificate' ? 'Certificate' : 'Form'} Template
          </button>
        </header>

        <div className="flex gap-2 mb-10 p-1 bg-white/5 rounded-2xl w-fit border border-white/10">
          <button onClick={() => setActiveTab('form')}
            className={`px-8 py-3 rounded-xl font-black text-sm transition-all ${activeTab === 'form' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>
            Form Templates
          </button>
          <button onClick={() => setActiveTab('certificate')}
            className={`px-8 py-3 rounded-xl font-black text-sm transition-all ${activeTab === 'certificate' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>
            Certificate Templates
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-40">
            <div className="w-14 h-14 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activeTab === 'certificate' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {certs.map((cert) => (
              <div key={cert.id} className="border border-white/5 p-8 rounded-3xl hover:border-purple-500/30 transition-all group relative overflow-hidden bg-white/5">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 blur-3xl rounded-full -mr-10 -mt-10" />
                <div className="relative z-10">
                  <div className="px-3 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-widest inline-block mb-4">Certificate</div>
                  <h3 className="text-xl font-black mb-2 group-hover:text-purple-300 transition-colors">{cert.name}</h3>
                  <p className="text-gray-500 text-xs mb-6">{new Date(cert.createdAt).toLocaleDateString()}</p>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingTemplate(cert); setBuilderOpen(true); }}
                      className="flex-1 py-3 rounded-xl bg-white/5 text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5">Edit</button>
                    <button onClick={() => handleDeleteCert(cert.id)}
                      className="px-4 py-3 rounded-xl bg-red-500/5 text-red-500 hover:bg-red-500/10 transition-all border border-red-500/10 text-xs font-bold">Delete</button>
                  </div>
                </div>
              </div>
            ))}
            {certs.length === 0 && (
              <div className="col-span-full py-40 text-center rounded-3xl border-2 border-dashed border-white/5 text-gray-600">
                <p className="text-7xl mb-8 opacity-10">C</p>
                <p className="text-xl font-bold">No certificate templates yet.</p>
                <p className="text-sm font-medium mt-2">Click &quot;+ New Certificate Template&quot; to get started.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {forms.map((form) => (
              <div key={form.id} className="border border-white/5 p-8 rounded-3xl hover:border-blue-500/30 transition-all group relative overflow-hidden bg-white/5">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl rounded-full -mr-10 -mt-10" />
                <div className="relative z-10">
                  <div className="px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest inline-block mb-4">Form</div>
                  <h3 className="text-xl font-black mb-2 group-hover:text-blue-300 transition-colors">{form.name}</h3>
                  <p className="text-gray-500 text-xs mb-2">{new Date(form.createdAt).toLocaleDateString()}</p>
                  <p className="text-gray-600 text-xs mb-6">{Array.isArray(form.fields) ? form.fields.length : 0} custom fields</p>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingForm(form); setFormBuilderOpen(true); }}
                      className="flex-1 py-3 rounded-xl bg-white/5 text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5">Edit</button>
                    <button onClick={() => handleDeleteForm(form.id)}
                      className="px-4 py-3 rounded-xl bg-red-500/5 text-red-500 hover:bg-red-500/10 transition-all border border-red-500/10 text-xs font-bold">Delete</button>
                  </div>
                </div>
              </div>
            ))}
            {forms.length === 0 && (
              <div className="col-span-full py-40 text-center rounded-3xl border-2 border-dashed border-white/5 text-gray-600">
                <p className="text-7xl mb-8 opacity-10">F</p>
                <p className="text-xl font-bold">No form templates yet.</p>
                <p className="text-sm font-medium mt-2">Click &quot;+ New Form Template&quot; to get started.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
