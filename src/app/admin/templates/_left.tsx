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
  const inp = "w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-gray-400";
  const lbl = "block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5";
  const card = "bg-white rounded-2xl border border-gray-200/80 p-4 space-y-3 shadow-sm";

  const SectionHeader = ({ icon, title }: { icon: string; title: string }) => (
    <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-indigo-50/50 to-transparent">
      <span className="text-base">{icon}</span>
      <span className="text-xs font-bold text-gray-700 uppercase tracking-widest">{title}</span>
    </div>
  );

  const AddBtn = ({ label, onClick, color = 'indigo' }: { label: string; onClick: () => void; color?: string }) => {
    const colors: Record<string, string> = {
      indigo: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200',
      emerald: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200',
      sky: 'bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200',
      rose: 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200',
    };
    return (
      <button onClick={onClick} className={`flex items-center justify-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border transition-all hover:shadow-sm active:scale-95 ${colors[color]}`}>
        <span className="text-base leading-none">+</span>{label}
      </button>
    );
  };

  const LayerItem = ({ el, area }: { el: HeaderElement | FooterElement; area: 'header'|'footer' }) => {
    const icons: Record<string, string> = { logo: '🖼', text: 'T', linkedin: '💼', instagram: '📷' };
    const isSelected = p.selectedId === el.id;
    return (
      <div onClick={() => p.onSelectEl(el.id)}
        className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer text-xs transition-all group ${isSelected ? 'bg-indigo-100 border border-indigo-300 shadow-sm' : 'bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300'}`}>
        <span className="flex items-center gap-2">
          <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'}`}>{icons[el.type] || 'T'}</span>
          <span className={`truncate max-w-[90px] font-medium ${isSelected ? 'text-indigo-800' : 'text-gray-700'}`}>
            {el.type === 'text' ? ((el as any).content?.slice(0, 14) || 'Text') : el.type === 'logo' ? 'Logo' : el.type}
          </span>
        </span>
        <button onClick={e => { e.stopPropagation(); p.onDeleteEl(el.id); }}
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all text-sm font-bold">×</button>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Template name */}
      <div className="p-4 border-b border-gray-100">
        <label className={lbl}>Template Name</label>
        <input className={`${inp} ${p.nameError ? 'border-red-400 ring-2 ring-red-100' : ''}`}
          value={p.formName} onChange={e => p.onNameChange(e.target.value)} placeholder="My Form Template" />
        {p.nameError && <p className="text-red-500 text-[10px] mt-1 font-medium">{p.nameError}</p>}
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* HEADER SECTION */}
        {p.currentSection === 'header' && (
          <>
            <SectionHeader icon="⬆" title="Header Settings" />
            <div className="p-4 space-y-4">
              <div className={card}>
                <p className={lbl}>Canvas Size</p>
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-[10px] text-gray-400 mb-1 block">Width</span>
                    <input type="number" min={200} max={1400} className={inp} value={p.headerWidth} onChange={e => p.onHeaderWidthChange(Number(e.target.value))} /></div>
                  <div><span className="text-[10px] text-gray-400 mb-1 block">Height</span>
                    <input type="number" min={60} max={400} className={inp} value={p.headerHeight} onChange={e => p.onHeaderHeightChange(Number(e.target.value))} /></div>
                </div>
              </div>

              <div className={card}>
                <p className={lbl}>Background</p>
                <div className="flex items-center gap-2">
                  <input type="color" className="w-10 h-10 rounded-xl cursor-pointer border border-gray-200 p-0.5 bg-white" value={p.headerBackground} onChange={e => p.onHeaderBgChange(e.target.value)} />
                  <input type="text" className={`${inp} flex-1`} value={p.headerBackground} onChange={e => p.onHeaderBgChange(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <button onClick={p.onHeaderBgUpload} className="flex-1 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-2 rounded-xl font-bold transition-all">
                    {p.headerBackgroundImage ? '↑ Replace BG' : '↑ Upload BG'}
                  </button>
                  {p.headerBackgroundImage && (
                    <button onClick={p.onHeaderBgRemove} className="text-xs text-red-500 hover:bg-red-50 px-3 py-2 rounded-xl border border-red-200 font-bold transition-all">Remove</button>
                  )}
                </div>
                <select className={inp} value={p.headerBackgroundFit} onChange={e => p.onHeaderBgFitChange(e.target.value as 'cover'|'contain')}>
                  <option value="cover">Cover</option><option value="contain">Contain</option>
                </select>
              </div>

              <div className={card}>
                <p className={lbl}>Add Elements</p>
                <div className="grid grid-cols-2 gap-2">
                  <AddBtn label="Logo" onClick={p.onAddLogo} color="indigo" />
                  <AddBtn label="Text" onClick={p.onAddText} color="emerald" />
                </div>
              </div>

              {p.headerElements.length > 0 && (
                <div className={card}>
                  <p className={lbl}>Layers ({p.headerElements.length})</p>
                  <div className="space-y-1.5">
                    {p.headerElements.map(el => <LayerItem key={el.id} el={el} area="header" />)}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* BODY SECTION */}
        {p.currentSection === 'body' && (
          <>
            <SectionHeader icon="📋" title="Form Fields" />
            <div className="p-4 space-y-4">
              <div className={card}>
                <div className="flex items-center justify-between">
                  <p className={lbl}>Custom Fields</p>
                  <button onClick={p.onAddField} className="text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg font-bold transition-all shadow-sm">+ Add</button>
                </div>
                {p.customFields.length === 0 && (
                  <div className="text-center py-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <p className="text-xs text-gray-400 font-medium">No custom fields yet</p>
                    <p className="text-[10px] text-gray-300 mt-1">Click + Add to create one</p>
                  </div>
                )}
                <div className="space-y-2">
                  {p.customFields.map(f => (
                    <div key={f.id} className="bg-gray-50 rounded-xl p-3 border border-gray-200 hover:border-indigo-200 transition-all">
                      <div className="flex items-center gap-2 mb-2">
                        <input type="text" className="flex-1 text-xs bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-indigo-400 transition-all"
                          value={f.label} onChange={e => p.onUpdateField(f.id, { label: e.target.value })} placeholder="Field label" />
                        <button onClick={() => p.onDeleteField(f.id)} className="text-gray-400 hover:text-red-500 transition-colors text-sm font-bold">×</button>
                      </div>
                      <div className="flex items-center gap-2">
                        <select className="flex-1 text-xs bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-gray-800 focus:outline-none focus:border-indigo-400 transition-all"
                          value={f.type} onChange={e => p.onUpdateField(f.id, { type: e.target.value as CustomField['type'] })}>
                          <option value="text">Text</option><option value="number">Number</option>
                          <option value="date">Date</option><option value="select">Select</option>
                        </select>
                        <label className="flex items-center gap-1.5 text-[10px] text-gray-600 font-bold cursor-pointer select-none">
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

              <div className="bg-indigo-50 rounded-2xl border border-indigo-200 p-4">
                <p className="text-xs font-bold text-indigo-700 mb-2">Static Fields (Fixed)</p>
                <ul className="space-y-1.5 text-xs text-indigo-600">
                  {['Full Name *','Email Address *','Phone Number *','Screenshot Upload *'].map(f => (
                    <li key={f} className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0"/>{f}</li>
                  ))}
                </ul>
                <p className="text-[10px] text-indigo-400 mt-2">These fields cannot be removed.</p>
              </div>
            </div>
          </>
        )}

        {/* FOOTER SECTION */}
        {p.currentSection === 'footer' && (
          <>
            <SectionHeader icon="⬇" title="Footer Settings" />
            <div className="p-4 space-y-4">
              <div className={card}>
                <p className={lbl}>Canvas Size</p>
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-[10px] text-gray-400 mb-1 block">Width</span>
                    <input type="number" min={200} max={1400} className={inp} value={p.footerWidth} onChange={e => p.onFooterWidthChange(Number(e.target.value))} /></div>
                  <div><span className="text-[10px] text-gray-400 mb-1 block">Height</span>
                    <input type="number" min={60} max={240} className={inp} value={p.footerHeight} onChange={e => p.onFooterHeightChange(Number(e.target.value))} /></div>
                </div>
              </div>

              <div className={card}>
                <p className={lbl}>Background</p>
                <div className="flex items-center gap-2">
                  <input type="color" className="w-10 h-10 rounded-xl cursor-pointer border border-gray-200 p-0.5 bg-white" value={p.footerBackground} onChange={e => p.onFooterBgChange(e.target.value)} />
                  <input type="text" className={`${inp} flex-1`} value={p.footerBackground} onChange={e => p.onFooterBgChange(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <button onClick={p.onFooterBgUpload} className="flex-1 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-2 rounded-xl font-bold transition-all">
                    {p.footerBackgroundImage ? '↑ Replace BG' : '↑ Upload BG'}
                  </button>
                  {p.footerBackgroundImage && (
                    <button onClick={p.onFooterBgRemove} className="text-xs text-red-500 hover:bg-red-50 px-3 py-2 rounded-xl border border-red-200 font-bold transition-all">Remove</button>
                  )}
                </div>
              </div>

              <div className={card}>
                <p className={lbl}>Add Elements</p>
                <div className="grid grid-cols-2 gap-2">
                  <AddBtn label="Logo" onClick={p.onAddFooterLogo} color="indigo" />
                  <AddBtn label="Text" onClick={p.onAddFooterText} color="emerald" />
                  <AddBtn label="LinkedIn" onClick={p.onAddFooterLinkedin} color="sky" />
                  <AddBtn label="Instagram" onClick={p.onAddFooterInstagram} color="rose" />
                </div>
              </div>

              <div className={card}>
                <p className={lbl}>Footer Text</p>
                <input type="text" className={inp} value={p.footerText} onChange={e => p.onFooterTextChange(e.target.value)} placeholder="© 2024 Your Organization" />
                <p className={`${lbl} mt-2`}>Social Links</p>
                <input type="text" className={inp} value={p.footerSocials} onChange={e => p.onFooterSocialsChange(e.target.value)} placeholder="https://twitter.com/..., https://..." />
              </div>

              {p.footerElements.length > 0 && (
                <div className={card}>
                  <p className={lbl}>Layers ({p.footerElements.length})</p>
                  <div className="space-y-1.5">
                    {p.footerElements.map(el => <LayerItem key={el.id} el={el} area="footer" />)}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

