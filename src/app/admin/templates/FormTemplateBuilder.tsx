import { useState, useRef, useCallback, memo } from 'react';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ────────────────────────────────────────────────────────
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
  onAddField: () => void; onUpdateField: (id: string, patch: Partial<CustomField>) => void; onDeleteField: (id: string) => void;
}

function LeftSidebar(p: LeftSidebarProps) {
  const inp = "w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-gray-400";
  const lbl = "block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5";
  const card = "bg-white rounded-2xl border border-gray-200/80 p-4 space-y-3 shadow-sm";
  const sectionTitle = "flex items-center gap-2 text-xs font-bold text-gray-700 mb-3";

  const addBtn = (label: string, icon: string, onClick: () => void, color = 'indigo') => (
    <button onClick={onClick}
      className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-xs font-semibold transition-all hover:shadow-sm active:scale-95 border ${
        color === 'indigo' ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' :
        color === 'emerald' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' :
        color === 'sky' ? 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100' :
        'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
      }`}>
      <span className="text-base leading-none">{icon}</span>{label}
    </button>
  );

  return (
    <div className="h-full flex flex-col bg-transparent">
      {/* Template name */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-200/60">
        <label className={lbl}>Template Name</label>
        <input className={`${inp} ${p.nameError ? 'border-red-400 ring-2 ring-red-100' : ''}`}
          value={p.formName} onChange={e => p.onNameChange(e.target.value)} placeholder="My Form Template" />
        {p.nameError && <p className="text-red-500 text-[10px] mt-1 font-medium">{p.nameError}</p>}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">

        {/* ── HEADER SECTION ── */}
        {p.currentSection === 'header' && (
          <>
            <div className={card}>
              <p className={sectionTitle}><span>📐</span> Canvas Size</p>
              <div className="grid grid-cols-2 gap-2">
                <div><label className={lbl}>Width</label>
                  <input type="number" min={200} max={1400} className={inp} value={p.headerWidth} onChange={e => p.onHeaderWidthChange(Number(e.target.value))} /></div>
                <div><label className={lbl}>Height</label>
                  <input type="number" min={60} max={400} className={inp} value={p.headerHeight} onChange={e => p.onHeaderHeightChange(Number(e.target.value))} /></div>
              </div>
            </div>

            <div className={card}>
              <p className={sectionTitle}><span>🎨</span> Background</p>
              <div className="flex items-center gap-2">
                <input type="color" className="w-10 h-10 rounded-xl cursor-pointer border-2 border-gray-200 p-0.5 bg-white" value={p.headerBackground} onChange={e => p.onHeaderBgChange(e.target.value)} />
                <input type="text" className={`${inp} flex-1`} value={p.headerBackground} onChange={e => p.onHeaderBgChange(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <button onClick={p.onHeaderBgUpload} className="flex-1 text-xs bg-gray-50 hover:bg-gray-100 text-gray-700 px-3 py-2 rounded-xl border border-gray-200 font-semibold transition-all">
                  {p.headerBackgroundImage ? '↑ Replace BG' : '↑ Upload BG'}
                </button>
                {p.headerBackgroundImage && (
                  <button onClick={p.onHeaderBgRemove} className="text-xs text-red-500 hover:bg-red-50 px-3 py-2 rounded-xl border border-red-200 font-semibold transition-all">Remove</button>
                )}
              </div>
              {p.headerBackgroundImage && (
                <select className={inp} value={p.headerBackgroundFit} onChange={e => p.onHeaderBgFitChange(e.target.value as 'cover'|'contain')}>
                  <option value="cover">Cover</option><option value="contain">Contain</option>
                </select>
              )}
            </div>

            <div className={card}>
              <p className={sectionTitle}><span>➕</span> Add Elements</p>
              <div className="grid grid-cols-2 gap-2">
                {addBtn('Logo', '🖼', p.onAddLogo, 'indigo')}
                {addBtn('Text', 'T', p.onAddText, 'emerald')}
              </div>
            </div>

            {p.headerElements.length > 0 && (
              <div className={card}>
                <p className={sectionTitle}><span>🗂</span> Layers ({p.headerElements.length})</p>
                <div className="space-y-1">
                  {[...p.headerElements].reverse().map(el => (
                    <div key={el.id} role="button" tabIndex={0}
                      onClick={() => p.onSelectEl(el.id)}
                      onKeyDown={e => e.key === 'Enter' && p.onSelectEl(el.id)}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer text-xs font-medium transition-all ${
                        p.selectedId === el.id ? 'bg-indigo-100 text-indigo-800 border border-indigo-300' : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}>
                      <span className="flex items-center gap-2">
                        <span>{el.type === 'logo' ? '🖼' : 'T'}</span>
                        <span className="truncate max-w-[90px]">{el.type === 'text' ? (el.content?.slice(0,16) || 'Text') : 'Logo'}</span>
                      </span>
                      <button onClick={e => { e.stopPropagation(); p.onDeleteEl(el.id); }} className="text-gray-300 hover:text-red-500 transition-colors ml-1">×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── BODY SECTION ── */}
        {p.currentSection === 'body' && (
          <>
            <div className={card}>
              <div className="flex items-center justify-between mb-3">
                <p className={sectionTitle} style={{marginBottom:0}}><span>📝</span> Custom Fields</p>
                <button onClick={p.onAddField} className="text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-bold transition-colors shadow-sm">+ Add</button>
              </div>
              {p.customFields.length === 0 && (
                <div className="text-center py-5 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <p className="text-xs text-gray-400 font-medium">No custom fields yet</p>
                  <p className="text-[10px] text-gray-300 mt-0.5">Click + Add to create one</p>
                </div>
              )}
              <div className="space-y-2">
                {p.customFields.map(f => (
                  <div key={f.id} className="bg-gray-50 rounded-xl p-3 border border-gray-200 hover:border-indigo-200 transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <input type="text" className="flex-1 text-xs bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-indigo-400 transition-all"
                        value={f.label} onChange={e => p.onUpdateField(f.id, { label: e.target.value })} placeholder="Field label" />
                      <button onClick={() => p.onDeleteField(f.id)} className="text-gray-300 hover:text-red-500 transition-colors text-sm">×</button>
                    </div>
                    <div className="flex items-center gap-2">
                      <select className="flex-1 text-xs bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-gray-800 focus:outline-none focus:border-indigo-400 transition-all"
                        value={f.type} onChange={e => p.onUpdateField(f.id, { type: e.target.value as CustomField['type'] })}>
                        <option value="text">Text</option><option value="number">Number</option>
                        <option value="date">Date</option><option value="select">Select</option>
                      </select>
                      <label className="flex items-center gap-1.5 text-[10px] text-gray-600 font-semibold cursor-pointer select-none whitespace-nowrap">
                        <input type="checkbox" checked={f.required} onChange={e => p.onUpdateField(f.id, { required: e.target.checked })} className="accent-indigo-600" />Required
                      </label>
                    </div>
                    {f.type === 'select' && (
                      <input type="text" className="w-full mt-2 text-xs bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-indigo-400 transition-all"
                        value={f.options ?? ''} onChange={e => p.onUpdateField(f.id, { options: e.target.value })} placeholder="opt1, opt2, opt3" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className={card}>
              <p className={sectionTitle}><span>🔒</span> Static Fields (Fixed)</p>
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 space-y-1.5">
                {['Full Name *', 'Email Address *', 'Phone Number *', 'Screenshot Upload *'].map(f => (
                  <div key={f} className="flex items-center gap-2 text-xs text-indigo-700 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />{f}
                  </div>
                ))}
                <p className="text-[10px] text-indigo-400 mt-2">These fields cannot be removed.</p>
              </div>
            </div>
          </>
        )}

        {/* ── FOOTER SECTION ── */}
        {p.currentSection === 'footer' && (
          <>
            <div className={card}>
              <p className={sectionTitle}><span>📐</span> Canvas Size</p>
              <div className="grid grid-cols-2 gap-2">
                <div><label className={lbl}>Width</label>
                  <input type="number" min={200} max={1400} className={inp} value={p.footerWidth} onChange={e => p.onFooterWidthChange(Number(e.target.value))} /></div>
                <div><label className={lbl}>Height</label>
                  <input type="number" min={60} max={240} className={inp} value={p.footerHeight} onChange={e => p.onFooterHeightChange(Number(e.target.value))} /></div>
              </div>
            </div>

            <div className={card}>
              <p className={sectionTitle}><span>🎨</span> Background</p>
              <div className="flex items-center gap-2">
                <input type="color" className="w-10 h-10 rounded-xl cursor-pointer border-2 border-gray-200 p-0.5 bg-white" value={p.footerBackground} onChange={e => p.onFooterBgChange(e.target.value)} />
                <input type="text" className={`${inp} flex-1`} value={p.footerBackground} onChange={e => p.onFooterBgChange(e.target.value)} />
              </div>
              <div className="flex gap-2">
                <button onClick={p.onFooterBgUpload} className="flex-1 text-xs bg-gray-50 hover:bg-gray-100 text-gray-700 px-3 py-2 rounded-xl border border-gray-200 font-semibold transition-all">
                  {p.footerBackgroundImage ? '↑ Replace BG' : '↑ Upload BG'}
                </button>
                {p.footerBackgroundImage && (
                  <button onClick={p.onFooterBgRemove} className="text-xs text-red-500 hover:bg-red-50 px-3 py-2 rounded-xl border border-red-200 font-semibold transition-all">Remove</button>
                )}
              </div>
            </div>

            <div className={card}>
              <p className={sectionTitle}><span>➕</span> Add Elements</p>
              <div className="grid grid-cols-2 gap-2">
                {addBtn('Logo', '🖼', p.onAddFooterLogo, 'indigo')}
                {addBtn('Text', 'T', p.onAddFooterText, 'emerald')}
                {addBtn('LinkedIn', '💼', p.onAddFooterLinkedin, 'sky')}
                {addBtn('Instagram', '📷', p.onAddFooterInstagram, 'rose')}
              </div>
            </div>

            <div className={card}>
              <p className={sectionTitle}><span>📄</span> Footer Settings</p>
              <div className="space-y-2">
                <div><label className={lbl}>Footer Text</label>
                  <input type="text" className={inp} value={p.footerText} onChange={e => p.onFooterTextChange(e.target.value)} placeholder="© 2024 Your Organization" /></div>
                <div><label className={lbl}>Social Links (comma-separated)</label>
                  <input type="text" className={inp} value={p.footerSocials} onChange={e => p.onFooterSocialsChange(e.target.value)} placeholder="https://linkedin.com/..." /></div>
              </div>
            </div>

            {p.footerElements.length > 0 && (
              <div className={card}>
                <p className={sectionTitle}><span>🗂</span> Layers ({p.footerElements.length})</p>
                <div className="space-y-1">
                  {[...p.footerElements].reverse().map(el => (
                    <div key={el.id} role="button" tabIndex={0}
                      onClick={() => p.onSelectEl(el.id)}
                      onKeyDown={e => e.key === 'Enter' && p.onSelectEl(el.id)}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer text-xs font-medium transition-all ${
                        p.selectedId === el.id ? 'bg-indigo-100 text-indigo-800 border border-indigo-300' : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}>
                      <span className="flex items-center gap-2">
                        <span>{el.type === 'logo' ? '🖼' : el.type === 'linkedin' ? '💼' : el.type === 'instagram' ? '📷' : 'T'}</span>
                        <span className="truncate max-w-[90px]">{el.type === 'text' ? (el.content?.slice(0,16) || 'Text') : el.type}</span>
                      </span>
                      <button onClick={e => { e.stopPropagation(); p.onDeleteEl(el.id); }} className="text-gray-300 hover:text-red-500 transition-colors ml-1">×</button>
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

// ─── Main Component ────────────────────────────────────
export function FormTemplateBuilder({ initialTemplate, onClose, onSaved }: {
  initialTemplate?: { id: string; name: string; fields: CustomField[]; headerConfig: Partial<HeaderConfig>; } | null;
  onClose: () => void; onSaved: () => void;
}) {
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
  const [currentSection, setCurrentSection] = useState<SectionType>('header');
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
    const nx = Math.max(0, Math.min(w - el.width, elStartX + dx));
    const ny = Math.max(0, Math.min(h - el.height, elStartY + dy));
    (area === 'header' ? setHeaderElements : setFooterElements)(prev => prev.map(item => item.id === elId ? { ...item, x: nx, y: ny } : item));
  }, [footerElements, headerElements, footerHeight, footerWidth, headerHeight, headerWidth]);

  const onHeaderMouseMove = useCallback((e: React.MouseEvent) => { if (headerRef.current) moveElement('header', e); }, [moveElement]);
  const onFooterMouseMove = useCallback((e: React.MouseEvent) => { if (footerRef.current) moveElement('footer', e); }, [moveElement]);
  const onMouseUp = useCallback(() => { dragRef.current = null; }, []);

  const uid = () => `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
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
    setNameError(''); setSaving(true); setSaveMsg('');
    try {
      const body = { type: 'form', name: trimmed, fields: customFields, headerConfig: { headerElements, headerWidth, headerHeight, headerBackground, headerBackgroundImage, headerBackgroundFit, footerText, footerSocials, footerConfig: { footerElements, width: footerWidth, height: footerHeight, backgroundColor: footerBackground, backgroundImage: footerBackgroundImage, backgroundFit: footerBackgroundFit } }, ...(initialTemplate ? { id: initialTemplate.id } : {}) };
      const res = await fetch('/api/admin/templates', { method: initialTemplate ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('Save failed');
      setSaveMsg('Template saved successfully'); onSaved();
    } catch { setSaveMsg('Failed to save template'); } finally { setSaving(false); }
  };

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-50 flex flex-col no-theme-bg" style={{background: '#f8faff'}}>
        {/* Header Toolbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-5 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="text-gray-500 hover:text-gray-900 text-xs font-bold px-3 py-2 rounded-xl hover:bg-gray-100 transition-all">Close</button>
            <div className="w-px h-6 bg-gray-200"/>
            <p className="text-sm font-bold text-gray-800">Form Builder</p>
          </div>
          <div className="flex items-center gap-3">
            {(['header','body','footer'] as const).map(s => (
              <button key={s} onClick={() => setCurrentSection(s)} className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${currentSection === s ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}>{s}</button>
            ))}
          </div>
          <button onClick={save} disabled={saving} className="bg-indigo-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50">{saving ? 'Saving...' : 'Save Template'}</button>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <aside className="w-72 bg-white border-r border-gray-200 flex flex-col shrink-0 overflow-y-auto">
            <LeftSidebar
              currentSection={currentSection}
              formName={formName} nameError={nameError} onNameChange={setFormName}
              headerElements={headerElements} footerElements={footerElements}
              selectedId={selectedId} onSelectEl={setSelectedId} onDeleteEl={deleteEl}
              onAddLogo={addLogo} onAddText={addText}
              onAddFooterLogo={addFooterLogo} onAddFooterText={addFooterText}
              onAddFooterLinkedin={addFooterLinkedin} onAddFooterInstagram={addFooterInstagram}
              headerWidth={headerWidth} headerHeight={headerHeight}
              headerBackground={headerBackground} headerBackgroundImage={headerBackgroundImage} headerBackgroundFit={headerBackgroundFit}
              onHeaderWidthChange={setHeaderWidth} onHeaderHeightChange={setHeaderHeight}
              onHeaderBgChange={setHeaderBackground} onHeaderBgUpload={() => headerBgInputRef.current?.click()}
              onHeaderBgRemove={() => setHeaderBackgroundImage(undefined)} onHeaderBgFitChange={setHeaderBackgroundFit}
              footerWidth={footerWidth} footerHeight={footerHeight}
              footerBackground={footerBackground} footerBackgroundImage={footerBackgroundImage} footerBackgroundFit={footerBackgroundFit}
              onFooterWidthChange={setFooterWidth} onFooterHeightChange={setFooterHeight}
              onFooterBgChange={setFooterBackground} onFooterBgUpload={() => footerBgInputRef.current?.click()}
              onFooterBgRemove={() => setFooterBackgroundImage(undefined)} onFooterBgFitChange={setFooterBackgroundFit}
              footerText={footerText} footerSocials={footerSocials}
              onFooterTextChange={setFooterText} onFooterSocialsChange={setFooterSocials}
              customFields={customFields} onAddField={addCustomField} onUpdateField={updateField} onDeleteField={deleteField}
            />
          </aside>

          <main className="flex-1 bg-gray-50 flex flex-col items-center justify-start p-10 overflow-auto" onMouseMove={e => { onHeaderMouseMove(e); onFooterMouseMove(e); }} onMouseUp={onMouseUp}>
            {/* Simple Canvas Rendering */}
            <div ref={currentSection === 'header' ? headerRef : footerRef}
              style={{
                width: currentSection === 'header' ? headerWidth : footerWidth,
                height: currentSection === 'header' ? headerHeight : footerHeight,
                background: currentSection === 'header'
                  ? (headerBackgroundImage ? `url(${headerBackgroundImage}) center/${headerBackgroundFit}` : headerBackground)
                  : (footerBackgroundImage ? `url(${footerBackgroundImage}) center/${footerBackgroundFit}` : footerBackground),
                position: 'relative',
                borderRadius: 8,
                boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
                overflow: 'hidden'
              }}>
              {(currentSection === 'header' ? headerElements : footerElements).map(el => (
                <div key={el.id}
                  onMouseDown={e => onElMouseDown(e, el.id, currentSection === 'header' ? 'header' : 'footer')}
                  style={{
                    position: 'absolute', left: el.x, top: el.y, width: el.width, height: el.height,
                    border: selectedId === el.id ? '2px solid #6366f1' : '1px dashed rgba(0,0,0,0.2)',
                    cursor: 'grab'
                  }}>
                  {el.type === 'text' ? (
                    <div style={{ fontSize: el.fontSize, color: el.color, fontFamily: el.fontFamily, textAlign: el.alignment }}>{el.content}</div>
                  ) : el.imageUrl ? (
                    <img src={el.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : <div className="flex items-center justify-center h-full text-[10px] text-gray-400">{el.type}</div>}
                </div>
              ))}
            </div>
          </main>
        </div>

        <input ref={logoInputRef} type="file" className="hidden" onChange={handleLogoUpload} />
        <input ref={headerBgInputRef} type="file" className="hidden" onChange={handleHeaderBgUpload} />
        <input ref={footerBgInputRef} type="file" className="hidden" onChange={handleFooterBgUpload} />
      </motion.div>
    </AnimatePresence>
  );
}
