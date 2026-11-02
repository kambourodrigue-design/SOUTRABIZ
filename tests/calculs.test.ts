// Tests des calculs. Lancer : npx tsx tests/calculs.test.ts
import assert from 'node:assert/strict';
import { calculateSummaryForPeriod, periodStart, formatCurrency } from '../src/services/financials';
import { computeTreasury, paidNow, creditPart } from '../src/services/treasury';
import { applyPurchaseCredit, weightedCost } from '../src/services/purchases';
import { buildDailySummary } from '../src/services/dailySummary';
import { calculateCreditScore, LOAN_MONTHS, LOAN_MONTHLY_RATE } from '../src/services/creditScore';
import { stockCostValue, isOutOfStock, isLowStock, needsRestock } from '../src/services/stockRules';

let n = 0;
const t = (name: string, fn: () => void) => { fn(); n++; console.log('  ✓ ' + name); };
const now = new Date().toISOString();
const sale = (o: any) => ({ id: Math.random().toString(36), date: now, status: 'completed', invoiceNumber: 'F', changeGiven: 0, items: [], amountPaid: 0, ...o });
// Reproduit le calcul du POS : brut, réduction plafonnée, net, bénéfice
const posSale = (gross: number, discountInput: number, cost: number, method: string) => {
  const discount = Math.min(Math.max(0, Math.round(discountInput || 0)), gross);
  const total = gross - discount;
  return sale({ subtotal: gross, discount, total, totalCost: cost, profit: total - cost, paymentMethod: method, isCredit: method === 'credit' });
};
const settings: any = { shopName: 'T', currency: 'XOF', openingCash: 0 };

console.log('Réduction');
t('réduction normale : net = brut - réduction', () => { const s = posSale(10000, 1000, 6000, 'cash'); assert.equal(s.total, 9000); assert.equal(s.profit, 3000); });
t('réduction supérieure au total : plafonnée, total 0', () => { const s = posSale(10000, 99999, 6000, 'cash'); assert.equal(s.discount, 10000); assert.equal(s.total, 0); assert.equal(s.profit, -6000); });
t('réduction négative ou vide ignorée', () => { assert.equal(posSale(5000, -300, 3000, 'cash').total, 5000); assert.equal(posSale(5000, NaN, 3000, 'cash').total, 5000); });
t('réduction décimale arrondie à l\'entier', () => assert.equal(posSale(5000, 100.6, 3000, 'cash').discount, 101));
t('vente à 100 % de réduction : pas d\'entrée d\'argent', () => {
  const tr = computeTreasury([posSale(10000, 10000, 6000, 'cash')], [], [], [], settings);
  assert.equal(tr.balances.total, 0);
});

console.log('Cohérence entre écrans');
const exp: any[] = [
  { id: 'e1', date: now, title: 'Achat', amount: 20000, category: 'supply', paymentMethod: 'cash', paidAmount: 5000 },
  { id: 'e2', date: now, title: 'Loyer', amount: 1000, category: 'rent', paymentMethod: 'cash' },
  { id: 'e3', date: now, title: 'Famille', amount: 500, category: 'personal_draw', paymentMethod: 'cash' },
];
const sales = [posSale(10000, 1000, 6000, 'cash'), posSale(5000, 0, 3000, 'credit'), posSale(2000, 0, 1500, 'wave')];
t('bénéfice net identique : résumé 30 j et résumé du jour', () => {
  const a = calculateSummaryForPeriod(sales, exp, 30);
  const d = buildDailySummary(sales, exp, [], [], settings);
  assert.equal(a.netProfit, d.net); assert.equal(a.revenue, d.revenue); assert.equal(a.netProfit, 4500);
});
t('achats de stock et prélèvements exclus des charges', () => assert.equal(calculateSummaryForPeriod(sales, exp, 30).operatingExpenses, 1000));
t('somme des bénéfices stockés = chiffre d\'affaires - coûts', () => {
  const s = calculateSummaryForPeriod(sales, exp, 30);
  assert.equal(sales.reduce((a: number, x: any) => a + x.profit, 0), s.revenue - s.cogs);
});
t('trésorerie : ouverture + encaissements - sorties payées', () => {
  const cust: any = { id: 'c', name: 'A', phone: '1', totalDebt: 3000, creditLimit: 0, createdAt: now, payments: [{ id: 'p', date: now, amount: 2000, paymentMethod: 'cash' }] };
  const buy = applyPurchaseCredit({ total: 20000, paid: 5000, supplierId: '', newSupplierName: 'G', suppliers: [] });
  const tr = computeTreasury(sales, exp, [cust], buy.suppliers, { ...settings, openingCash: 10000 });
  assert.equal(tr.balances.cash, 10000 + 9000 + 2000 - 5000 - 1000 - 500);
  assert.equal(tr.balances.mobile, 2000);
  assert.equal(tr.receivables, 3000); assert.equal(tr.payables, 15000);
  assert.equal(tr.projected, tr.balances.total + 3000 - 15000);
});
t('vente annulée ignorée partout', () => {
  const c = sale({ total: 9999, totalCost: 1, profit: 9998, paymentMethod: 'cash', isCredit: false, status: 'cancelled' });
  assert.equal(calculateSummaryForPeriod([c], [], 30).revenue, 0);
  assert.equal(computeTreasury([c], [], [], [], settings).balances.total, 0);
});

