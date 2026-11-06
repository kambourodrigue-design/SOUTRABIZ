import React, { useMemo, useState } from 'react';
import { Product, ShopSettings } from '../../types';
import { formatCurrency } from '../../services/financials';
import { REASONS, reasonInfo, applyAdjustments, round3, AdjustReason, AdjustResult } from '../../services/stockAdjust';
import { uiAlert, uiConfirm } from '../common/dialogs';
import { X, ClipboardCheck, Search } from 'lucide-react';

const num = (v: string) => { const n = Number(String(v).replace(',', '.')); return Number.isFinite(n) ? n : NaN; };
const Shell: React.FC<{ title: string; sub?: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode; testid: string }> = ({ title, sub, onClose, children, footer, testid }) => (
  <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs sm:p-4" data-testid={testid}>
    <div className="w-full max-w-lg bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl border border-stone-200 flex flex-col max-h-[94vh]">
      <div className="flex items-start justify-between gap-3 p-4 border-b border-stone-100">
        <div className="min-w-0"><h3 className="font-black text-base text-stone-900">{title}</h3>{sub && <p className="text-xs text-stone-500 truncate">{sub}</p>}</div>
        <button onClick={onClose} aria-label="Fermer" className="p-2 rounded-xl text-stone-500 hover:bg-stone-100"><X className="w-5 h-5" /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">{children}</div>
      {footer && <div className="border-t border-stone-100 p-3">{footer}</div>}
    </div>
  </div>
);

