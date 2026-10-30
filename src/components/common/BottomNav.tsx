import React, { useEffect, useRef, useState } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Receipt, 
  BookUser, 
  Landmark,
  TrendingUp,
  MoreHorizontal,
  Wallet,
  Sparkles,
  ShieldCheck,
  LifeBuoy,
  X
} from 'lucide-react';
import { openSupport, useSupport } from '../../services/support';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  lowStockCount: number;
  totalDebtorsCount: number;
  isAdmin?: boolean;
  allowedTabs?: string[];
}

const FAB = 48, EDGE = 12, FAB_KEY = 'nafora_fab_pos_v1';
type FabPos = { left: boolean; top: number };

/** Bulle « Assistant IA » : se déplace au doigt, se colle au bord le plus proche, position mémorisée. */
const AssistantFab: React.FC<{ onOpen: () => void; onPos: boolean }> = ({ onOpen, onPos }) => {
  const [pos, setPos] = useState<FabPos | null>(() => {
    try { const v = JSON.parse(localStorage.getItem(FAB_KEY) || 'null'); return v && typeof v.top === 'number' ? v : null; } catch { return null; }
  });
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const st = useRef({ sx: 0, sy: 0, ox: 0, oy: 0, moved: false, id: -1 });
  const ref = useRef<HTMLButtonElement>(null);
  const bounds = () => ({ minTop: 84, maxTop: window.innerHeight - 64 - FAB - 8 });
  const clampTop = (y: number) => { const b = bounds(); return Math.min(b.maxTop, Math.max(b.minTop, y)); };

  useEffect(() => {
    const fix = () => setPos(p => p ? { ...p, top: clampTop(p.top) } : p);
    window.addEventListener('resize', fix); return () => window.removeEventListener('resize', fix);
  }, []);

  const down = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    st.current = { sx: e.clientX, sy: e.clientY, ox: r.left, oy: r.top, moved: false, id: e.pointerId };
    try { ref.current!.setPointerCapture(e.pointerId); } catch { /* ignore */ }
  };
  const move = (e: React.PointerEvent) => {
    const s = st.current; if (s.id !== e.pointerId) return;
    const dx = e.clientX - s.sx, dy = e.clientY - s.sy;
    if (!s.moved && Math.hypot(dx, dy) < 8) return;
    s.moved = true;
    setDrag({ x: Math.min(window.innerWidth - FAB - EDGE, Math.max(EDGE, s.ox + dx)), y: clampTop(s.oy + dy) });
  };
  const up = (e: React.PointerEvent) => {
    const s = st.current; if (s.id !== e.pointerId) return; s.id = -1;
    if (!s.moved) { onOpen(); return; }
    const d = drag; setDrag(null);
    if (!d) return;
    const next: FabPos = { left: d.x + FAB / 2 < window.innerWidth / 2, top: d.y };
    setPos(next);
    try { localStorage.setItem(FAB_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const style: React.CSSProperties = { touchAction: 'none' };
  if (drag) { style.left = drag.x; style.top = drag.y; }
  else if (pos) { style.top = clampTop(pos.top); if (pos.left) style.left = EDGE; else style.right = EDGE; }
  else { style.right = EDGE; style.bottom = onPos ? 140 : 80; }

  return (
    <button
      ref={ref}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={() => { st.current.id = -1; setDrag(null); }}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(); } }}
      aria-label="Ouvrir l'assistant IA (glissez pour déplacer)"
      title="Assistant IA — glissez pour déplacer"
      data-testid="assistant-fab"
      style={style}
      className={`xl:hidden fixed z-40 flex flex-col items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-900/30 ring-2 ring-amber-300/80 select-none ${drag ? 'scale-110' : 'transition-transform active:scale-95'}`}
    >
      <Sparkles className="w-5 h-5 text-amber-300 pointer-events-none" />
      <span className="text-[9px] font-extrabold leading-none mt-0.5 pointer-events-none">IA</span>
    </button>
  );
};

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  lowStockCount,
  totalDebtorsCount,
  isAdmin = false,
  allowedTabs,
}) => {
  const [moreOpen, setMoreOpen] = useState(false);
  const support = useSupport();
  const ok = (id: string) => !allowedTabs || allowedTabs.includes(id);
  const moreTabs = [
    { id: 'finances', label: 'Ratios', icon: TrendingUp },
    { id: 'credit', label: 'Score Crédit', icon: Landmark },
    { id: 'formalization', label: 'Formalisation', icon: ShieldCheck },
  ].filter(t => ok(t.id));
  const moreActive = moreTabs.some(t => t.id === activeTab);

  const tabs = [
    { id: 'dashboard', label: 'Accueil', icon: LayoutDashboard },
    { id: 'pos', label: 'Caisse', icon: ShoppingCart, highlight: true },
    { id: 'expenses', label: 'Dépenses', icon: Wallet },
    { id: 'stock', label: 'Stocks', icon: Package, badge: lowStockCount > 0 ? lowStockCount : null },
    { id: 'debts', label: 'Dettes', icon: BookUser, badge: totalDebtorsCount > 0 ? totalDebtorsCount : null },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin', icon: Landmark, badge: '👑' }] : []),
  ].filter(t => t.id === 'admin' || ok(t.id));
  const cols = tabs.length + ((moreTabs.length || support.whatsapp) ? 1 : 0);

  return (
    <>
    {/* Bulle flottante : Assistant IA (à droite, dans la zone du pouce, au-dessus de la barre et des bandeaux d'état) */}
    {ok('assistant') && activeTab !== 'assistant' && <AssistantFab onOpen={() => setActiveTab('assistant')} onPos={activeTab === 'pos'} />}
    <div className="xl:hidden fixed -bottom-px left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 px-1 py-1.5 pb-[calc(0.375rem+1px)] shadow-lg safe-bottom">
      <div className="grid gap-0.5 max-w-xl mx-auto" style={{ gridTemplateColumns: `repeat(${Math.max(cols, 2)}, minmax(0, 1fr))` }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1 rounded-xl transition ${
                isActive
                  ? 'text-emerald-800 font-bold'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              {/* Highlight circle for POS */}
              <div className={`relative p-1 rounded-xl transition ${
                tab.highlight && !isActive ? 'bg-amber-100 text-amber-900' : ''
              } ${isActive ? 'bg-emerald-100 text-emerald-800' : ''}`}>
                <Icon className={`w-5 h-5 ${tab.highlight ? 'stroke-[2.5]' : ''}`} />
                
                {/* Notification Badge */}
                {tab.badge && (
                  <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] tracking-tight mt-0.5 truncate max-w-[48px] ${isActive ? 'font-bold' : 'font-medium'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* Menu "Plus" : rubriques secondaires */}
        {(moreTabs.length > 0 || !!support.whatsapp) && <button
          onClick={() => setMoreOpen(o => !o)}
          className={`relative flex flex-col items-center justify-center py-1 rounded-xl transition ${
            moreActive || moreOpen ? 'text-emerald-800 font-bold' : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <div className={`p-1 rounded-xl ${moreActive || moreOpen ? 'bg-emerald-100 text-emerald-800' : ''}`}>
            <MoreHorizontal className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Plus</span>
        </button>}
      </div>

      {moreOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMoreOpen(false)} />
          <div className="absolute bottom-full right-2 mb-2 z-50 w-56 bg-white rounded-2xl shadow-2xl border border-stone-200 p-2 space-y-1">
            <div className="flex items-center justify-between px-2 pt-1 pb-0.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-stone-500">Plus</span>
              <button onClick={() => setMoreOpen(false)} className="text-stone-400 p-0.5"><X className="w-4 h-4" /></button>
            </div>
            {moreTabs.map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => { setActiveTab(t.id); setMoreOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-left ${
                    activeTab === t.id ? 'bg-emerald-100 text-emerald-900' : 'text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{t.label}</span>
                </button>
              );
            })}
            {support.whatsapp && (
              <button
                onClick={() => { setMoreOpen(false); openSupport(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-left text-stone-700 hover:bg-stone-100 border-t border-stone-100 mt-1"
                data-testid="support-more"
              >
                <LifeBuoy className="w-4 h-4 shrink-0 text-emerald-700" />
                <span className="flex flex-col leading-tight"><span>Contacter l'assistance</span>{support.hours && <span className="text-[10px] font-medium text-stone-500">{support.hours}</span>}</span>
              </button>
            )}
          </div>
        </>
      )}
    </div>
    </>
  );
};