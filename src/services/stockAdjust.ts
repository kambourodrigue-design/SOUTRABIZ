// Ajustements de stock et inventaire.
// Une perte (casse, vol, périmé, écart d'inventaire en moins) est une charge valorisée au coût d'achat,
// SANS sortie d'argent : elle réduit le bénéfice mais pas la trésorerie.
// La consommation personnelle est un prélèvement (hors bénéfice), également sans sortie d'argent.
import { newId } from '../../shared/syncCore';
import { Product, Expense } from '../types';

export type AdjustReason = 'damage' | 'expired' | 'theft' | 'loss' | 'own_use' | 'count' | 'found' | 'other';
export interface ReasonInfo { id: AdjustReason; label: string; icon: string; expense: 'stock_loss' | 'personal_draw' | null; dir: 'out' | 'in' | 'any' }

export const REASONS: ReasonInfo[] = [
  { id: 'damage', label: 'Casse / abîmé', icon: '💥', expense: 'stock_loss', dir: 'out' },
  { id: 'expired', label: 'Périmé / gâté', icon: '⏳', expense: 'stock_loss', dir: 'out' },
  { id: 'theft', label: 'Vol', icon: '🕵️', expense: 'stock_loss', dir: 'out' },
  { id: 'loss', label: 'Perte / manque', icon: '❓', expense: 'stock_loss', dir: 'out' },
  { id: 'own_use', label: 'Pris pour moi / la famille', icon: '🏠', expense: 'personal_draw', dir: 'out' },
  { id: 'count', label: 'Correction après comptage', icon: '🔢', expense: 'stock_loss', dir: 'any' },
  { id: 'found', label: 'Retrouvé / reçu sans achat', icon: '🎁', expense: null, dir: 'in' },
  { id: 'other', label: 'Autre (sans coût)', icon: '✏️', expense: null, dir: 'any' },
];
export const reasonInfo = (id: string): ReasonInfo => REASONS.find(r => r.id === id) || REASONS[REASONS.length - 1];

export const round3 = (n: number) => Math.round(n * 1000) / 1000;

export interface Adjustment { productId: string; newQty: number; reason: AdjustReason; note?: string }
export interface AdjustResult { products: Product[]; expenses: Expense[]; lossValue: number; changed: number }

/** Applique une liste d'ajustements. Un seul prélèvement/une seule perte par motif et par lot (ex. un inventaire = une charge). */
export function applyAdjustments(products: Product[], adj: Adjustment[], title: string, nowIso = new Date().toISOString()): AdjustResult {
  const byId = new Map(adj.map(a => [a.productId, a]));
  const cost: Record<'stock_loss' | 'personal_draw', number> = { stock_loss: 0, personal_draw: 0 };
  const lines: Record<'stock_loss' | 'personal_draw', string[]> = { stock_loss: [], personal_draw: [] };
  let changed = 0;
  const next = products.map(p => {
    const a = byId.get(p.id);
    if (!a || p.isService) return p;
    const newQty = Math.max(0, round3(a.newQty));
    const delta = round3(newQty - p.stockQuantity);
    if (delta === 0) return p;
    changed++;
    const info = reasonInfo(a.reason);
    if (info.expense && delta < 0) {
      const v = Math.round(-delta * (p.purchasePrice || 0));
      cost[info.expense] += v;
      lines[info.expense].push(`${p.name} ${delta}`);
    }
    const log = [...(p.stockLog || []), { d: nowIso, delta, reason: a.reason, ...(a.note ? { note: a.note.slice(0, 80) } : {}) }].slice(-30);
    return { ...p, stockQuantity: newQty, stockLog: log };
  });
  const expenses: Expense[] = [];
  for (const k of ['stock_loss', 'personal_draw'] as const) {
    if (cost[k] > 0) {
      expenses.push({
        id: newId('exp'), date: nowIso,
        title: k === 'stock_loss' ? `${title} — perte de stock` : `${title} — consommation personnelle`,
        amount: cost[k], category: k, paymentMethod: 'cash', noCash: true,
        notes: lines[k].slice(0, 12).join(', ') + (lines[k].length > 12 ? '…' : ''),
      });
    }
  }
  return { products: next, expenses, lossValue: cost.stock_loss, changed };
}