/** Ajuster le stock d'UN article : casse, perte, vol, consommation personnelle, comptage... */
export const AdjustModal: React.FC<{ product: Product; settings: ShopSettings; onApply: (r: AdjustResult) => void; onClose: () => void }> = ({ product, settings, onApply, onClose }) => {
  const [reason, setReason] = useState<AdjustReason>('damage');
  const [qty, setQty] = useState('');
  const [note, setNote] = useState('');
  const info = reasonInfo(reason);
  const exact = info.dir === 'any';                 // comptage / autre : on saisit la quantité réelle
  const q = num(qty);
  const newQty = !(q >= 0) ? NaN : exact ? q : info.dir === 'out' ? product.stockQuantity - q : product.stockQuantity + q;
  const delta = round3((Number.isNaN(newQty) ? product.stockQuantity : Math.max(0, newQty)) - product.stockQuantity);
  const loss = info.expense && delta < 0 ? Math.round(-delta * (product.purchasePrice || 0)) : 0;
  const submit = () => {
    if (!(q >= 0) || qty.trim() === '') { uiAlert('Indiquez une quantité.'); return; }
    if (!exact && info.dir === 'out' && q > product.stockQuantity) { uiAlert(`Vous n'avez que ${product.stockQuantity} ${product.unit} en stock.`); return; }
    if (delta === 0) { uiAlert('Le stock ne change pas.'); return; }
    onApply(applyAdjustments([product], [{ productId: product.id, newQty, reason, note }], product.name));
  };
  return (
    <Shell testid="adjust-modal" title="Ajuster le stock" sub={`${product.name} · actuellement ${product.stockQuantity} ${product.unit}`} onClose={onClose}
      footer={<button onClick={submit} data-testid="adjust-save" className="w-full py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-black text-sm">Enregistrer l'ajustement</button>}>
      <div>
        <p className="text-xs font-bold text-stone-700 mb-2">Pourquoi ?</p>
        <div className="grid grid-cols-2 gap-2">
          {REASONS.map(r => (
            <button key={r.id} type="button" onClick={() => { setReason(r.id); setQty(''); }} data-testid={`reason-${r.id}`}
              className={`text-left px-3 py-2 rounded-xl border text-xs font-bold ${reason === r.id ? 'border-emerald-700 bg-emerald-50 text-emerald-900' : 'border-stone-200 bg-stone-50 text-stone-700'}`}>
              <span className="mr-1">{r.icon}</span>{r.label}
            </button>))}
        </div>
      </div>
      <div>
        <label className="text-xs font-bold text-stone-700">{exact ? `Quantité réelle en stock (${product.unit})` : info.dir === 'out' ? `Quantité retirée (${product.unit})` : `Quantité ajoutée (${product.unit})`}</label>
        <input type="text" inputMode="decimal" value={qty} onChange={e => setQty(e.target.value)} data-testid="adjust-qty" placeholder="0" autoFocus
          className="w-full mt-1 px-3 py-3 bg-stone-50 border border-stone-200 rounded-xl text-lg font-black font-mono-num" />
      </div>
      <div>
        <label className="text-xs font-bold text-stone-700">Note (facultatif)</label>
        <input type="text" value={note} maxLength={80} onChange={e => setNote(e.target.value)} className="w-full mt-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm" placeholder="ex. carton tombé du camion" />
      </div>
      {!Number.isNaN(newQty) && delta !== 0 && (
        <div className="rounded-xl bg-stone-50 border border-stone-200 p-3 text-sm space-y-1" data-testid="adjust-preview">
          <p>Stock : <b>{product.stockQuantity}</b> → <b className={delta < 0 ? 'text-rose-700' : 'text-emerald-700'}>{round3(Math.max(0, newQty))}</b> {product.unit}</p>
          {loss > 0 && <p className="text-rose-700 font-semibold">{info.expense === 'personal_draw' ? 'Prélèvement personnel' : 'Perte'} enregistré(e) : {formatCurrency(loss, settings.currency)} <span className="font-normal text-stone-500">(au prix d'achat, sans sortie d'argent)</span></p>}
        </div>)}
      {!!product.stockLog?.length && (
        <div>
          <p className="text-xs font-bold text-stone-700 mb-1">Derniers ajustements</p>
          <ul className="text-xs text-stone-600 space-y-0.5">
            {product.stockLog.slice(-5).reverse().map((l, i) => (
              <li key={i} className="flex justify-between gap-2"><span>{new Date(l.d).toLocaleDateString('fr-FR')} · {reasonInfo(l.reason).label}{l.note ? ` · ${l.note}` : ''}</span><b className={l.delta < 0 ? 'text-rose-700' : 'text-emerald-700'}>{l.delta > 0 ? '+' : ''}{l.delta}</b></li>))}
          </ul>
        </div>)}
    </Shell>
  );
};

/** Inventaire : on compte les articles, l'application calcule les écarts et corrige le stock. */
export const InventoryModal: React.FC<{ products: Product[]; settings: ShopSettings; onApply: (r: AdjustResult) => void; onClose: () => void }> = ({ products, settings, onApply, onClose }) => {
  const items = useMemo(() => products.filter(p => !p.isService).sort((a, b) => a.name.localeCompare(b.name)), [products]);
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const shown = items.filter(p => !search.trim() || p.name.toLowerCase().includes(search.trim().toLowerCase()));
  const diffs = items.map(p => {
    const raw = counts[p.id];
    if (raw === undefined || raw.trim() === '') return null;
    const c = num(raw);
    if (!(c >= 0)) return null;
    const d = round3(c - p.stockQuantity);
    return d === 0 ? null : { p, c, d };
  }).filter(Boolean) as { p: Product; c: number; d: number }[];
  const counted = Object.values(counts).filter(v => v.trim() !== '').length;
  const lost = diffs.filter(x => x.d < 0).reduce((n, x) => n + Math.round(-x.d * (x.p.purchasePrice || 0)), 0);
  const gained = diffs.filter(x => x.d > 0).reduce((n, x) => n + Math.round(x.d * (x.p.purchasePrice || 0)), 0);
  const validate = async () => {
    if (!diffs.length) { uiAlert(counted ? "Aucun écart : votre stock est juste." : "Saisissez au moins une quantité comptée."); return; }
    if (!(await uiConfirm(`Corriger le stock de ${diffs.length} article(s) ?${lost ? ` Perte estimée : ${formatCurrency(lost, settings.currency)}.` : ''}`))) return;
    onApply(applyAdjustments(products, diffs.map(x => ({ productId: x.p.id, newQty: x.c, reason: 'count' as AdjustReason })), 'Inventaire du ' + new Date().toLocaleDateString('fr-FR')));
  };
  return (
    <Shell testid="inventory-modal" title="Inventaire" sub="Comptez ce que vous avez vraiment, article par article" onClose={onClose}
      footer={<div className="space-y-2">
        <p className="text-xs text-stone-600 text-center" data-testid="inventory-summary">{counted} compté(s) · {diffs.length} écart(s){lost ? ` · perte ${formatCurrency(lost, settings.currency)}` : ''}{gained ? ` · en plus ${formatCurrency(gained, settings.currency)}` : ''}</p>
        <button onClick={validate} data-testid="inventory-validate" className="w-full py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-black text-sm flex items-center justify-center gap-2"><ClipboardCheck className="w-4 h-4" />Valider l'inventaire</button></div>}>
      <p className="text-xs text-stone-500">Laissez vide les articles que vous n'avez pas comptés : ils ne changent pas.</p>
      <div className="relative"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un article..." className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm" /></div>
      <ul className="divide-y divide-stone-100">
        {shown.length === 0 && <li className="py-6 text-center text-sm text-stone-400">Aucun article.</li>}
        {shown.map(p => {
          const d = diffs.find(x => x.p.id === p.id)?.d;
          return (
            <li key={p.id} className="py-2.5 flex items-center gap-3">
              <div className="min-w-0 flex-1"><p className="text-sm font-bold text-stone-900 break-words">{p.name}</p><p className="text-[11px] text-stone-500">Dans l'appli : {p.stockQuantity} {p.unit}</p></div>
              {d !== undefined && <span className={`text-xs font-black ${d < 0 ? 'text-rose-700' : 'text-emerald-700'}`}>{d > 0 ? '+' : ''}{d}</span>}
              <input type="text" inputMode="decimal" placeholder="compté" value={counts[p.id] ?? ''} onChange={e => setCounts({ ...counts, [p.id]: e.target.value })} data-testid={`count-${p.id}`}
                className="w-24 px-2 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm font-mono-num text-right" />
            </li>);
        })}
      </ul>
    </Shell>
  );
};
