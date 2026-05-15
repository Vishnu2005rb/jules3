'use client';

import { useState, useRef, useCallback, memo } from 'react';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types (unchanged) ────────────────────────────────────────────────────────
type HeaderElementType = 'logo' | 'text' | 'linkedin' | 'instagram';
type FooterElementType = HeaderElementType;
type SectionType = 'header' | 'body' | 'footer';

interface HeaderElement {
  id: string; type: HeaderElementType;
  x: number; y: number; width: number; height: number;
  content?: string; fontSize?: number; color?: string; fontFamily?: string; alignment?: 'left' | 'center' | 'right';
  imageUrl?: string;
}
type FooterElement = HeaderElement;

interface CustomField {
  id: string; label: string;
  type: 'text' | 'number' | 'date' | 'select';
  required: boolean; options?: string;
}

interface FooterConfig {
  footerElements: FooterElement[]; width: number; height: number;
  backgroundColor: string; backgroundImage?: string; backgroundFit: 'cover' | 'contain';
}

interface HeaderConfig {
  headerElements: HeaderElement[]; headerWidth: number; headerHeight: number;
  headerBackground: string; headerBackgroundImage?: string; headerBackgroundFit: 'cover' | 'contain';
  footerText: string; footerSocials: string; footerConfig?: FooterConfig;
}

interface FormTemplateBuilderProps {
  initialTemplate?: { id: string; name: string; fields: CustomField[]; headerConfig: Partial<HeaderConfig>; } | null;
  onClose: () => void; onSaved: () => void;
}

// ─── Google Fonts ────────────────────────────────────────────────────────────
const GOOGLE_FONTS = [
  // Sans-serif
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Nunito',
  'Work Sans', 'Fira Sans', 'Source Sans Pro', 'Ubuntu', 'Raleway', 'Mulish',
  'DM Sans', 'Outfit', 'Plus Jakarta Sans', 'Manrope', 'Sora', 'Lexend',
  'Figtree', 'Karla', 'Rubik', 'Barlow', 'Quicksand', 'Comfortaa',
  // Serif
  'Playfair Display', 'Merriweather', 'Crimson Text', 'Libre Baskerville',
  'Lora', 'EB Garamond', 'Cormorant Garamond',
  // Display / Bold
  'Oswald', 'Bebas Neue', 'Barlow Condensed', 'Exo 2', 'Rajdhani',
  // Handwriting / Script
  'Dancing Script', 'Pacifico', 'Great Vibes', 'Satisfy', 'Caveat',
  'Kalam', 'Patrick Hand',
  // Monospace
  'Courier New', 'Space Mono', 'Fira Code',
  // System
  'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana',
];

