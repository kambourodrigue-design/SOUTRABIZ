// Tests du bilan mensuel. Lancer : npx tsx tests/bilan.test.ts
import assert from 'node:assert/strict';
import { buildBilanData } from '../src/services/bilanPdf';
const mk = (date: string, total: number, cost: number, o: any = {}) => ({ id: Math.random().toString(36), date, status: 'completed', invoiceNumber: 'F', items: [{ productId: 'p1', productName: 'Sucre', quantity: 2, unitPrice: total / 2, totalPrice: total, costPrice: cost / 2 }], subtotal: total, discount: 0, total, totalCost: cost, profit: total - cost, paymentMethod: 'cash', amountPaid: total, changeGiven: 0, isCredit: false, ...o });
const ex = (date: string, amount: number, category: string) => ({ id: Math.random().toString(36), date, title: 't', amount, category, paymentMethod: 'cash' });
const sales: any[] = [
  mk('2026-10-05T10:00:00', 10000, 6000), mk('2026-10-20T10:00:00', 5000, 3000, { paymentMethod: 'credit', isCredit: true, amountPaid: 1000 }),
  mk('2026-10-21T10:00:00', 999, 1, { status: 'cancelled' }), mk('2026-09-10T10:00:00', 6000, 3000),
];
const expenses: any[] = [ex('2026-10-06T10:00:00', 2000, 'rent'), ex('2026-10-07T10:00:00', 9000, 'supply'), ex('2026-10-08T10:00:00', 500, 'personal_draw')];
const d = buildBilanData(sales, expenses, 2026, 9);
let n = 0; const t = (name: string, f: () => void) => { f(); n++; console.log('  ✓ ' + name); };
t('chiffre d\'affaires hors vente annulée', () => assert.equal(d.revenue, 15000));
t('marge brute = ventes - coût', () => assert.equal(d.grossProfit, 6000));
t('charges : sans achats de marchandises ni prélèvements', () => { assert.equal(d.operatingExpenses, 2000); assert.equal(d.personalDraws, 500); });
t('bénéfice net', () => assert.equal(d.netProfit, 4000));
t('reste dû des ventes à crédit', () => { assert.equal(d.creditSalesCount, 1); assert.equal(d.creditAmount, 4000); });
t('comparaison avec le mois précédent', () => { assert.equal(d.prevRevenue, 6000); assert.equal(d.revenueDeltaPct, 150); });
t('produit le plus vendu agrégé', () => { assert.equal(d.topProducts[0].name, 'Sucre'); assert.equal(d.topProducts[0].qty, 4); assert.equal(d.topProducts[0].revenue, 15000); });
t('janvier : le mois précédent est décembre de l\'année d\'avant', () => assert.equal(buildBilanData([], [], 2026, 0).prevRevenue, 0));
t('mois sans vente : pas de division par zéro', () => { const e = buildBilanData([], [], 2026, 3); assert.equal(e.grossMarginPct, 0); assert.equal(e.averageBasket, 0); assert.equal(e.revenueDeltaPct, null); });
t('bilan annuel : somme des mois, comparaison à l\'année précédente', () => {
  const y = buildBilanData(sales, expenses, 2026, null);
  assert.equal(y.revenue, 21000); assert.equal(y.monthly.length, 12);
  assert.equal(y.monthly[9].revenue, 15000); assert.equal(y.monthly[8].revenue, 6000);
  assert.equal(y.prevRevenue, 0); assert.equal(y.revenueDeltaPct, null);
  assert.equal(y.bestMonth?.label, 'Oct');
  assert.equal(buildBilanData(sales, expenses, 2027, null).prevRevenue, 21000);
});
console.log(`\n${n} tests réussis`);