console.log('Achats et fournisseurs');
t('achat payé en totalité : pas de dette', () => { const r = applyPurchaseCredit({ total: 1000, paid: 1000, supplierId: '', newSupplierName: '', suppliers: [] }); assert.equal(r.credit, 0); });
t('paiement supérieur au total plafonné', () => { const r = applyPurchaseCredit({ total: 1000, paid: 5000, supplierId: '', newSupplierName: 'X', suppliers: [] }); assert.equal(r.credit, 0); });
t('achat à crédit : dette = total - payé, fournisseur créé', () => { const r = applyPurchaseCredit({ total: 1000, paid: 250, supplierId: '', newSupplierName: 'X', suppliers: [] }); assert.equal(r.credit, 750); assert.equal(r.suppliers[0].totalDebt, 750); });
t('achat à crédit sans fournisseur : aucune dette fantôme', () => { const r = applyPurchaseCredit({ total: 1000, paid: 0, supplierId: '', newSupplierName: '', suppliers: [] }); assert.equal(r.credit, 0); });
t('paidNow / creditPart cohérents', () => { const e: any = { amount: 1000, paidAmount: 300 }; assert.equal(paidNow(e) + creditPart(e), 1000); assert.equal(paidNow({ amount: 800 } as any), 800); });
t('coût moyen pondéré', () => { assert.equal(weightedCost(10, 1000, 10, 1400), 1200); assert.equal(weightedCost(0, 1000, 5, 1400), 1400); assert.equal(weightedCost(-3, 1000, 5, 1400), 1400); });
t('coût moyen pondéré avec décimales (kg)', () => assert.equal(weightedCost(2.5, 1000, 2.5, 2000), 1500));

console.log('Stock et prestations');
const riz: any = { id: 'a', name: 'Riz', category: 'x', purchasePrice: 1000, sellingPrice: 1300, stockQuantity: 10, minAlertThreshold: 5, unit: 'sac' };
const svc: any = { id: 's', name: 'Saisie', category: 'x', purchasePrice: 200, sellingPrice: 3000, stockQuantity: 0, minAlertThreshold: 0, unit: 'dossier', isService: true };
t('valeur du stock sans prestation', () => assert.equal(stockCostValue([riz, svc]), 10000));
t('prestation jamais en rupture ni à racheter', () => { assert.equal(isOutOfStock(svc), false); assert.equal(isLowStock(svc), false); assert.equal(needsRestock(svc), false); });
t('article en rupture et stock bas', () => { assert.equal(isOutOfStock({ ...riz, stockQuantity: 0 }), true); assert.equal(isLowStock({ ...riz, stockQuantity: 3 }), true); assert.equal(needsRestock({ ...riz, stockQuantity: 5 }), true); });
t('stock négatif compté comme 0 dans la valeur', () => assert.equal(stockCostValue([{ ...riz, stockQuantity: -4 }]), 0));

console.log('Périodes');
t('période 30 jours = 30 jours calendaires, aujourd\'hui inclus', () => {
  const ref = new Date(2026, 10, 2, 15, 30);
  assert.equal(new Date(periodStart(30, ref)).getTime(), new Date(2026, 9, 4).getTime());
  assert.equal(new Date(periodStart(1, ref)).getTime(), new Date(2026, 10, 2).getTime());
});
t('vente de ce matin comptée, vente d\'il y a 31 jours exclue', () => {
  const old = sale({ date: new Date(Date.now() - 31 * 86400000).toISOString(), total: 500, totalCost: 0, profit: 500, paymentMethod: 'cash', isCredit: false });
  assert.equal(calculateSummaryForPeriod([old, sales[0]], [], 30).revenue, 9000);
});

console.log('Score de crédit et prêt');
t('aucune vente : pas de division par zéro, prêt 0', () => {
  const cs = calculateCreditScore([], [], [], [], false, []);
  assert.ok(Number.isFinite(cs.totalScore)); assert.equal(cs.maxRecommendedLoan, 0);
});
t('score borné entre 0 et 1000', () => { const cs = calculateCreditScore(sales, exp, [], [riz], true, []); assert.ok(cs.totalScore >= 0 && cs.totalScore <= 1000); });
t('mensualité du prêt conseillé ≤ capacité (plusieurs bénéfices)', () => {
  for (const profit of [3000, 8000, 15000, 40000, 120000]) {
    const sl: any[] = []; for (let i = 0; i < 25; i++) sl.push(sale({ date: new Date(Date.now() - i * 86400000).toISOString(), total: profit + 1000, totalCost: 1000, profit, paymentMethod: 'cash', isCredit: false }));
    const cs = calculateCreditScore(sl, [], [], [riz], false, []);
    const r = LOAN_MONTHLY_RATE;
    const pay = cs.maxRecommendedLoan > 0 ? Math.round((cs.maxRecommendedLoan * r) / (1 - Math.pow(1 + r, -LOAN_MONTHS))) : 0;
    assert.ok(pay <= cs.maxMonthlyPayment, `profit ${profit}: ${pay} > ${cs.maxMonthlyPayment}`);
  }
});
t('perte : capacité et prêt à 0', () => {
  const cs = calculateCreditScore([sale({ total: 1000, totalCost: 900, profit: 100, paymentMethod: 'cash', isCredit: false })], [{ id: 'x', date: now, title: 'Loyer', amount: 90000, category: 'rent', paymentMethod: 'cash' } as any], [], [], false, []);
  assert.equal(cs.maxRecommendedLoan, 0); assert.equal(cs.maxMonthlyPayment, 0);
});

console.log('Affichage');
t('formatCurrency arrondit et formate', () => { assert.ok(formatCurrency(1234.6).includes('1') && formatCurrency(1234.6).endsWith('F CFA')); assert.ok(formatCurrency(0).startsWith('0')); });

console.log(`\n${n} tests réussis`);
