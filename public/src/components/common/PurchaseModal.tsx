import React, { useState } from 'react';
import { Expense, PaymentMethod, ShopSettings, Supplier } from '../../types';
import { SupplierCreditFields } from './SupplierCreditFields';
import { applyPurchaseCredit } from '../../services/purchases';
import { newId } from '../../../shared/syncCore';

interface Props {
  settings: ShopSettings;
  suppliers: Supplier[];
  presetSupplierId?: string;
  onUpdateSuppliers: (suppliers: Supplier[]) => void;
  onAddExpense: (expense: Expense) => void;
  onClose: () => void;
}

/** Achat de marchandises chez un fournisseur : payé, à crédit ou en partie. */
export const PurchaseModal: React.FC<Props> = ({
  settings, suppliers, presetSupplierId = '', onUpdateSuppliers, onAddExpense, onClose,
}) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [supplierId, setSupplierId] = useState(presetSupplierId);
  const [newSupplier, setNewSupplier] = useState('');
  const [paidInput, setPaidInput] = useState<number | null>(0); // par défaut : à crédit
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [dueDate, setDueDate] = useState('');
  const paid = Math.min(paidInput ?? amount, amount);
  const field = 'w-full mt-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm';

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || amount <= 0) return;
    if (paid < amount && !supplierId && !newSupplier.trim()) {
      alert('Pour un achat à crédit, choisissez ou saisissez le fournisseur.');
      return;
    }
    const res = applyPurchaseCredit({ total: amount, paid, supplierId, newSupplierName: newSupplier, suppliers });
    let list = res.suppliers;
    if (res.supplierId && res.credit > 0 && dueDate) {
      list = list.map((s) => (s.id === res.supplierId ? { ...s, dueDate: new Date(dueDate).toISOString() } : s));
    }
    if (list !== suppliers) onUpdateSuppliers(list);
    onAddExpense({
      id: newId('exp'),
      date: new Date().toISOString(),
      title: title.trim(),
      amount,
      category: 'supply',
      paymentMethod: method,
      supplierId: res.supplierId,
      paidAmount: paid,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 p-5 sm:p-6 my-auto space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <h3 className="font-black text-lg text-stone-900">🚚 Achat chez un fournisseur</h3>
          <button onClick={onClose} className="text-stone-400 p-1">✕</button>
        </div>
        <form onSubmit={submit} className="space-y-3.5">
          <div>
            <label className="text-xs font-bold text-stone-700">Marchandises achetées *</label>
            <input required className={field} placeholder="Ex : 10 sacs de riz, 5 cartons d'huile…" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-bold text-stone-700">Montant total de l'achat ({settings.currency}) *</label>
            <input required type="number" min="1" className={field + ' text-base font-black font-mono-num'} value={amount || ''}
              onChange={(e) => setAmount(Number(e.target.value))} />
          </div>
          {amount > 0 && (
            <>
              <SupplierCreditFields
                total={amount} currency={settings.currency} suppliers={suppliers}
                supplierId={supplierId} setSupplierId={setSupplierId}
                newSupplierName={newSupplier} setNewSupplierName={setNewSupplier}
                paid={paid} setPaid={setPaidInput}
              />
              {paid > 0 && (
                <div>
                  <label className="text-xs font-bold text-stone-700">Partie payée par</label>
                  <select className={field} value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
                    <option value="cash">Espèces Caisse</option>
                    <option value="wave">Wave</option>
                    <option value="orange_money">Orange Money</option>
                    <option value="mtn_momo">MTN MoMo</option>
                    <option value="moov_money">Moov Money</option>
                    <option value="bank_transfer">Compte Bancaire</option>
                  </select>
                </div>
              )}
              {paid < amount && (
                <div>
                  <label className="text-xs font-bold text-stone-700">Date limite de paiement (optionnel)</label>
                  <input type="date" className={field} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
              )}
            </>
          )}
          <p className="text-[11px] text-stone-500">
            Pensez à ajouter les quantités reçues dans <strong>Stocks → + Réappro</strong> (sans cocher « Enregistrer cet achat », pour ne pas le compter deux fois).
          </p>
          <div className="pt-1 flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 font-bold text-sm">Annuler</button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-sm">Enregistrer l'achat</button>
          </div>
        </form>
      </div>
    </div>
  );
};