/** Inject a Google Font <link> into <head> once */
function loadGoogleFont(fontName: string) {
  if (!fontName) return;
  // System fonts don't need loading
  const systemFonts = ['Arial','Helvetica','Times New Roman','Georgia','Verdana','Courier New'];
  if (systemFonts.includes(fontName)) return;
  const linkId = `gf-${fontName.replace(/\s+/g, '-').toLowerCase()}`;
  if (document.getElementById(linkId)) return;
  const link = document.createElement('link');
  link.id = linkId;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

function toCssFontFamily(fontName: string | undefined | null) {
  const name = (fontName ?? '').trim() || 'Inter';
  const safeName = /[\s"']/g.test(name) ? `"${name.replace(/"/g, '\\"')}"` : name;
  return `${safeName}, ui-sans-serif, system-ui, sans-serif`;
}

function uid() { return `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }
function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }


// ─── Main Component (all logic unchanged) ────────────────────────────────────
export function FormTemplateBuilder({ initialTemplate, onClose, onSaved }: FormTemplateBuilderProps) {
  const [formName, setFormName] = useState(initialTemplate?.name ?? '');
  const [nameError, setNameError] = useState('');
  const [headerElements, setHeaderElements] = useState<HeaderElement[]>((initialTemplate?.headerConfig?.headerElements as HeaderElement[]) ?? []);
  const [headerWidth, setHeaderWidth] = useState(initialTemplate?.headerConfig?.headerWidth ?? 800);
  const [headerHeight, setHeaderHeight] = useState(initialTemplate?.headerConfig?.headerHeight ?? 160);
  const [headerBackground, setHeaderBackground] = useState(initialTemplate?.headerConfig?.headerBackground ?? '#1e1b4b');
  const [headerBackgroundImage, setHeaderBackgroundImage] = useState<string | undefined>(initialTemplate?.headerConfig?.headerBackgroundImage);
  const [headerBackgroundFit, setHeaderBackgroundFit] = useState<'cover'|'contain'>(initialTemplate?.headerConfig?.headerBackgroundFit ?? 'cover');
  const [footerText, setFooterText] = useState(initialTemplate?.headerConfig?.footerText ?? '');
  const [footerSocials, setFooterSocials] = useState(initialTemplate?.headerConfig?.footerSocials ?? '');
  const [footerElements, setFooterElements] = useState<FooterElement[]>((initialTemplate?.headerConfig?.footerConfig?.footerElements as FooterElement[]) ?? []);
  const [footerWidth, setFooterWidth] = useState(initialTemplate?.headerConfig?.footerConfig?.width ?? 800);
  const [footerHeight, setFooterHeight] = useState(initialTemplate?.headerConfig?.footerConfig?.height ?? 120);
  const [footerBackground, setFooterBackground] = useState(initialTemplate?.headerConfig?.footerConfig?.backgroundColor ?? '#111827');
  const [footerBackgroundImage, setFooterBackgroundImage] = useState<string | undefined>(initialTemplate?.headerConfig?.footerConfig?.backgroundImage);
  const [footerBackgroundFit, setFooterBackgroundFit] = useState<'cover'|'contain'>(initialTemplate?.headerConfig?.footerConfig?.backgroundFit ?? 'cover');
  const [customFields, setCustomFields] = useState<CustomField[]>((initialTemplate?.fields as CustomField[]) ?? []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedEl = headerElements.find(e => e.id === selectedId) ?? footerElements.find(e => e.id === selectedId) ?? null;
  const [currentSection, setCurrentSection] = useState<SectionType>('header');
  // fontSearchQuery moved to PropertiesPanel (local state)
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const headerRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const headerBgInputRef = useRef<HTMLInputElement>(null);
  const footerBgInputRef = useRef<HTMLInputElement>(null);
  const [pendingLogoId, setPendingLogoId] = useState<string | null>(null);

  const dragRef = useRef<{ elId: string; area: 'header'|'footer'; startMouseX: number; startMouseY: number; elStartX: number; elStartY: number; } | null>(null);

  const onElMouseDown = useCallback((e: React.MouseEvent, elId: string, area: 'header'|'footer') => {
    e.stopPropagation(); e.preventDefault();
    setSelectedId(elId);
    const el = area === 'header' ? headerElements.find(x => x.id === elId) : footerElements.find(x => x.id === elId);
    if (!el) return;
    dragRef.current = { elId, area, startMouseX: e.clientX, startMouseY: e.clientY, elStartX: el.x, elStartY: el.y };
  }, [footerElements, headerElements]);

  const moveElement = useCallback((area: 'header'|'footer', e: React.MouseEvent) => {
    if (!dragRef.current || dragRef.current.area !== area) return;
    const { elId, startMouseX, startMouseY, elStartX, elStartY } = dragRef.current;
    const elements = area === 'header' ? headerElements : footerElements;
    const el = elements.find(x => x.id === elId);
    if (!el) return;
    const dx = e.clientX - startMouseX, dy = e.clientY - startMouseY;
    const w = area === 'header' ? headerWidth : footerWidth, h = area === 'header' ? headerHeight : footerHeight;
    const nx = clamp(elStartX + dx, 0, Math.max(0, w - el.width));
    const ny = clamp(elStartY + dy, 0, Math.max(0, h - el.height));
    (area === 'header' ? setHeaderElements : setFooterElements)(prev => prev.map(item => item.id === elId ? { ...item, x: nx, y: ny } : item));
  }, [footerElements, headerElements, footerHeight, footerWidth, headerHeight, headerWidth]);

  const onHeaderMouseMove = useCallback((e: React.MouseEvent) => { if (headerRef.current) moveElement('header', e); }, [moveElement]);
  const onFooterMouseMove = useCallback((e: React.MouseEvent) => { if (footerRef.current) moveElement('footer', e); }, [moveElement]);
  const onMouseUp = useCallback(() => { dragRef.current = null; }, []);

  const addLogo = () => { const el: HeaderElement = { id: uid(), type: 'logo', x: 10, y: 10, width: 80, height: 80, imageUrl: '' }; setHeaderElements(p => [...p, el]); setSelectedId(el.id); };
  const addText = () => { const el: HeaderElement = { id: uid(), type: 'text', x: 10, y: 10, width: 200, height: 40, content: 'Header Text', fontSize: 20, color: '#ffffff', fontFamily: 'Inter', alignment: 'center' }; setHeaderElements(p => [...p, el]); setSelectedId(el.id); };
  const addFooterLogo = () => { const el: FooterElement = { id: uid(), type: 'logo', x: 10, y: 10, width: 60, height: 60, imageUrl: '' }; setFooterElements(p => [...p, el]); setSelectedId(el.id); };
  const addFooterText = () => { const el: FooterElement = { id: uid(), type: 'text', x: 10, y: 10, width: 220, height: 40, content: 'Footer Text', fontSize: 16, color: '#ffffff', fontFamily: 'Inter', alignment: 'center' }; setFooterElements(p => [...p, el]); setSelectedId(el.id); };
  const addFooterLinkedin = () => { const el: FooterElement = { id: uid(), type: 'linkedin', x: 10, y: 10, width: 40, height: 40 }; setFooterElements(p => [...p, el]); setSelectedId(el.id); };
  const addFooterInstagram = () => { const el: FooterElement = { id: uid(), type: 'instagram', x: 60, y: 10, width: 40, height: 40 }; setFooterElements(p => [...p, el]); setSelectedId(el.id); };

  const updateEl = useCallback((id: string, patch: Partial<HeaderElement>) => {
    setHeaderElements(p => p.map(el => el.id === id ? { ...el, ...patch } as HeaderElement : el));
    setFooterElements(p => p.map(el => el.id === id ? { ...el, ...patch } as FooterElement : el));
  }, []);
  const bringToFront = useCallback((id: string) => {
    setHeaderElements(p => {
      const idx = p.findIndex(el => el.id === id);
      if (idx === -1) return p;
      const el = p[idx];
      const others = p.filter(item => item.id !== id);
      return [...others, el];
    });
    setFooterElements(p => {
      const idx = p.findIndex(el => el.id === id);
      if (idx === -1) return p;
      const el = p[idx];
      const others = p.filter(item => item.id !== id);
      return [...others, el];
    });
  }, []);
  const sendToBack = useCallback((id: string) => {
    setHeaderElements(p => {
      const idx = p.findIndex(el => el.id === id);
      if (idx === -1) return p;
      const el = p[idx];
      const others = p.filter(item => item.id !== id);
      return [el, ...others];
    });
    setFooterElements(p => {
      const idx = p.findIndex(el => el.id === id);
      if (idx === -1) return p;
      const el = p[idx];
      const others = p.filter(item => item.id !== id);
      return [el, ...others];
    });
  }, []);

  const getLayerInfo = useCallback((id: string) => {
    const hIdx = headerElements.findIndex(e => e.id === id);
    if (hIdx !== -1) return { index: hIdx, total: headerElements.length };
    const fIdx = footerElements.findIndex(e => e.id === id);
    if (fIdx !== -1) return { index: fIdx, total: footerElements.length };
    return null;
  }, [footerElements, headerElements]);
  const deleteEl = (id: string) => {
    setHeaderElements(p => p.filter(el => el.id !== id));
    setFooterElements(p => p.filter(el => el.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !pendingLogoId) return;
    const reader = new FileReader();
    reader.onload = ev => { updateEl(pendingLogoId, { imageUrl: ev.target?.result as string }); };
    reader.readAsDataURL(file); e.target.value = '';
  };
  const handleHeaderBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setHeaderBackgroundImage(ev.target?.result as string);
    reader.readAsDataURL(file); e.target.value = '';
  };
  const handleFooterBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setFooterBackgroundImage(ev.target?.result as string);
    reader.readAsDataURL(file); e.target.value = '';
  };

  const addCustomField = () => { const f: CustomField = { id: uid(), label: 'New Field', type: 'text', required: false }; setCustomFields(p => [...p, f]); };
  const updateField = (id: string, patch: Partial<CustomField>) => setCustomFields(p => p.map(f => f.id === id ? { ...f, ...patch } : f));
  const deleteField = (id: string) => setCustomFields(p => p.filter(f => f.id !== id));

  const save = async () => {
    const trimmed = formName.trim();
    if (!trimmed) { setNameError('Template name is required'); return; }
    if (trimmed.length < 3) { setNameError('Name must be at least 3 characters'); return; }
    setNameError(''); setSaving(true); setSaveMsg('');
    try {
      const body = { type: 'form', name: trimmed, fields: customFields, headerConfig: { headerElements, headerWidth, headerHeight, headerBackground, headerBackgroundImage, headerBackgroundFit, footerText, footerSocials, footerConfig: { footerElements, width: footerWidth, height: footerHeight, backgroundColor: footerBackground, backgroundImage: footerBackgroundImage, backgroundFit: footerBackgroundFit } }, ...(initialTemplate ? { id: initialTemplate.id } : {}) };
      const res = await fetch('/api/admin/templates', { method: initialTemplate ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Save failed');
      setSaveMsg('Template saved successfully'); onSaved();
    } catch { setSaveMsg('Failed to save template'); } finally { setSaving(false); }
  };


  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex flex-col no-theme-bg"
        style={{
          // Keep builder UI typography stable and independent from element font loading.
          fontFamily: 'var(--font-sans), ui-sans-serif, system-ui, sans-serif',
          background: 'radial-gradient(1200px 600px at 20% 0%, rgba(99,102,241,0.16), transparent 60%), radial-gradient(900px 500px at 90% 0%, rgba(168,85,247,0.14), transparent 55%), linear-gradient(135deg, #f8faff 0%, #f0f4ff 50%, #fafbff 100%)',
        }}
        initial={{ opacity: 0, filter: 'blur(6px)', scale: 0.99 }}
        animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
        exit={{ opacity: 0, filter: 'blur(6px)', scale: 0.99 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
      >

      {/* ── TOP TOOLBAR ── */}
      <motion.header
        className="h-16 bg-white/70 backdrop-blur-xl border-b border-gray-200/60 flex items-center justify-between px-3 sm:px-5 shrink-0"
        style={{ boxShadow: '0 1px 0 rgba(0,0,0,0.06)' }}
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        {/* Left: close + title */}
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onClose}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 text-xs font-semibold px-3 py-2 rounded-xl hover:bg-gray-100/80 active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-indigo-200">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
            Close
          </button>
          <div className="w-px h-7 bg-gray-200/80"/>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="white"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-800 leading-none">Form Template Builder</p>
              {formName && <p className="text-[10px] text-gray-400 mt-0.5 leading-none">{formName}</p>}
            </div>
          </div>
        </div>

        {/* Center: section switcher */}
        <div className="hidden sm:flex items-center gap-1 bg-gray-100/80 rounded-2xl p-1.5 border border-gray-200/60 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
          {(['header','body','footer'] as const).map(s => (
            <button key={s} onClick={() => setCurrentSection(s)}
              className={`px-5 py-2 rounded-xl text-xs font-bold capitalize transition-all focus:outline-none focus:ring-2 focus:ring-indigo-200 ${
                currentSection === s
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}>
              {s === 'header' ? '⬆ Header' : s === 'body' ? '📋 Body' : '⬇ Footer'}
            </button>
          ))}
        </div>

        {/* Right: save */}
        <div className="flex items-center gap-2.5">
          {saveMsg && (
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${saveMsg.includes('success') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
              {saveMsg.includes('success') ? '✓ Saved' : '✕ Failed'}
            </span>
          )}
          <button onClick={save} disabled={saving}
            className="flex items-center gap-2 text-white text-sm font-bold px-5 py-2.5 rounded-2xl disabled:opacity-60 transition-all hover:shadow-lg hover:-translate-y-px active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            style={{ background: saving ? '#9ca3af' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: saving ? 'none' : '0 10px 22px rgba(99,102,241,0.22)' }}>
            {saving ? (
              <><svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity=".25"/><path d="M21 12a9 9 0 01-9-9"/></svg>Saving…</>
            ) : (
              <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>Save Template</>
            )}
          </button>
        </div>
      </motion.header>

      {/* Mobile section switcher (sticky) */}
      <div className="sm:hidden sticky top-16 z-40 border-b border-gray-200/60 bg-white/70 backdrop-blur-xl">
        <div className="px-3 py-2 flex gap-2 overflow-x-auto">
          {(['header','body','footer'] as const).map(s => (
            <button
              key={s}
              onClick={() => setCurrentSection(s)}
              className={`shrink-0 px-4 py-2.5 rounded-2xl text-sm font-black transition-all focus:outline-none focus:ring-2 focus:ring-indigo-200 ${
                currentSection === s
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 border border-gray-200'
              }`}
            >
              {s === 'header' ? 'Header' : s === 'body' ? 'Body' : 'Footer'}
            </button>
          ))}
        </div>
      </div>

      {/* ── 3-PANEL BODY ── */}
      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">

        {/* LEFT SIDEBAR */}
        <motion.aside
          className="order-3 lg:order-1 w-full lg:w-72 bg-white/65 backdrop-blur-xl border-t lg:border-t-0 lg:border-b-0 lg:border-r border-gray-200/60 flex flex-col shrink-0 lg:overflow-y-auto"
          style={{ boxShadow: '1px 0 0 rgba(0,0,0,0.04)' }}
          initial={{ x: -14, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {/* Mobile: Quick Add (always visible) */}
          <div className="lg:hidden px-3 pt-3">
            <div className="bg-white/80 border border-gray-200/70 rounded-2xl p-3 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-black text-gray-800">Quick add</span>
                <span className="text-xs font-semibold text-gray-500 capitalize">{currentSection}</span>
              </div>
              {currentSection === 'header' && (
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={addLogo} className="px-3 py-3 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-800 font-black text-sm active:scale-[0.98] transition-all">
                    🖼 Logo
                  </button>
                  <button onClick={addText} className="px-3 py-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-black text-sm active:scale-[0.98] transition-all">
                    T Text
                  </button>
                </div>
              )}
              {currentSection === 'body' && (
                <button onClick={addCustomField} className="w-full px-3 py-3 rounded-2xl bg-indigo-600 text-white font-black text-sm active:scale-[0.98] transition-all">
                  + Add field
                </button>
              )}
              {currentSection === 'footer' && (
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={addFooterLogo} className="px-3 py-3 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-800 font-black text-sm active:scale-[0.98] transition-all">
                    🖼 Logo
                  </button>
                  <button onClick={addFooterText} className="px-3 py-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-black text-sm active:scale-[0.98] transition-all">
                    T Text
                  </button>
                  <button onClick={addFooterLinkedin} className="px-3 py-3 rounded-2xl bg-sky-50 border border-sky-200 text-sky-800 font-black text-sm active:scale-[0.98] transition-all">
                    💼 LinkedIn
                  </button>
                  <button onClick={addFooterInstagram} className="px-3 py-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 font-black text-sm active:scale-[0.98] transition-all">
                    📷 Instagram
                  </button>
                </div>
              )}
            </div>
          </div>

          <details className="lg:hidden border-b border-gray-200/60">
            <summary className="list-none px-4 py-3 flex items-center justify-between cursor-pointer select-none">
              <span className="text-sm font-black text-gray-800">Controls</span>
              <span className="text-xs font-bold text-gray-500">tap to expand</span>
            </summary>
            <div className="max-h-[55vh] overflow-y-auto">
              <LeftSidebar
                currentSection={currentSection}
                formName={formName} nameError={nameError}
                onNameChange={v => { setFormName(v); setNameError(''); }}
                headerElements={headerElements} footerElements={footerElements}
                selectedId={selectedId}
                onSelectEl={id => {
                  setSelectedId(id);
                  const isHeader = headerElements.some(e => e.id === id);
                  const isFooter = footerElements.some(e => e.id === id);
                  if (isHeader) setCurrentSection('header');
                  if (isFooter) setCurrentSection('footer');
                }}
                onDeleteEl={deleteEl}
                onAddLogo={addLogo} onAddText={addText}
                onAddFooterLogo={addFooterLogo} onAddFooterText={addFooterText}
                onAddFooterLinkedin={addFooterLinkedin} onAddFooterInstagram={addFooterInstagram}
                headerWidth={headerWidth} headerHeight={headerHeight}
                headerBackground={headerBackground} headerBackgroundImage={headerBackgroundImage} headerBackgroundFit={headerBackgroundFit}
                onHeaderWidthChange={setHeaderWidth} onHeaderHeightChange={setHeaderHeight}
                onHeaderBgChange={setHeaderBackground}
                onHeaderBgUpload={() => headerBgInputRef.current?.click()}
                onHeaderBgRemove={() => setHeaderBackgroundImage(undefined)}
                onHeaderBgFitChange={setHeaderBackgroundFit}
                footerWidth={footerWidth} footerHeight={footerHeight}
                footerBackground={footerBackground} footerBackgroundImage={footerBackgroundImage} footerBackgroundFit={footerBackgroundFit}
                onFooterWidthChange={setFooterWidth} onFooterHeightChange={setFooterHeight}
                onFooterBgChange={setFooterBackground}
                onFooterBgUpload={() => footerBgInputRef.current?.click()}
                onFooterBgRemove={() => setFooterBackgroundImage(undefined)}
                onFooterBgFitChange={setFooterBackgroundFit}
                footerText={footerText} footerSocials={footerSocials}
                onFooterTextChange={setFooterText} onFooterSocialsChange={setFooterSocials}
                customFields={customFields}
                onAddField={addCustomField} onUpdateField={updateField} onDeleteField={deleteField}
              />
            </div>
          </details>

          <div className="hidden lg:block h-full">
            <LeftSidebar
              currentSection={currentSection}
              formName={formName} nameError={nameError}
              onNameChange={v => { setFormName(v); setNameError(''); }}
              headerElements={headerElements} footerElements={footerElements}
              selectedId={selectedId}
              onSelectEl={id => {
                setSelectedId(id);
                const isHeader = headerElements.some(e => e.id === id);
                const isFooter = footerElements.some(e => e.id === id);
                if (isHeader) setCurrentSection('header');
                if (isFooter) setCurrentSection('footer');
              }}
              onDeleteEl={deleteEl}
              onAddLogo={addLogo} onAddText={addText}
              onAddFooterLogo={addFooterLogo} onAddFooterText={addFooterText}
              onAddFooterLinkedin={addFooterLinkedin} onAddFooterInstagram={addFooterInstagram}
              headerWidth={headerWidth} headerHeight={headerHeight}
              headerBackground={headerBackground} headerBackgroundImage={headerBackgroundImage} headerBackgroundFit={headerBackgroundFit}
              onHeaderWidthChange={setHeaderWidth} onHeaderHeightChange={setHeaderHeight}
              onHeaderBgChange={setHeaderBackground}
              onHeaderBgUpload={() => headerBgInputRef.current?.click()}
              onHeaderBgRemove={() => setHeaderBackgroundImage(undefined)}
              onHeaderBgFitChange={setHeaderBackgroundFit}
              footerWidth={footerWidth} footerHeight={footerHeight}
              footerBackground={footerBackground} footerBackgroundImage={footerBackgroundImage} footerBackgroundFit={footerBackgroundFit}
              onFooterWidthChange={setFooterWidth} onFooterHeightChange={setFooterHeight}
              onFooterBgChange={setFooterBackground}
              onFooterBgUpload={() => footerBgInputRef.current?.click()}
              onFooterBgRemove={() => setFooterBackgroundImage(undefined)}
              onFooterBgFitChange={setFooterBackgroundFit}
              footerText={footerText} footerSocials={footerSocials}
              onFooterTextChange={setFooterText} onFooterSocialsChange={setFooterSocials}
              customFields={customFields}
              onAddField={addCustomField} onUpdateField={updateField} onDeleteField={deleteField}
            />
          </div>
        </motion.aside>

        {/* CENTER CANVAS */}
        <motion.main
          className="order-1 lg:order-2 flex-1 flex flex-col items-center justify-start overflow-auto p-4 sm:p-6 lg:p-8 gap-6"
          style={{
            background:
              'radial-gradient(900px 420px at 50% 0%, rgba(99,102,241,0.11) 0%, transparent 60%), radial-gradient(700px 360px at 20% 15%, rgba(16,185,129,0.06) 0%, transparent 60%), linear-gradient(180deg, #f0f4ff 0%, #f8faff 100%)',
          }}
          onMouseMove={e => { onHeaderMouseMove(e); onFooterMouseMove(e); }}
          onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
          <Canvas
            currentSection={currentSection}
            headerRef={headerRef} footerRef={footerRef}
            headerElements={headerElements} footerElements={footerElements}
            headerWidth={headerWidth} headerHeight={headerHeight}
            footerWidth={footerWidth} footerHeight={footerHeight}
            headerBackground={headerBackground} headerBackgroundImage={headerBackgroundImage} headerBackgroundFit={headerBackgroundFit}
            footerBackground={footerBackground} footerBackgroundImage={footerBackgroundImage} footerBackgroundFit={footerBackgroundFit}
            selectedId={selectedId}
            onSelectEl={id => setSelectedId(id)}
            onDeselect={() => setSelectedId(null)}
            onElMouseDown={onElMouseDown}
            onDeleteEl={deleteEl}
            customFields={customFields}
          />

          {/* Mobile sticky quick add dock (keeps add actions near canvas) */}
          <div className="sm:hidden sticky bottom-3 z-30 w-full max-w-lg">
            <div className="mx-auto bg-white/90 backdrop-blur-xl border border-gray-200 rounded-2xl shadow-lg p-2">
              <div className="text-[11px] font-black text-gray-600 px-2 pb-1">Quick Add ({currentSection})</div>
              <div className="grid grid-cols-2 gap-2">
                {currentSection === 'header' && (
                  <>
                    <button onClick={addLogo} className="px-3 py-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 font-black text-sm active:scale-[0.98] transition-all">🖼 Logo</button>
                    <button onClick={addText} className="px-3 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-black text-sm active:scale-[0.98] transition-all">T Text</button>
                  </>
                )}
                {currentSection === 'body' && (
                  <button onClick={addCustomField} className="col-span-2 px-3 py-3 rounded-xl bg-indigo-600 text-white font-black text-sm active:scale-[0.98] transition-all">+ Add field</button>
                )}
                {currentSection === 'footer' && (
                  <>
                    <button onClick={addFooterLogo} className="px-3 py-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-800 font-black text-sm active:scale-[0.98] transition-all">🖼 Logo</button>
                    <button onClick={addFooterText} className="px-3 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-black text-sm active:scale-[0.98] transition-all">T Text</button>
                    <button onClick={addFooterLinkedin} className="px-3 py-3 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 font-black text-sm active:scale-[0.98] transition-all">💼 LinkedIn</button>
                    <button onClick={addFooterInstagram} className="px-3 py-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-black text-sm active:scale-[0.98] transition-all">📷 Instagram</button>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.main>

        {/* RIGHT SIDEBAR */}
        <motion.aside
          className="order-2 lg:order-3 w-full lg:w-[22rem] bg-white/65 backdrop-blur-xl border-t lg:border-t-0 lg:border-l border-gray-200/60 flex flex-col shrink-0 lg:overflow-y-auto"
          style={{ boxShadow: '-1px 0 0 rgba(0,0,0,0.04)' }}
          initial={{ x: 14, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <details className="lg:hidden" open>
            <summary className="list-none px-4 py-3 flex items-center justify-between cursor-pointer select-none border-b border-gray-200/60">
              <span className="text-sm font-black text-gray-800">{selectedEl ? 'Properties' : 'Preview'}</span>
              <span className="text-xs font-bold text-gray-500">tap to collapse</span>
            </summary>
            <div className="max-h-[55vh] overflow-y-auto">
              <AnimatePresence mode="popLayout" initial={false}>
                {selectedEl ? (
                  <motion.div
                    key="props-mobile"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.14, ease: 'easeOut' }}
                    className="h-full"
                  >
                    <PropertiesPanel
                      selectedEl={selectedEl} onUpdateEl={updateEl}
                      onUploadLogo={id => { setPendingLogoId(id); logoInputRef.current?.click(); }}
                      onDeselect={() => setSelectedId(null)}
                      onBringToFront={bringToFront}
                      onSendToBack={sendToBack}
                      getLayerInfo={getLayerInfo}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="preview-mobile"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.14, ease: 'easeOut' }}
                    className="h-full"
                  >
                    <LivePreview
                      formName={formName}
                      headerElements={headerElements} footerElements={footerElements}
                      headerWidth={headerWidth} headerHeight={headerHeight}
                      footerWidth={footerWidth} footerHeight={footerHeight}
                      headerBackground={headerBackground} headerBackgroundImage={headerBackgroundImage} headerBackgroundFit={headerBackgroundFit}
                      footerBackground={footerBackground} footerBackgroundImage={footerBackgroundImage} footerBackgroundFit={footerBackgroundFit}
                      footerText={footerText} footerSocials={footerSocials} customFields={customFields}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </details>

          <div className="hidden lg:flex flex-col h-full">
          <AnimatePresence mode="popLayout" initial={false}>
            {selectedEl ? (
              <motion.div
                key="props"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.14, ease: 'easeOut' }}
                className="h-full"
              >
                <PropertiesPanel
                  selectedEl={selectedEl} onUpdateEl={updateEl}
                  onUploadLogo={id => { setPendingLogoId(id); logoInputRef.current?.click(); }}
                  onDeselect={() => setSelectedId(null)}
                  onBringToFront={bringToFront}
                  onSendToBack={sendToBack}
                  getLayerInfo={getLayerInfo}
                />
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.14, ease: 'easeOut' }}
                className="h-full"
              >
                <LivePreview
                  formName={formName}
                  headerElements={headerElements} footerElements={footerElements}
                  headerWidth={headerWidth} headerHeight={headerHeight}
                  footerWidth={footerWidth} footerHeight={footerHeight}
                  headerBackground={headerBackground} headerBackgroundImage={headerBackgroundImage} headerBackgroundFit={headerBackgroundFit}
                  footerBackground={footerBackground} footerBackgroundImage={footerBackgroundImage} footerBackgroundFit={footerBackgroundFit}
                  footerText={footerText} footerSocials={footerSocials} customFields={customFields}
                />
              </motion.div>
            )}
          </AnimatePresence>
          </div>
        </motion.aside>
      </div>

      <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/svg+xml" className="hidden" onChange={handleLogoUpload} />
      <input ref={headerBgInputRef} type="file" accept="image/png,image/jpeg,image/svg+xml" className="hidden" onChange={handleHeaderBgUpload} />
      <input ref={footerBgInputRef} type="file" accept="image/png,image/jpeg,image/svg+xml" className="hidden" onChange={handleFooterBgUpload} />
      </motion.div>
    </AnimatePresence>
  );
}





// ─── LEFT SIDEBAR ─────────────────────────────────────────────────────────────
interface LeftSidebarProps {
  currentSection: SectionType;
  formName: string; nameError: string; onNameChange: (v: string) => void;
  headerElements: HeaderElement[]; footerElements: FooterElement[];
  selectedId: string | null;
  onSelectEl: (id: string) => void; onDeleteEl: (id: string) => void;
  onAddLogo: () => void; onAddText: () => void;
  onAddFooterLogo: () => void; onAddFooterText: () => void;
  onAddFooterLinkedin: () => void; onAddFooterInstagram: () => void;
  headerWidth: number; headerHeight: number;
  headerBackground: string; headerBackgroundImage?: string; headerBackgroundFit: 'cover'|'contain';
  onHeaderWidthChange: (v: number) => void; onHeaderHeightChange: (v: number) => void;
  onHeaderBgChange: (v: string) => void; onHeaderBgUpload: () => void;
  onHeaderBgRemove: () => void; onHeaderBgFitChange: (v: 'cover'|'contain') => void;
  footerWidth: number; footerHeight: number;
  footerBackground: string; footerBackgroundImage?: string; footerBackgroundFit: 'cover'|'contain';
  onFooterWidthChange: (v: number) => void; onFooterHeightChange: (v: number) => void;
  onFooterBgChange: (v: string) => void; onFooterBgUpload: () => void;
  onFooterBgRemove: () => void; onFooterBgFitChange: (v: 'cover'|'contain') => void;
  footerText: string; footerSocials: string;
  onFooterTextChange: (v: string) => void; onFooterSocialsChange: (v: string) => void;
  customFields: CustomField[];
  onAddField: () => void; onUpdateField: (id: string, p: Partial<CustomField>) => void; onDeleteField: (id: string) => void;
}

function LeftSidebar(p: LeftSidebarProps) {
  const inp = "w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm lg:text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all";
  const label = "block text-[11px] lg:text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1";
  const section = "space-y-3";
  const divider = "border-t border-gray-100 pt-3";

  return (
    <div className="h-full flex flex-col">
      {/* Template name */}
      <div className="p-4 border-b border-gray-100/80 sticky top-0 bg-white/60 backdrop-blur-xl z-10">
        <label className={label}>Template Name</label>
        <input className={`${inp} ${p.nameError ? 'border-red-400 ring-1 ring-red-300' : ''}`}
          value={p.formName} onChange={e => p.onNameChange(e.target.value)} placeholder="My Form Template" />
        {p.nameError && <p className="text-red-500 text-[10px] mt-1">{p.nameError}</p>}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* HEADER SECTION */}
        {p.currentSection === 'header' && (
          <>
            <div className={section}>
              <p className={label}>Canvas Size</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-gray-400 mb-0.5 block">Width</span>
                  <input type="number" min={200} max={1400} className={inp} value={p.headerWidth} onChange={e => p.onHeaderWidthChange(Number(e.target.value))} />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 mb-0.5 block">Height</span>
                  <input type="number" min={60} max={400} className={inp} value={p.headerHeight} onChange={e => p.onHeaderHeightChange(Number(e.target.value))} />
                </div>
              </div>
            </div>

            <div className={`${section} ${divider}`}>
              <p className={label}>Background</p>
              <div className="flex items-center gap-2">
                <input type="color" className="w-9 h-9 rounded-lg cursor-pointer border border-gray-200 p-0.5" value={p.headerBackground} onChange={e => p.onHeaderBgChange(e.target.value)} />
                <input type="text" className={`${inp} flex-1`} value={p.headerBackground} onChange={e => p.onHeaderBgChange(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <button onClick={p.onHeaderBgUpload} className="flex-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg font-medium transition-colors">
                  {p.headerBackgroundImage ? '↑ Replace BG' : '↑ Upload BG'}
                </button>
                {p.headerBackgroundImage && (
                  <button onClick={p.onHeaderBgRemove} className="text-xs text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg border border-red-200 transition-colors">Remove</button>
                )}
              </div>
              {p.headerBackgroundImage && (
                <select className={inp} value={p.headerBackgroundFit} onChange={e => p.onHeaderBgFitChange(e.target.value as 'cover'|'contain')}>
                  <option value="cover">Cover</option>
                  <option value="contain">Contain</option>
                </select>
              )}
            </div>

            <div className={`${section} ${divider}`}>
              <p className={label}>Add Elements</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={p.onAddLogo} className="flex items-center justify-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs px-3 py-3 rounded-xl font-semibold transition-all border border-indigo-200 hover:-translate-y-px active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-indigo-200">
                  <span>🖼</span> Logo
                </button>
                <button onClick={p.onAddText} className="flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs px-3 py-3 rounded-xl font-semibold transition-all border border-emerald-200 hover:-translate-y-px active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-emerald-200">
                  <span>T</span> Text
                </button>
              </div>
            </div>

            {p.headerElements.length > 0 && (
              <div className={`${section} ${divider}`}>
                <p className={label}>Layers ({p.headerElements.length})</p>
                <div className="space-y-1">
                  {[...p.headerElements].reverse().map(el => (
                    <div key={el.id} onClick={() => p.onSelectEl(el.id)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs transition-all duration-150 hover:scale-[1.01] focus-within:ring-2 focus-within:ring-indigo-200 ${p.selectedId === el.id ? 'bg-indigo-100 text-indigo-800 border border-indigo-300 shadow-sm' : 'bg-gray-50/80 text-gray-700 hover:bg-gray-100 border border-transparent'}`}>
                      <span className="flex items-center gap-2">
                        <span>{el.type === 'logo' ? '🖼' : el.type === 'linkedin' ? '💼' : el.type === 'instagram' ? '📷' : 'T'}</span>
                        <span className="truncate max-w-[100px]">{el.type === 'text' ? el.content?.slice(0,18) || 'Text' : el.type}</span>
                      </span>
                      <button onClick={e => { e.stopPropagation(); p.onDeleteEl(el.id); }} className="text-gray-400 hover:text-red-500 transition-colors ml-1 px-2 py-1 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200">✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* BODY SECTION */}
        {p.currentSection === 'body' && (
          <>
            <div className={section}>
              <div className="flex items-center justify-between">
                <p className={label}>Custom Fields</p>
                <button onClick={p.onAddField} className="text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-semibold transition-all hover:-translate-y-px active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-indigo-200">+ Add</button>
              </div>
              {p.customFields.length === 0 && (
                <div className="text-center py-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <p className="text-xs text-gray-400">No custom fields yet</p>
                  <p className="text-[10px] text-gray-300 mt-1">Click + Add to create one</p>
                </div>
              )}
              <div className="space-y-2">
                {p.customFields.map(f => (
                  <div key={f.id} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <input type="text" className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        value={f.label} onChange={e => p.onUpdateField(f.id, { label: e.target.value })} placeholder="Field label" />
                      <button onClick={() => p.onDeleteField(f.id)} className="text-gray-400 hover:text-red-500 transition-colors shrink-0">✕</button>
                    </div>
                    <div className="flex items-center gap-2">
                      <select className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        value={f.type} onChange={e => p.onUpdateField(f.id, { type: e.target.value as CustomField['type'] })}>
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="date">Date</option>
                        <option value="select">Select</option>
                      </select>
                      <label className="flex items-center gap-1.5 text-[10px] text-gray-700 font-medium cursor-pointer whitespace-nowrap select-none">
                        <input type="checkbox" checked={f.required} onChange={e => p.onUpdateField(f.id, { required: e.target.checked })} className="accent-indigo-600 w-3 h-3" />
                        Required
                      </label>
                    </div>
                    {f.type === 'select' && (
                      <input type="text" className="w-full mt-2 text-xs bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        value={f.options ?? ''} onChange={e => p.onUpdateField(f.id, { options: e.target.value })} placeholder="opt1, opt2, opt3" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className={`${section} ${divider}`}>
              <p className={label}>Static Fields (Fixed)</p>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-1.5">
                {['Full Name *', 'Email Address *', 'Phone Number *', 'Screenshot Upload *'].map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs text-blue-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                    {f}
                  </div>
                ))}
                <p className="text-[10px] text-blue-400 mt-2">These fields cannot be removed.</p>
              </div>
            </div>
          </>
        )}

        {/* FOOTER SECTION */}
        {p.currentSection === 'footer' && (
          <>
            <div className={section}>
              <p className={label}>Canvas Size</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-gray-400 mb-0.5 block">Width</span>
                  <input type="number" min={200} max={1400} className={inp} value={p.footerWidth} onChange={e => p.onFooterWidthChange(Number(e.target.value))} />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 mb-0.5 block">Height</span>
                  <input type="number" min={60} max={240} className={inp} value={p.footerHeight} onChange={e => p.onFooterHeightChange(Number(e.target.value))} />
                </div>
              </div>
            </div>

            <div className={`${section} ${divider}`}>
              <p className={label}>Background</p>
              <div className="flex items-center gap-2">
                <input type="color" className="w-9 h-9 rounded-lg cursor-pointer border border-gray-200 p-0.5" value={p.footerBackground} onChange={e => p.onFooterBgChange(e.target.value)} />
                <input type="text" className={`${inp} flex-1`} value={p.footerBackground} onChange={e => p.onFooterBgChange(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <button onClick={p.onFooterBgUpload} className="flex-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg font-medium transition-colors">
                  {p.footerBackgroundImage ? '↑ Replace BG' : '↑ Upload BG'}
                </button>
                {p.footerBackgroundImage && (
                  <button onClick={p.onFooterBgRemove} className="text-xs text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg border border-red-200 transition-colors">Remove</button>
                )}
              </div>
            </div>

            <div className={`${section} ${divider}`}>
              <p className={label}>Add Elements</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: '🖼 Logo', action: p.onAddFooterLogo, cls: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200' },
                  { label: 'T Text', action: p.onAddFooterText, cls: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200' },
                  { label: '💼 LinkedIn', action: p.onAddFooterLinkedin, cls: 'bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200' },
                  { label: '📷 Instagram', action: p.onAddFooterInstagram, cls: 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200' },
                ].map(btn => (
                  <button key={btn.label} onClick={btn.action} className={`flex items-center justify-center gap-1 text-xs px-2 py-3 rounded-xl font-semibold transition-all border hover:-translate-y-px active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-indigo-100 ${btn.cls}`}>
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={`${section} ${divider}`}>
              <p className={label}>Footer Text</p>
              <input type="text" className={inp} value={p.footerText} onChange={e => p.onFooterTextChange(e.target.value)} placeholder="© 2024 Your Organization" />
              <p className={`${label} mt-2`}>Social Links</p>
              <input type="text" className={inp} value={p.footerSocials} onChange={e => p.onFooterSocialsChange(e.target.value)} placeholder="https://twitter.com/..." />
            </div>

            {p.footerElements.length > 0 && (
              <div className={`${section} ${divider}`}>
                <p className={label}>Layers ({p.footerElements.length})</p>
                <div className="space-y-1">
                  {[...p.footerElements].reverse().map(el => (
                    <div key={el.id} onClick={() => p.onSelectEl(el.id)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-xs transition-all duration-150 hover:scale-[1.01] focus-within:ring-2 focus-within:ring-indigo-200 ${p.selectedId === el.id ? 'bg-indigo-100 text-indigo-800 border border-indigo-300 shadow-sm' : 'bg-gray-50/80 text-gray-700 hover:bg-gray-100 border border-transparent'}`}>
                      <span className="flex items-center gap-2">
                        <span>{el.type === 'logo' ? '🖼' : el.type === 'linkedin' ? '💼' : el.type === 'instagram' ? '📷' : 'T'}</span>
                        <span className="truncate max-w-[100px]">{el.type === 'text' ? el.content?.slice(0,18) || 'Text' : el.type}</span>
                      </span>
                      <button onClick={e => { e.stopPropagation(); p.onDeleteEl(el.id); }} className="text-gray-400 hover:text-red-500 transition-colors ml-1 px-2 py-1 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200">✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}


// ─── CANVAS (Center Panel) ────────────────────────────────────────────────────
interface CanvasProps {
  currentSection: SectionType;
  headerRef: React.RefObject<HTMLDivElement | null>;
  footerRef: React.RefObject<HTMLDivElement | null>;
  headerElements: HeaderElement[]; footerElements: FooterElement[];
  headerWidth: number; headerHeight: number;
  footerWidth: number; footerHeight: number;
  headerBackground: string; headerBackgroundImage?: string; headerBackgroundFit: 'cover'|'contain';
  footerBackground: string; footerBackgroundImage?: string; footerBackgroundFit: 'cover'|'contain';
  selectedId: string | null;
  onSelectEl: (id: string | null) => void;
  onDeselect: () => void;
  onElMouseDown: (e: React.MouseEvent, id: string, area: 'header'|'footer') => void;
  onDeleteEl: (id: string) => void;
  customFields: CustomField[];
}

function Canvas(p: CanvasProps) {
  const renderEl = (el: HeaderElement | FooterElement, area: 'header'|'footer') => (
    <div key={el.id}
      onMouseDown={e => { e.stopPropagation(); p.onElMouseDown(e, el.id, area); }}
      onClick={e => { e.stopPropagation(); p.onSelectEl(el.id); }}
      style={{ position:'absolute', left:el.x, top:el.y, width:el.width, height:el.height,
        cursor:'grab', userSelect:'none', boxSizing:'border-box',
        outline: p.selectedId === el.id ? '2px solid #6366f1' : '1px dashed rgba(99,102,241,0.25)',
        outlineOffset: 2, borderRadius: 4,
        transition: 'outline 0.15s ease, box-shadow 0.15s ease',
        boxShadow: p.selectedId === el.id ? '0 0 0 4px rgba(99,102,241,0.15)' : 'none',
        transition: 'outline 0.12s ease, box-shadow 0.12s ease' }}>
      {el.type === 'text' ? (
        <span style={{ display: 'block', width: '100%', fontSize:el.fontSize??16, color:el.color??'#fff', fontFamily: toCssFontFamily(el.fontFamily), textAlign: el.alignment ?? 'center', whiteSpace:'nowrap', pointerEvents:'none', lineHeight:1.2 }}>
          {el.content??''}
        </span>
      ) : el.type === 'linkedin' ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="#0077b5"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
      ) : el.type === 'instagram' ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="url(#ig)"><defs><linearGradient id="ig" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#f09433"/><stop offset="50%" stopColor="#dc2743"/><stop offset="100%" stopColor="#bc1888"/></linearGradient></defs><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
      ) : el.imageUrl ? (
        <img src={el.imageUrl} alt="logo" style={{ width:'100%', height:'100%', objectFit:'contain', pointerEvents:'none' }} />
      ) : (
        <div style={{ width:'100%', height:'100%', border:'2px dashed rgba(99,102,241,0.4)', borderRadius:4, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
          <span style={{ color:'rgba(99,102,241,0.6)', fontSize:11 }}>🖼 Logo</span>
        </div>
      )}
      {p.selectedId === el.id && (
        <div style={{ position:'absolute', inset:-6, border:'2px solid #6366f1', borderRadius:6, pointerEvents:'none' }}>
          {[[-6,-6],[-6,'50%'],[-6,'calc(100% + 2px)'],['50%',-6],['50%','calc(100% + 2px)'],['calc(100% + 2px)',-6],['calc(100% + 2px)','50%'],['calc(100% + 2px)','calc(100% + 2px)']].map(([t,l],i)=>(
            <div key={i} style={{ position:'absolute', top:t as any, left:l as any, width:8, height:8, background:'#6366f1', borderRadius:2, transform:'translate(-50%,-50%)' }} />
          ))}
        </div>
      )}
    </div>
  );

  const sectionLabel = (txt: string) => (
    <div className="flex items-center gap-2 mb-3">
      <div className="h-px flex-1 bg-gray-300/80" />
      <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-2">{txt}</span>
      <div className="h-px flex-1 bg-gray-300/80" />
    </div>
  );

  if (p.currentSection === 'header') return (
    <div className="flex flex-col items-center w-full">
      {sectionLabel('Header Canvas')}
      <div ref={p.headerRef}
        style={{ width:p.headerWidth, height:p.headerHeight, position:'relative', overflow:'hidden',
          background: p.headerBackgroundImage ? `url('${p.headerBackgroundImage}') center/${p.headerBackgroundFit} no-repeat` : p.headerBackground,
          borderRadius:12, boxShadow:'0 4px 24px rgba(0,0,0,0.12)', cursor:'default', flexShrink:0 }}
        onClick={e => { if (e.target === e.currentTarget) p.onDeselect(); }}>
        {p.headerElements.length === 0 && (
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
            <span style={{ color:'rgba(255,255,255,0.4)', fontSize:13 }}>Click + to add elements →</span>
          </div>
        )}
        {p.headerElements.map(el => renderEl(el, 'header'))}
        <div style={{ position:'absolute', bottom:6, right:10, fontSize:10, color:'rgba(255,255,255,0.3)', pointerEvents:'none' }}>{p.headerWidth}×{p.headerHeight}</div>
      </div>
      <p className="text-xs text-gray-400 mt-3">Drag elements to reposition • Click to select</p>

      {/* Layers (vertical, 2 columns: media/icons + text) */}
      {p.headerElements.length > 0 && (
        <div className="w-full max-w-2xl mt-4">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/70 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50/80 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3H8L2 7h20l-6-4z"/></svg>
                <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Layers</span>
              </div>
              <span className="text-[10px] font-semibold text-gray-500 tabular-nums">{p.headerElements.length}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3">
              {/* Column 1: Logos / Icons */}
              <div className="min-w-0">
                <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-2 py-1">Logos</div>
                <div className="space-y-1">
                  {p.headerElements.filter(e => e.type !== 'text').map(el => (
                    <div
                      key={el.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => p.onSelectEl(el.id)}
                      onKeyDown={e => e.key === 'Enter' && p.onSelectEl(el.id)}
                      className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                        p.selectedId === el.id
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-300 shadow-sm'
                          : 'bg-gray-50/80 text-gray-700 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="shrink-0">{el.type === 'logo' ? '🖼' : el.type === 'linkedin' ? '💼' : '📷'}</span>
                        <span className="truncate">{el.type === 'logo' ? 'Logo' : el.type === 'linkedin' ? 'LinkedIn' : 'Instagram'}</span>
                      </span>
                      <button
                        onClick={e => { e.stopPropagation(); p.onDeleteEl(el.id); }}
                        className="shrink-0 text-gray-400 hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50 transition-all"
                        aria-label="Delete layer"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {p.headerElements.filter(e => e.type !== 'text').length === 0 && (
                    <div className="text-[11px] text-gray-500 px-3 py-2 bg-gray-50/60 border border-dashed border-gray-200 rounded-xl">
                      No logos
                    </div>
                  )}
                </div>
              </div>

              {/* Column 2: Text */}
              <div className="min-w-0">
                <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-2 py-1">Text</div>
                <div className="space-y-1">
                  {p.headerElements.filter(e => e.type === 'text').map(el => (
                    <div
                      key={el.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => p.onSelectEl(el.id)}
                      onKeyDown={e => e.key === 'Enter' && p.onSelectEl(el.id)}
                      className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                        p.selectedId === el.id
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-300 shadow-sm'
                          : 'bg-gray-50/80 text-gray-700 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="shrink-0">T</span>
                        <span className="truncate">{(el.content ?? 'Text').slice(0, 28)}</span>
                      </span>
                      <button
                        onClick={e => { e.stopPropagation(); p.onDeleteEl(el.id); }}
                        className="shrink-0 text-gray-400 hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50 transition-all"
                        aria-label="Delete layer"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {p.headerElements.filter(e => e.type === 'text').length === 0 && (
                    <div className="text-[11px] text-gray-500 px-3 py-2 bg-gray-50/60 border border-dashed border-gray-200 rounded-xl">
                      No text
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (p.currentSection === 'footer') return (
    <div className="flex flex-col items-center w-full">
      {sectionLabel('Footer Canvas')}
      <div ref={p.footerRef}
        style={{ width:p.footerWidth, height:p.footerHeight, position:'relative', overflow:'hidden',
          background: p.footerBackgroundImage ? `url('${p.footerBackgroundImage}') center/${p.footerBackgroundFit} no-repeat` : p.footerBackground,
          borderRadius:12, boxShadow:'0 4px 24px rgba(0,0,0,0.12)', cursor:'default', flexShrink:0 }}
        onClick={e => { if (e.target === e.currentTarget) p.onDeselect(); }}>
        {p.footerElements.length === 0 && (
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
            <span style={{ color:'rgba(255,255,255,0.4)', fontSize:13 }}>Click + to add footer elements →</span>
          </div>
        )}
        {p.footerElements.map(el => renderEl(el, 'footer'))}
        <div style={{ position:'absolute', bottom:6, right:10, fontSize:10, color:'rgba(255,255,255,0.3)', pointerEvents:'none' }}>{p.footerWidth}×{p.footerHeight}</div>
      </div>
      <p className="text-xs text-gray-400 mt-3">Drag elements to reposition • Click to select</p>

      {/* Layers (vertical, 2 columns: media/icons + text) */}
      {p.footerElements.length > 0 && (
        <div className="w-full max-w-2xl mt-4">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/70 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50/80 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3H8L2 7h20l-6-4z"/></svg>
                <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Layers</span>
              </div>
              <span className="text-[10px] font-semibold text-gray-500 tabular-nums">{p.footerElements.length}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3">
              {/* Column 1: Logos / Icons */}
              <div className="min-w-0">
                <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-2 py-1">Logos</div>
                <div className="space-y-1">
                  {p.footerElements.filter(e => e.type !== 'text').map(el => (
                    <div
                      key={el.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => p.onSelectEl(el.id)}
                      onKeyDown={e => e.key === 'Enter' && p.onSelectEl(el.id)}
                      className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                        p.selectedId === el.id
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-300 shadow-sm'
                          : 'bg-gray-50/80 text-gray-700 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="shrink-0">{el.type === 'logo' ? '🖼' : el.type === 'linkedin' ? '💼' : '📷'}</span>
                        <span className="truncate">{el.type === 'logo' ? 'Logo' : el.type === 'linkedin' ? 'LinkedIn' : 'Instagram'}</span>
                      </span>
                      <button
                        onClick={e => { e.stopPropagation(); p.onDeleteEl(el.id); }}
                        className="shrink-0 text-gray-400 hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50 transition-all"
                        aria-label="Delete layer"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {p.footerElements.filter(e => e.type !== 'text').length === 0 && (
                    <div className="text-[11px] text-gray-500 px-3 py-2 bg-gray-50/60 border border-dashed border-gray-200 rounded-xl">
                      No logos
                    </div>
                  )}
                </div>
              </div>

              {/* Column 2: Text */}
              <div className="min-w-0">
                <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest px-2 py-1">Text</div>
                <div className="space-y-1">
                  {p.footerElements.filter(e => e.type === 'text').map(el => (
                    <div
                      key={el.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => p.onSelectEl(el.id)}
                      onKeyDown={e => e.key === 'Enter' && p.onSelectEl(el.id)}
                      className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                        p.selectedId === el.id
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-300 shadow-sm'
                          : 'bg-gray-50/80 text-gray-700 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="shrink-0">T</span>
                        <span className="truncate">{(el.content ?? 'Text').slice(0, 28)}</span>
                      </span>
                      <button
                        onClick={e => { e.stopPropagation(); p.onDeleteEl(el.id); }}
                        className="shrink-0 text-gray-400 hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50 transition-all"
                        aria-label="Delete layer"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {p.footerElements.filter(e => e.type === 'text').length === 0 && (
                    <div className="text-[11px] text-gray-500 px-3 py-2 bg-gray-50/60 border border-dashed border-gray-200 rounded-xl">
                      No text
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Body section — form preview
  return (
    <div className="flex flex-col items-center w-full max-w-lg">
      {sectionLabel('Form Body Preview')}
      <div className="w-full bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
        <div style={{ background: p.headerBackgroundImage ? `url('${p.headerBackgroundImage}') center/${p.headerBackgroundFit} no-repeat` : p.headerBackground, aspectRatio:`${p.headerWidth}/${p.headerHeight}`, width:'100%', position:'relative', overflow:'hidden' }}>
          {p.headerElements.map(el => (
            <div key={el.id} style={{ position:'absolute', left:`${(el.x/p.headerWidth)*100}%`, top:`${(el.y/p.headerHeight)*100}%`, width:`${(el.width/p.headerWidth)*100}%`, height:`${(el.height/p.headerHeight)*100}%`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              {el.type==='text' ? <span style={{ display: 'block', width: '100%', fontSize:Math.max(8,(el.fontSize??16)*0.45), color:el.color??'#fff', fontFamily: toCssFontFamily(el.fontFamily), textAlign: el.alignment ?? 'center', whiteSpace:'nowrap' }}>{el.content??''}</span>
              : el.imageUrl ? <img src={el.imageUrl} alt="logo" style={{ width:'100%', height:'100%', objectFit:'contain' }} />
              : <div style={{ width:'100%', height:'100%', border:'1px dashed rgba(255,255,255,0.3)', borderRadius:2, display:'flex', alignItems:'center', justifyContent:'center' }}><span style={{ color:'rgba(255,255,255,0.4)', fontSize:8 }}>Logo</span></div>}
            </div>
          ))}
        </div>
        <div className="p-5 space-y-3">
          <h2 className="text-sm font-bold text-gray-800 text-center">Registration Form</h2>
          <div className="space-y-2">
            {['Full Name *','Email Address *','Phone Number *'].map(f => (
              <div key={f}>
                <label className="block text-xs font-semibold text-gray-500 mb-1">{f}</label>
                <div className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-400 bg-gray-50">{f.includes('Email') ? 'you@example.com' : f.includes('Phone') ? '+1 234 567 8900' : 'Enter your name'}</div>
              </div>
            ))}
            {p.customFields.map(f => (
              <div key={f.id}>
                <label className="block text-xs font-semibold text-gray-500 mb-1">{f.label}{f.required && ' *'}</label>
                <div className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-xs text-gray-400 bg-indigo-50">{f.type === 'date' ? 'MM/DD/YYYY' : f.type === 'select' ? 'Select option…' : `Enter ${f.label.toLowerCase()}…`}</div>
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Screenshot / Proof *</label>
              <div className="w-full border-2 border-dashed border-gray-300 rounded-lg px-3 py-4 text-xs text-gray-400 bg-gray-50 text-center">📎 Click to upload image</div>
            </div>
          </div>
          <button disabled className="w-full py-2.5 rounded-xl text-white text-xs font-bold" style={{ background:p.headerBackground, opacity:0.85 }}>Submit</button>
        </div>
        <div style={{ background: p.footerBackgroundImage ? `url('${p.footerBackgroundImage}') center/${p.footerBackgroundFit} no-repeat` : p.footerBackground, aspectRatio:`${p.footerWidth}/${p.footerHeight}`, width:'100%', position:'relative', overflow:'hidden' }}>
          {p.footerElements.length === 0 ? <p className="text-xs text-gray-400 text-center py-2">Footer</p> : p.footerElements.map(el => (
            <div key={el.id} style={{ position:'absolute', left:`${(el.x/p.footerWidth)*100}%`, top:`${(el.y/p.footerHeight)*100}%`, width:`${(el.width/p.footerWidth)*100}%`, height:`${(el.height/p.footerHeight)*100}%`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              {el.type==='text' ? <span style={{ display: 'block', width: '100%', fontSize:Math.max(8,(el.fontSize??16)*0.45), color:el.color??'#fff', fontFamily: toCssFontFamily(el.fontFamily), textAlign: el.alignment ?? 'center', whiteSpace:'nowrap' }}>{el.content??''}</span>
              : el.type==='linkedin' ? <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="#0077b5"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              : el.type==='instagram' ? <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24"><defs><linearGradient id="igcb2" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#f09433"/><stop offset="50%" stopColor="#dc2743"/><stop offset="100%" stopColor="#bc1888"/></linearGradient></defs><path fill="url(#igcb2)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              : el.imageUrl ? <img src={el.imageUrl} alt="logo" style={{ width:'100%', height:'100%', objectFit:'contain' }} />
              : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


// ─── FontPicker Component ─────────────────────────────────────────────────────
interface FontPickerProps {
  value: string;
  onChange: (font: string) => void;
}

function FontPicker({ value, onChange }: FontPickerProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Load the current font on mount
  React.useEffect(() => { loadGoogleFont(value); }, [value]);

  // Close dropdown when clicking outside
  React.useEffect(() => {
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

  const filtered = GOOGLE_FONTS.filter(f =>
    f.toLowerCase().includes(query.toLowerCase())
  );

  // When opening, eagerly preload a few visible fonts so the list doesn't look identical.
  React.useEffect(() => {
    if (!open) return;
    filtered.slice(0, 10).forEach(loadGoogleFont);
  }, [open, filtered]);

  const selectFont = (font: string) => {
    loadGoogleFont(font);
    onChange(font);
    setOpen(false);
    setQuery('');
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button — shows current font */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-3 bg-white border border-gray-200 rounded-xl text-sm hover:border-indigo-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all shadow-sm"
      >
        <span style={{ fontFamily: toCssFontFamily(value) }} className="text-gray-800 truncate">{value || 'Select font…'}</span>
        <svg className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
      {open && (
        <motion.div
          className="absolute z-50 top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden"
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.14, ease: 'easeOut' }}
        >
          {/* Search */}
          <div className="p-2 border-b border-gray-100">
            <input
              autoFocus
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search fonts…"
              className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 text-gray-800 placeholder:text-gray-400"
            />
          </div>

          {/* Font list */}
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">No fonts found</p>
            )}
            {filtered.map(font => (
              <button
                key={font}
                type="button"
                onClick={() => selectFont(font)}
                onMouseEnter={() => loadGoogleFont(font)}
                className={`w-full text-left px-4 py-2.5 transition-colors group ${
                  value === font
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm truncate" style={{ fontFamily: 'inherit' }}>{font}</div>
                    <div className="text-xs text-gray-500 truncate mt-0.5" style={{ fontFamily: toCssFontFamily(font) }}>
                      The quick brown fox jumps over the lazy dog
                    </div>
                  </div>
                  {value === font && (
                    <svg className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Preview bar */}
          <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50">
            <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-widest">Preview</p>
            <p className="text-sm text-gray-700 truncate" style={{ fontFamily: toCssFontFamily(value) }}>
              The quick brown fox jumps over the lazy dog
            </p>
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}

// ─── PROPERTIES PANEL (Right Sidebar when element selected) ──────────────────
interface PropertiesPanelProps {
  selectedEl: HeaderElement | FooterElement;
  onUpdateEl: (id: string, patch: Partial<HeaderElement>) => void;
  onUploadLogo: (id: string) => void;
  onDeselect: () => void;
  onBringToFront: (id: string) => void;
  onSendToBack: (id: string) => void;
  getLayerInfo: (id: string) => { index: number; total: number } | null;
}

const PropertiesPanel = memo(function PropertiesPanel({ selectedEl, onUpdateEl, onUploadLogo, onDeselect, onBringToFront, onSendToBack, getLayerInfo }: PropertiesPanelProps) {
  const label = "text-[10px] font-bold text-gray-700 uppercase tracking-widest mb-1 block";
  const input = "w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition-all";

  const typeName = selectedEl.type === 'logo' ? 'Logo' : selectedEl.type === 'text' ? 'Text' : selectedEl.type === 'linkedin' ? 'LinkedIn' : 'Instagram';
  const layerInfo = getLayerInfo(selectedEl.id);
  const isBottom = layerInfo ? layerInfo.index === 0 : false;
  const isTop = layerInfo ? layerInfo.index === layerInfo.total - 1 : false;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100/80 bg-white/60 backdrop-blur-xl shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500" />
          <span className="text-sm font-semibold text-gray-800">{typeName} Properties</span>
        </div>
        <button onClick={onDeselect} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100/80 text-gray-500 hover:text-gray-800 transition-all text-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 active:scale-[0.98]">×</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Position & Size */}
        <div className="bg-white/70 border border-gray-200/70 rounded-2xl p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
          <p className={label}>Position & Size</p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {[['X', 'x'], ['Y', 'y'], ['W', 'width'], ['H', 'height']].map(([lbl, key]) => (
              <div key={key}>
                <label className="text-[10px] text-gray-400 mb-0.5 block">{lbl}</label>
                <input type="number" className={input + ' text-xs py-1.5'}
                  value={Math.round((selectedEl as any)[key])}
                  onChange={e => onUpdateEl(selectedEl.id, { [key]: Number(e.target.value) } as any)} />
              </div>
            ))}
          </div>
        </div>

        {/* Text properties */}
        {selectedEl.type === 'text' && (
          <>
            <div className="bg-white/70 border border-gray-200/70 rounded-2xl p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
              <p className={label}>Content</p>
              <textarea className={input + ' resize-none text-xs mt-2'} rows={3}
                value={selectedEl.content ?? ''}
                onChange={e => onUpdateEl(selectedEl.id, { content: e.target.value })} />
            </div>

            <div className="bg-white/70 border border-gray-200/70 rounded-2xl p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
              <p className={label}>Font Family</p>
              <div className="mt-2">
                <FontPicker
                value={selectedEl.fontFamily ?? 'Inter'}
                onChange={font => {
                  loadGoogleFont(font);
                  onUpdateEl(selectedEl.id, { fontFamily: font });
                }}
              />
              </div>
            </div>
            <div className="bg-white/70 border border-gray-200/70 rounded-2xl p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
              <p className={label}>Font Size</p>
              <div className="flex items-center gap-2 mt-2">
                <input type="range" min={8} max={120} value={selectedEl.fontSize ?? 16}
                  className="flex-1 h-1.5 rounded-full accent-indigo-600"
                  onChange={e => onUpdateEl(selectedEl.id, { fontSize: Number(e.target.value) })} />
                <span className="text-xs font-semibold text-gray-700 w-12 text-right tabular-nums">{selectedEl.fontSize ?? 16}px</span>
              </div>
            </div>

            <div className="bg-white/70 border border-gray-200/70 rounded-2xl p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
              <p className={label}>Color</p>
              <div className="flex items-center gap-2 mt-2">
                <input type="color" value={selectedEl.color ?? '#ffffff'}
                  onChange={e => onUpdateEl(selectedEl.id, { color: e.target.value })}
                  className="w-11 h-11 rounded-xl cursor-pointer border border-gray-200 bg-transparent shadow-sm" />
                <input type="text" className={input + ' text-xs flex-1'} value={selectedEl.color ?? '#ffffff'}
                  onChange={e => onUpdateEl(selectedEl.id, { color: e.target.value })} />
              </div>
            </div>
            <div className="bg-white/70 border border-gray-200/70 rounded-2xl p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
              <p className={label}>Alignment</p>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {(['left', 'center', 'right'] as const).map(a => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => onUpdateEl(selectedEl.id, { alignment: a })}
                    className={`text-xs px-2 py-2 rounded-xl border transition-all ${
                      (selectedEl.alignment ?? 'center') === a
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Logo properties */}
        {selectedEl.type === 'logo' && (
          <div className="bg-white/70 border border-gray-200/70 rounded-2xl p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
            <p className={label}>Logo Image</p>
            {selectedEl.imageUrl ? (
              <div className="relative mb-2">
                <img src={selectedEl.imageUrl} alt="Logo" className="w-full h-24 object-contain border border-gray-200 rounded-xl bg-gray-50" />
                <button onClick={() => onUpdateEl(selectedEl.id, { imageUrl: undefined })}
                  className="absolute top-1.5 right-1.5 bg-red-500 text-white text-xs px-2 py-0.5 rounded-lg hover:bg-red-600 transition-colors">✕</button>
              </div>
            ) : (
              <div className="w-full h-20 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50 mb-2">
                <span className="text-xs text-gray-400">No image uploaded</span>
              </div>
            )}
            <button onClick={() => onUploadLogo(selectedEl.id)}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-2.5 rounded-xl font-semibold transition-colors">
              {selectedEl.imageUrl ? '↑ Change Image' : '↑ Upload Logo'}
            </button>
          </div>
        )}

        {(selectedEl.type === 'linkedin' || selectedEl.type === 'instagram') && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3">
            <p className="text-xs font-semibold text-indigo-700 mb-1">{selectedEl.type === 'linkedin' ? 'LinkedIn' : 'Instagram'} Icon</p>
            <p className="text-xs text-gray-500">Social icons are decorative. Configure links in Footer Settings.</p>
          </div>
        )}

        <div className="bg-white/70 border border-gray-200/70 rounded-2xl p-4 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
          <p className={label}>Layering</p>
          {layerInfo && (
            <p className="text-[11px] text-gray-500 mt-1">
              Layer <span className="font-semibold text-gray-700 tabular-nums">{layerInfo.index + 1}/{layerInfo.total}</span>
              {isTop ? ' (Top)' : isBottom ? ' (Bottom)' : ''}
            </p>
          )}
          <div className="grid grid-cols-2 gap-2 mt-2">
            <button
              type="button"
              onClick={() => onBringToFront(selectedEl.id)}
              disabled={isTop}
              className="text-xs px-2 py-2 rounded-xl border bg-white text-gray-700 border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:hover:bg-white"
            >
              Front
            </button>
            <button
              type="button"
              onClick={() => onSendToBack(selectedEl.id)}
              disabled={isBottom}
              className="text-xs px-2 py-2 rounded-xl border bg-white text-gray-700 border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:hover:bg-white"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );


}); // end memo(PropertiesPanel)

// ─── LIVE PREVIEW (Right Sidebar when nothing selected) ──────────────────────
interface LivePreviewProps {
  formName: string;
  headerElements: HeaderElement[]; footerElements: FooterElement[];
  headerWidth: number; headerHeight: number;
  footerWidth: number; footerHeight: number;
  headerBackground: string; headerBackgroundImage?: string; headerBackgroundFit: 'cover'|'contain';
  footerBackground: string; footerBackgroundImage?: string; footerBackgroundFit: 'cover'|'contain';
  footerText: string; footerSocials: string;
  customFields: CustomField[];
}

function LivePreview(p: LivePreviewProps) {
  const socials = p.footerSocials.split(',').map(s => s.trim()).filter(Boolean);
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white shrink-0">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-sm font-semibold text-gray-800">Live Preview</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <div className="bg-white rounded-xl overflow-hidden shadow-md border border-gray-200 text-gray-900 text-xs">
          {/* Header */}
          <div style={{ background: p.headerBackgroundImage ? `url('${p.headerBackgroundImage}') center/${p.headerBackgroundFit} no-repeat` : p.headerBackground, aspectRatio:`${p.headerWidth}/${p.headerHeight}`, width:'100%', position:'relative', overflow:'hidden' }}>
            {p.headerElements.map(el => (
              <div key={el.id} style={{ position:'absolute', left:`${(el.x/p.headerWidth)*100}%`, top:`${(el.y/p.headerHeight)*100}%`, width:`${(el.width/p.headerWidth)*100}%`, height:`${(el.height/p.headerHeight)*100}%`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {el.type==='text' ? <span style={{ display: 'block', width: '100%', fontSize:Math.max(7,(el.fontSize??16)*0.4), color:el.color??'#fff', fontFamily: toCssFontFamily(el.fontFamily), textAlign: el.alignment ?? 'center', whiteSpace:'nowrap' }}>{el.content??''}</span>
                : el.imageUrl ? <img src={el.imageUrl} alt="logo" style={{ width:'100%', height:'100%', objectFit:'contain' }} />
                : <div style={{ width:'100%', height:'100%', border:'1px dashed rgba(255,255,255,0.3)', borderRadius:2, display:'flex', alignItems:'center', justifyContent:'center' }}><span style={{ color:'rgba(255,255,255,0.4)', fontSize:7 }}>Logo</span></div>}
              </div>
            ))}
            {p.headerElements.length === 0 && <div className="flex items-center justify-center h-full"><span style={{ color:'rgba(255,255,255,0.3)', fontSize:9 }}>Header</span></div>}
          </div>

          {/* Form body */}
          <div className="p-3 space-y-2">
            {p.formName && <h3 className="text-xs font-bold text-gray-800 text-center">{p.formName}</h3>}
            {['Full Name','Email','Phone'].map(f => (
              <div key={f}>
                <label className="block text-[9px] font-semibold text-gray-500 mb-0.5">{f} *</label>
                <div className="w-full border border-gray-200 rounded-md px-2 py-1 text-[9px] text-gray-400 bg-gray-50">{f === 'Email' ? 'you@example.com' : f === 'Phone' ? '+1 234 567 8900' : 'Enter name'}</div>
              </div>
            ))}
            {p.customFields.map(f => (
              <div key={f.id}>
                <label className="block text-[9px] font-semibold text-gray-500 mb-0.5">{f.label}{f.required && ' *'}</label>
                <div className="w-full border border-indigo-200 rounded-md px-2 py-1 text-[9px] text-gray-400 bg-indigo-50">{f.type === 'date' ? 'MM/DD/YYYY' : 'Enter…'}</div>
              </div>
            ))}
            <div>
              <label className="block text-[9px] font-semibold text-gray-500 mb-0.5">Screenshot *</label>
              <div className="w-full border-2 border-dashed border-gray-300 rounded-md px-2 py-2 text-[9px] text-gray-400 bg-gray-50 text-center">📎 Upload</div>
            </div>
            <button disabled className="w-full py-1.5 rounded-lg text-white text-[9px] font-bold" style={{ background:p.headerBackground, opacity:0.85 }}>Submit</button>
          </div>

          {/* Footer */}
          <div style={{ background: p.footerBackgroundImage ? `url('${p.footerBackgroundImage}') center/${p.footerBackgroundFit} no-repeat` : p.footerBackground, aspectRatio:`${p.footerWidth}/${p.footerHeight}`, width:'100%', position:'relative', overflow:'hidden', minHeight:36 }}>
            {p.footerElements.length > 0 ? p.footerElements.map(el => (
              <div key={el.id} style={{ position:'absolute', left:`${(el.x/p.footerWidth)*100}%`, top:`${(el.y/p.footerHeight)*100}%`, width:`${(el.width/p.footerWidth)*100}%`, height:`${(el.height/p.footerHeight)*100}%`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                {el.type==='text' ? <span style={{ display: 'block', width: '100%', fontSize:Math.max(7,(el.fontSize??16)*0.4), color:el.color??'#fff', fontFamily: toCssFontFamily(el.fontFamily), textAlign: el.alignment ?? 'center', whiteSpace:'nowrap' }}>{el.content??''}</span>
                : el.type==='linkedin' ? <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="#0077b5"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                : el.type==='instagram' ? <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24"><defs><linearGradient id="igpv" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#f09433"/><stop offset="50%" stopColor="#dc2743"/><stop offset="100%" stopColor="#bc1888"/></linearGradient></defs><path fill="url(#igpv)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                : el.imageUrl ? <img src={el.imageUrl} alt="logo" style={{ width:'100%', height:'100%', objectFit:'contain' }} />
                : <div style={{ width:'100%', height:'100%', border:'1px dashed rgba(255,255,255,0.3)', borderRadius:2, display:'flex', alignItems:'center', justifyContent:'center' }}><span style={{ color:'rgba(255,255,255,0.4)', fontSize:7 }}>Logo</span></div>}
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center h-full gap-1 px-2">
                {p.footerText && <p className="text-[9px] text-gray-300 text-center">{p.footerText}</p>}
                {!p.footerText && !p.footerSocials && <p className="text-[9px] text-gray-400">Footer</p>}
              </div>
            )}
          </div>

          {/* Footer text + social links below footer */}
          {(p.footerText || p.footerSocials) && (
            <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 space-y-1">
              {p.footerText && (
                <p className="text-[9px] text-gray-500 text-center">{p.footerText}</p>
              )}
              {p.footerSocials && (
                <div className="flex flex-wrap justify-center gap-1">
                  {p.footerSocials.split(',').map(s => s.trim()).filter(Boolean).map((s, i) => (
                    <span key={i} className="text-[8px] text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded truncate max-w-[80px]">{s.replace('https://','').replace('http://','').replace('www.','').split('/')[0]}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
