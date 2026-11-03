import React, { useMemo, useState } from 'react';
import { X, Search, Ban } from 'lucide-react';
import { Sale, ShopSettings } from '../../types';
import { formatCurrency } from '../../services/financials';
import { uiConfirm } from '../common/dialogs';

interface Props {
  sales: Sale[];
  settings: ShopSettings;
  canCancel: boolean;
  onCancel: (saleId: string) => void;
  onClose: () => void;
}

/** Historique des ventes (les plus récentes d'abord) avec annulation d'une vente saisie par erreur. */
export const SalesHistoryModal: React.FC<Props> = ({ sales, settings, canCancel, onCancel, onClose }) => {
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return [...sales]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .filter(s => !t || s.invoiceNumber.toLowerCase().includes(t) || (s.customerName || '').toLowerCase().includes(t)
        || s.items.some(i => i.productName.toLowerCase().includes(t)))
      .slice(0, 150);
  }, [sales, q]);

  const ask = async (s: Sale) => {
    const unpaid = s.isCredit ? Math.max(0, s.total - (s.amountPaid || 0)) : 0;
    const lines = [
      `Annuler la vente ${s.invoiceNumber} de ${formatCurrency(s.total, settings.currency)} ?`,
      '',
      '• Les articles sont remis en stock.',
      '• Elle ne compte plus dans vos ventes, bénéfices et trésorerie.',
    ];
    if (s.isCredit && s.customerName) lines.push(`• La dette de ${s.customerName} baisse de ${formatCurrency(unpaid, settings.currency)}.`);
    if (s.isCredit && s.amountPaid > 0) lines.push(`• L'acompte de ${formatCurrency(s.amountPaid, settings.currency)} doit être rendu au client.`);
    lines.push('', 'Cette action est définitive.');
    if (await uiConfirm(lines.join('\n'))) onCancel(s.id);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4" onClick={onClose} data-testid="sales-history">
      <div className="w-full sm:max-w-lg max-h-[88vh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-white border border-stone-200 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-stone-100">
          <h3 className="font-black text-stone-900">Historique des ventes</h3>
          <button onClick={onClose} aria-label="Fermer" className="p-1.5 rounded-lg hover:bg-stone-100"><X className="w-5 h-5 text-stone-500" /></button>
        </div>
        <div className="p-3 border-b border-stone-100">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="N° de reçu, client ou article"
              className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm" />
          </div>
        </div>
        <div className="overflow-y-auto p-3 space-y-2">
          {list.length === 0 && <p className="text-center text-sm text-stone-400 py-8">Aucune vente.</p>}
          {list.map(s => {
            const cancelled = s.status === 'cancelled';
            return (
              <div key={s.id} className={`p-3 rounded-xl border ${cancelled ? 'bg-stone-50 border-stone-200 opacity-70' : 'bg-white border-stone-200'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-stone-900 flex flex-wrap items-center gap-1.5">
                      <span>{s.invoiceNumber}</span>
                      {cancelled && <span className="px-1.5 rounded bg-stone-200 text-stone-700 text-[10px] font-bold">Annulée</span>}
                      {!cancelled && s.isCredit && <span className="px-1.5 rounded bg-red-100 text-red-700 text-[10px] font-bold">À crédit</span>}
                      {!cancelled && s.isCredit && s.amountPaid > 0 && <span className="px-1.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">Acompte {formatCurrency(s.amountPaid, settings.currency)}</span>}
                    </div>
                    <div className="text-xs text-stone-500">
                      {new Date(s.date).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      {s.customerName ? ` • ${s.customerName}` : ''} • {s.items.length} article(s)
                    </div>
                  </div>
                  <div className={`text-sm font-black font-mono-num whitespace-nowrap ${cancelled ? 'line-through text-stone-400' : 'text-stone-900'}`}>{formatCurrency(s.total, settings.currency)}</div>
                </div>
                {canCancel && !cancelled && (
                  <button onClick={() => ask(s)} data-testid="cancel-sale"
                    className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-50">
                    <Ban className="w-3.5 h-3.5" /> Annuler cette vente
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
