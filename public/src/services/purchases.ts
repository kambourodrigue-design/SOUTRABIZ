import { Supplier } from '../types';
import { newId } from '../../shared/syncCore';

export interface PurchaseCreditInput {
  total: number;                 // coût total de l'achat
  paid: number;                  // payé maintenant
  supplierId: string;            // fournisseur existant ('' si aucun)
  newSupplierName: string;       // ou nouveau fournisseur à créer
  suppliers: Supplier[];
}
export interface PurchaseCreditResult { suppliers: Supplier[]; supplierId?: string; credit: number }

/** Ajoute la partie non payée aux dettes du fournisseur (le crée au besoin). */
export function applyPurchaseCredit(i: PurchaseCreditInput): PurchaseCreditResult {
  const paid = Math.min(Math.max(0, i.paid), i.total);
  const credit = Math.max(0, i.total - paid);
  let supplierId = i.supplierId || undefined;
  let suppliers = i.suppliers;
  if (!supplierId && i.newSupplierName.trim()) {
    const s: Supplier = {
      id: newId('sup'), name: i.newSupplierName.trim(), phone: 'Non renseigné',
      totalDebt: 0, createdAt: new Date().toISOString(), payments: [],
    };
    suppliers = [...suppliers, s];
    supplierId = s.id;
  }
  if (credit > 0 && supplierId) {
    suppliers = suppliers.map((s) => (s.id === supplierId ? { ...s, totalDebt: (s.totalDebt || 0) + credit } : s));
  }
  return { suppliers, supplierId, credit: supplierId ? credit : 0 };
}
