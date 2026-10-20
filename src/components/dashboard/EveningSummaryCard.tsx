import React, { useMemo } from 'react';
import { MessageCircle, Moon } from 'lucide-react';
import { Customer, Expense, Product, Sale, ShopSettings } from '../../types';
import { formatCurrency } from '../../services/financials';
import { buildDailySummary, summaryWhatsAppUrl } from '../../services/dailySummary';

interface Props {
  sales: Sale[]; expenses: Expense[]; products: Product[]; customers: Customer[]; settings: ShopSettings;
  onNavigate: (tab: string) => void;
}

/** Résumé de la journée : mis en avant à partir de 17 h, avec envoi WhatsApp en un appui. */
export const EveningSummaryCard: React.FC<Props> = ({ sales, expenses, products, customers, settings, onNavigate }) => {
  const sum = useMemo(() => buildDailySummary(sales, expenses, products, customers, settings), [sales, expenses, products, customers, settings]);
  const evening = new Date().getHours() >= 17;
  const m = (n: number) => formatCurrency(n, settings.currency);
  const share = async () => {
    const nav: any = navigator;
    if (nav.share) { try { await nav.share({ text: sum.text }); return; } catch { /* annulé : on ne fait rien */ } }
  };
  return (
    <div className={`rounded-2xl border p-4 space-y-3 ${evening ? 'bg-indigo-950 text-white border-indigo-800' : 'bg-white border-stone-200 text-stone-900'}`} data-testid="evening-summary">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-black text-sm flex items-center gap-1.5"><Moon className="w-4 h-4 text-amber-400" /> {evening ? 'Bilan de votre journée' : "Résumé d'aujourd'hui"}</h3>
        <span className={`text-[11px] ${evening ? 'text-indigo-200' : 'text-stone-500'}`}>{sum.salesCount} vente{sum.salesCount > 1 ? 's' : ''}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[['Ventes', m(sum.revenue)], ['Bénéfice', m(sum.profit)], ['Résultat', m(sum.net)]].map(([l, v]) => (
          <div key={l} className={`rounded-xl p-2 ${evening ? 'bg-white/10' : 'bg-stone-50'}`}><div className={`text-[10px] ${evening ? 'text-indigo-200' : 'text-stone-500'}`}>{l}</div><div className="text-xs font-black font-mono-num break-words">{v}</div></div>))}
      </div>
      {(sum.lowStock.length > 0 || sum.toRemind.length > 0) && (
        <div className={`text-[11px] space-y-0.5 ${evening ? 'text-indigo-100' : 'text-stone-600'}`}>
          {sum.lowStock.length > 0 && <button onClick={() => onNavigate('stock')} className="block underline text-left">📦 {sum.lowStock.length} produit(s) à racheter</button>}
          {sum.toRemind.length > 0 && <button onClick={() => onNavigate('debts')} className="block underline text-left">📒 {sum.toRemind.length} client(s) à relancer</button>}
        </div>)}
      <div className="flex gap-2">
        <a href={summaryWhatsAppUrl(sum.text, settings.phone)} target="_blank" rel="noopener noreferrer" data-testid="summary-wa"
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-xs active:scale-95"><MessageCircle className="w-3.5 h-3.5" /> Envoyer sur mon WhatsApp</a>
        {typeof navigator !== 'undefined' && (navigator as any).share && <button onClick={share} className={`px-3 py-2 rounded-xl border text-xs font-bold ${evening ? 'border-indigo-600' : 'border-stone-300'}`}>Partager</button>}
      </div>
    </div>
  );
};
