import assert from 'node:assert/strict';
import { applyAdjustments } from '../src/services/stockAdjust';
import { computeTreasury, paidNow, creditPart } from '../src/services/treasury';
const P = (id: string, q: number, cost = 500): any => ({ id, name: id, category: 'x', purchasePrice: cost, sellingPrice: 800, stockQuantity: q, minAlertThreshold: 1, unit: 'pièce' });
let n = 0; const t = (name: string, f: () => void) => { f(); n++; console.log('ok', name); };
t('casse : stock réduit + perte valorisée au coût', () => {
  const r = applyAdjustments([P('a', 10)], [{ productId: 'a', newQty: 7, reason: 'damage' }], 'A');
  assert.equal(r.products[0].stockQuantity, 7); assert.equal(r.lossValue, 1500);
  assert.equal(r.expenses.length, 1); assert.equal(r.expenses[0].category, 'stock_loss'); assert.equal(r.expenses[0].amount, 1500); assert.equal(r.expenses[0].noCash, true);
  assert.equal(r.products[0].stockLog![0].delta, -3);
});
t('consommation perso = prélèvement, pas une perte', () => {
  const r = applyAdjustments([P('a', 10)], [{ productId: 'a', newQty: 9, reason: 'own_use' }], 'A');
  assert.equal(r.lossValue, 0); assert.equal(r.expenses[0].category, 'personal_draw'); assert.equal(r.expenses[0].amount, 500);
});
t('inventaire : une seule charge pour plusieurs écarts, surplus sans coût', () => {
  const r = applyAdjustments([P('a', 10), P('b', 5, 1000), P('c', 4)], [
    { productId: 'a', newQty: 8, reason: 'count' }, { productId: 'b', newQty: 4, reason: 'count' }, { productId: 'c', newQty: 6, reason: 'count' }], 'Inventaire');
  assert.equal(r.changed, 3); assert.equal(r.expenses.length, 1); assert.equal(r.expenses[0].amount, 2000); assert.equal(r.products[2].stockQuantity, 6);
});
t('retrouvé / pas de changement / services / négatif', () => {
  assert.equal(applyAdjustments([P('a', 2)], [{ productId: 'a', newQty: 5, reason: 'found' }], 'A').expenses.length, 0);
  assert.equal(applyAdjustments([P('a', 2)], [{ productId: 'a', newQty: 2, reason: 'damage' }], 'A').changed, 0);
  const s = { ...P('s', 0), isService: true }; assert.equal(applyAdjustments([s], [{ productId: 's', newQty: 5, reason: 'count' }], 'A').changed, 0);
  assert.equal(applyAdjustments([P('a', 2)], [{ productId: 'a', newQty: -4, reason: 'loss' }], 'A').products[0].stockQuantity, 0);
});
t('trésorerie : une perte de stock ne sort aucun argent', () => {
  const e: any = { id: 'e', date: new Date().toISOString(), title: 'x', amount: 1500, category: 'stock_loss', paymentMethod: 'cash', noCash: true };
  assert.equal(paidNow(e), 0); assert.equal(creditPart(e), 0);
  const tr = computeTreasury([], [e], [], [], { openingCash: 10000 } as any);
  assert.equal(tr.balances.cash, 10000);
});
console.log(n, 'tests ok');
