import type { Sale, Expense, Product, Customer, Supplier, ShopSettings } from '../types';
import { formatCurrency, getPaymentMethodDetails, getExpenseCategoryDetails, localDay } from './financials';
import { computeTreasury } from './treasury';
import { stockCostValue } from './stockRules';

const clean = (t: string) => t.replace(/[  ]/g, ' ');
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
export const monthLabel = (y: number, m: number | null) => (m === null ? `année ${y}` : `${MONTHS[m]} ${y}`);
const MONTHS_SHORT = ['Janv', 'Févr', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];

export interface BilanData {
  year: number; month: number | null; label: string;
  revenue: number; cogs: number; grossProfit: number; grossMarginPct: number;
  operatingExpenses: number; netProfit: number; netMarginPct: number; personalDraws: number;
  salesCount: number; averageBasket: number; discounts: number;
  creditSalesCount: number; creditAmount: number;
  byPayment: { label: string; amount: number; pct: number }[];
  expensesByCategory: { label: string; amount: number; pct: number }[];
  topProducts: { name: string; qty: number; revenue: number; margin: number }[];
  prevRevenue: number; prevNet: number; revenueDeltaPct: number | null; netDeltaPct: number | null;
  bestDay: { day: string; revenue: number } | null;
  monthly: { label: string; revenue: number; net: number; count: number }[];   // année : mois par mois
  bestMonth: { label: string; revenue: number } | null;
}

const inMonth = (iso: string, key: string) => localDay(iso).startsWith(key);
const keyOf = (y: number, m: number | null) => (m === null ? String(y) : `${y}-${String(m + 1).padStart(2, '0')}`);
const opEx = (e: Expense) => e.category !== 'supply' && e.category !== 'personal_draw';

function monthTotals(sales: Sale[], expenses: Expense[], key: string) {
  const ms = sales.filter(s => s.status !== 'cancelled' && inMonth(s.date, key));
  const me = expenses.filter(e => inMonth(e.date, key));
  const revenue = ms.reduce((n, s) => n + s.total, 0);
  const profit = ms.reduce((n, s) => n + s.profit, 0);
  const ex = me.filter(opEx).reduce((n, e) => n + e.amount, 0);
  return { ms, me, revenue, profit, ex, net: profit - ex };
}
const delta = (cur: number, prev: number): number | null => (prev > 0 ? Math.round(((cur - prev) / prev) * 100) : null);

/** Calcule tous les chiffres du bilan mensuel (même règles que le reste de l'application). */
export function buildBilanData(sales: Sale[], expenses: Expense[], year: number, month: number | null): BilanData {
  const key = keyOf(year, month);
  // période précédente : le mois d'avant, ou l'année d'avant pour un bilan annuel
  const py = month === null ? year - 1 : month === 0 ? year - 1 : year;
  const pm = month === null ? null : month === 0 ? 11 : month - 1;
  const cur = monthTotals(sales, expenses, key);
  const prev = monthTotals(sales, expenses, keyOf(py, pm));
  const cogs = cur.ms.reduce((n, s) => n + s.totalCost, 0);
  const grossProfit = cur.revenue - cogs;

  const pay = new Map<string, number>();
  for (const s of cur.ms) { const l = getPaymentMethodDetails(s.paymentMethod).label; pay.set(l, (pay.get(l) || 0) + s.total); }
  const byPayment = [...pay.entries()].map(([label, amount]) => ({ label, amount, pct: cur.revenue > 0 ? (amount / cur.revenue) * 100 : 0 })).sort((a, b) => b.amount - a.amount);

  const cat = new Map<string, number>();
  const opTotal = cur.me.filter(opEx).reduce((n, e) => n + e.amount, 0);
  for (const e of cur.me.filter(opEx)) { const l = getExpenseCategoryDetails(e.category).label; cat.set(l, (cat.get(l) || 0) + e.amount); }
  const expensesByCategory = [...cat.entries()].map(([label, amount]) => ({ label, amount, pct: opTotal > 0 ? (amount / opTotal) * 100 : 0 })).sort((a, b) => b.amount - a.amount);

  const prod = new Map<string, { name: string; qty: number; revenue: number; margin: number }>();
  for (const s of cur.ms) for (const i of s.items) {
    const p = prod.get(i.productId) || { name: i.productName, qty: 0, revenue: 0, margin: 0 };
    p.qty += i.quantity; p.revenue += i.totalPrice; p.margin += i.totalPrice - i.costPrice * i.quantity;
    prod.set(i.productId, p);
  }
  const topProducts = [...prod.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  const days = new Map<string, number>();
  for (const s of cur.ms) { const d = localDay(s.date); days.set(d, (days.get(d) || 0) + s.total); }
  const best = [...days.entries()].sort((a, b) => b[1] - a[1])[0];

  const monthly = month === null
    ? Array.from({ length: 12 }, (_, i) => { const t = monthTotals(sales, expenses, keyOf(year, i)); return { label: MONTHS_SHORT[i], revenue: t.revenue, net: t.net, count: t.ms.length }; })
    : [];
  const bm = monthly.filter(x => x.revenue > 0).sort((a, b) => b.revenue - a.revenue)[0];
  const credit = cur.ms.filter(s => s.isCredit);
  return {
    year, month, label: monthLabel(year, month),
    revenue: cur.revenue, cogs, grossProfit, grossMarginPct: cur.revenue > 0 ? (grossProfit / cur.revenue) * 100 : 0,
    operatingExpenses: cur.ex, netProfit: cur.net, netMarginPct: cur.revenue > 0 ? (cur.net / cur.revenue) * 100 : 0,
    personalDraws: cur.me.filter(e => e.category === 'personal_draw').reduce((n, e) => n + e.amount, 0),
    salesCount: cur.ms.length, averageBasket: cur.ms.length ? cur.revenue / cur.ms.length : 0,
    discounts: cur.ms.reduce((n, s) => n + (s.discount || 0), 0),
    creditSalesCount: credit.length, creditAmount: credit.reduce((n, s) => n + Math.max(0, s.total - (s.amountPaid || 0)), 0),
    byPayment, expensesByCategory, topProducts,
    prevRevenue: prev.revenue, prevNet: prev.net, revenueDeltaPct: delta(cur.revenue, prev.revenue), netDeltaPct: delta(cur.net, prev.net),
    bestDay: best ? { day: best[0], revenue: best[1] } : null,
    monthly, bestMonth: bm ? { label: bm.label, revenue: bm.revenue } : null,
  };
}

type RGB = [number, number, number];
const NAVY: RGB = [11, 31, 102], GOLD: RGB = [251, 191, 36], MUTED: RGB = [100, 108, 140], INK: RGB = [27, 35, 71];
const GREEN: RGB = [22, 163, 74], RED: RGB = [220, 38, 38], SOFT: RGB = [238, 242, 255];

/** Génère le bilan de gestion mensuel en PDF A4 (chargé à la demande). */
export async function buildBilanPdf(
  sales: Sale[], expenses: Expense[], products: Product[], customers: Customer[], suppliers: Supplier[],
  settings: ShopSettings, year: number, month: number | null,
): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const d = buildBilanData(sales, expenses, year, month);
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), M = 14;
  const money = (n: number) => clean(formatCurrency(n, settings.currency));
  const pct = (n: number) => `${n.toFixed(0)} %`;
  let y = 0;

  const header = () => {
    doc.setFillColor(...NAVY); doc.rect(0, 0, W, 34, 'F');
    doc.setFillColor(...GOLD); doc.rect(0, 34, W, 1.4, 'F');
    let x = M;
    if (settings.logo) { try { doc.addImage(settings.logo, settings.logo.startsWith('data:image/png') ? 'PNG' : 'JPEG', M, 7, 20, 20); x = M + 25; } catch { /* sans logo */ } }
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
    doc.text(clean(settings.shopName.toUpperCase()), x, 15, { maxWidth: W - x - M });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    doc.text(clean(`${settings.city}, ${settings.country}  |  Tel : ${settings.phone}`), x, 21);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...GOLD);
    doc.text(clean(`BILAN DE GESTION - ${d.label.toUpperCase().replace('ANNÉE', 'ANNEE')}`), x, 29);
    y = 44;
  };
  const footer = () => {
    const n = doc.getNumberOfPages();
    for (let i = 1; i <= n; i++) {
      doc.setPage(i); doc.setFontSize(7.5); doc.setTextColor(...MUTED); doc.setFont('helvetica', 'normal');
      doc.text(clean(`Document de gestion établi avec Nafora d'après les données saisies - ${new Date().toLocaleDateString('fr-FR')}`), M, H - 8);
      doc.text(`Page ${i}/${n}`, W - M, H - 8, { align: 'right' });
    }
  };
  const ensure = (h: number) => { if (y + h > H - 16) { doc.addPage(); y = 16; } };
  const title = (t: string) => {
    ensure(14); doc.setFont('helvetica', 'bold'); doc.setFontSize(11.5); doc.setTextColor(...NAVY); doc.text(clean(t), M, y);
    doc.setDrawColor(...GOLD); doc.setLineWidth(0.7); doc.line(M, y + 1.8, M + 18, y + 1.8); y += 8;
  };
  const kpi = (x: number, w: number, label: string, value: string, sub: string, color: RGB = INK) => {
    doc.setFillColor(...SOFT); doc.roundedRect(x, y, w, 22, 2.5, 2.5, 'F');
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...MUTED); doc.text(clean(label), x + 3, y + 5.5);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12.5); doc.setTextColor(...color); doc.text(clean(value), x + 3, y + 12.5, { maxWidth: w - 6 });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...MUTED); doc.text(clean(sub), x + 3, y + 18, { maxWidth: w - 6 });
  };
  const isYear = d.month === null;
  const trend = (p: number | null) => (p === null ? (isYear ? "pas d'année précédente" : 'pas de mois précédent') : `${p > 0 ? '+' : ''}${p} % vs ${isYear ? 'année préc.' : 'mois préc.'}`);
  const bar = (label: string, amount: number, p: number, color: RGB) => {
    ensure(8); doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...INK);
    doc.text(clean(label), M, y + 3.5, { maxWidth: 70 });
    doc.setFillColor(230, 233, 245); doc.roundedRect(M + 72, y, 60, 4.5, 1.2, 1.2, 'F');
    doc.setFillColor(...color); if (p > 0) doc.roundedRect(M + 72, y, Math.max(1.5, 60 * Math.min(1, p / 100)), 4.5, 1.2, 1.2, 'F');
    doc.setFont('helvetica', 'bold'); doc.text(clean(money(amount)), W - M, y + 3.5, { align: 'right' });
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...MUTED); doc.text(pct(p), M + 134, y + 3.5);
    y += 7;
  };

  header();

  // Chiffres clés
  const cw = (W - 2 * M - 8) / 3;
  kpi(M, cw, "Chiffre d'affaires", money(d.revenue), trend(d.revenueDeltaPct));
  kpi(M + cw + 4, cw, 'Marge brute', money(d.grossProfit), `${pct(d.grossMarginPct)} du chiffre d'affaires`, GREEN);
  kpi(M + 2 * (cw + 4), cw, 'Bénéfice net', money(d.netProfit), trend(d.netDeltaPct), d.netProfit >= 0 ? GREEN : RED);
  y += 26;
  kpi(M, cw, 'Ventes', String(d.salesCount), `Panier moyen ${money(d.averageBasket)}`);
  kpi(M + cw + 4, cw, "Charges d'exploitation", money(d.operatingExpenses), `Marge nette ${pct(d.netMarginPct)}`, RED);
  kpi(M + 2 * (cw + 4), cw, 'Ventes à crédit (reste dû)', money(d.creditAmount), `${d.creditSalesCount} vente(s) à crédit`);
  y += 30;

  // En clair : une phrase pour le commerçant
  {
    const gain = d.netProfit >= 0 ? `Il vous reste ${money(d.netProfit)} de bénéfice net` : `Vous avez perdu ${money(-d.netProfit)} ${isYear ? 'sur cette année' : 'ce mois-ci'}`;
    const msg = d.salesCount === 0 ? `Aucune vente enregistrée sur ${isYear ? "l'année" : 'ce mois'}.` : `${isYear ? "Sur l'" : 'En '}${d.label}, vous avez fait ${d.salesCount} vente(s) pour ${money(d.revenue)}. ${gain}${d.netProfit >= 0 ? ` (${pct(d.netMarginPct)} des ventes).` : '.'}`;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5);
    const lines = doc.splitTextToSize(clean(msg), W - 2 * M - 8);
    doc.setFillColor(255, 247, 221); doc.roundedRect(M, y - 3, W - 2 * M, lines.length * 5 + 6, 2.5, 2.5, 'F');
    doc.setFillColor(...GOLD); doc.rect(M, y - 3, 1.6, lines.length * 5 + 6, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(...NAVY); doc.text(lines, M + 5, y + 2);
    y += lines.length * 5 + 11;
  }

  // Compte de résultat simplifié
  title('Compte de résultat simplifié');
  const rows: [string, string, boolean][] = [
    ["Chiffre d'affaires (ventes)", money(d.revenue), true],
    ['- Coût d\'achat des marchandises vendues', money(d.cogs), false],
    ['= Marge brute', money(d.grossProfit), true],
    ["- Charges d'exploitation (loyer, transport, salaires...)", money(d.operatingExpenses), false],
    ['= Bénéfice net', money(d.netProfit), true],
    ['Prélèvements personnels (hors bénéfice)', money(d.personalDraws), false],
  ];
  rows.forEach(([l, v, b], i) => {
    ensure(8);
    if (b) { doc.setFillColor(...SOFT); doc.rect(M, y - 4.2, W - 2 * M, 7, 'F'); }
    doc.setFont('helvetica', b ? 'bold' : 'normal'); doc.setFontSize(9); doc.setTextColor(...(i === 4 && d.netProfit < 0 ? RED : INK));
    doc.text(clean(l), M + 2, y); doc.text(clean(v), W - M - 2, y, { align: 'right' }); y += 7;
  });
  if (d.discounts > 0) { doc.setFont('helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(...MUTED); doc.text(clean(`Réductions accordées sur la période : ${money(d.discounts)} (déjà déduites du chiffre d'affaires)`), M + 2, y); y += 6; }
  y += 4;

  // Année : mois par mois
  if (isYear && d.monthly.some(x => x.revenue > 0 || x.net !== 0)) {
    title('Mois par mois');
    const maxRev = Math.max(...d.monthly.map(x => x.revenue), 1);
    ensure(10); doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...MUTED);
    doc.text('Mois', M + 2, y); doc.text('Ventes', M + 118, y, { align: 'right' }); doc.text('Bénéfice net', W - M - 2, y, { align: 'right' }); y += 5;
    d.monthly.forEach((mo, i) => {
      ensure(7); if (i % 2 === 0) { doc.setFillColor(...SOFT); doc.rect(M, y - 4, W - 2 * M, 6.3, 'F'); }
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.8); doc.setTextColor(...INK); doc.text(mo.label, M + 2, y);
      doc.setFillColor(...NAVY); if (mo.revenue > 0) doc.roundedRect(M + 16, y - 3, Math.max(1, 60 * (mo.revenue / maxRev)), 3.6, 1, 1, 'F');
      doc.text(clean(money(mo.revenue)), M + 118, y, { align: 'right' });
      doc.setTextColor(...(mo.net >= 0 ? GREEN : RED)); doc.text(clean(money(mo.net)), W - M - 2, y, { align: 'right' }); y += 6.3;
    });
    y += 4;
    if (d.bestMonth) { ensure(10); doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...INK); doc.text(clean(`Meilleur mois : ${d.bestMonth.label} avec ${money(d.bestMonth.revenue)} de ventes.`), M, y); y += 9; }
  }

  // Encaissements
  if (d.byPayment.length) {
    title('Répartition des ventes par mode de paiement');
    d.byPayment.forEach(p => bar(p.label, p.amount, p.pct, NAVY));
    y += 8;
  }
  // Dépenses
  if (d.expensesByCategory.length) {
    title("Où part l'argent : charges par poste");
    d.expensesByCategory.forEach(p => bar(p.label, p.amount, p.pct, [225, 29, 72]));
    y += 8;
  }
  // Meilleurs produits
  if (d.topProducts.length) {
    title('Les 5 produits qui rapportent le plus');
    ensure(10); doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...MUTED);
    doc.text('Produit', M + 2, y); doc.text('Qté', M + 100, y, { align: 'right' }); doc.text('Ventes', M + 140, y, { align: 'right' }); doc.text('Marge', W - M - 2, y, { align: 'right' }); y += 5;
    d.topProducts.forEach((p, i) => {
      ensure(7); if (i % 2 === 0) { doc.setFillColor(...SOFT); doc.rect(M, y - 4, W - 2 * M, 6.5, 'F'); }
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.8); doc.setTextColor(...INK);
      doc.text(clean(p.name), M + 2, y, { maxWidth: 88 }); doc.text(String(Math.round(p.qty * 100) / 100), M + 100, y, { align: 'right' });
      doc.text(clean(money(p.revenue)), M + 140, y, { align: 'right' });
      doc.setTextColor(...(p.margin >= 0 ? GREEN : RED)); doc.text(clean(money(p.margin)), W - M - 2, y, { align: 'right' }); y += 6.5;
    });
    y += 4;
  }
  if (d.bestDay && !isYear) {
    ensure(10); doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...INK);
    doc.text(clean(`Meilleure journée : ${new Date(d.bestDay.day + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} avec ${money(d.bestDay.revenue)} de ventes.`), M, y); y += 9;
  }

  // Situation actuelle
  const tr = computeTreasury(sales, expenses, customers, suppliers, settings);
  ensure(85);
  title(`Situation de la boutique à la date d'édition (${new Date().toLocaleDateString('fr-FR')})`);
  const sit: [string, number][] = [
    ['Argent disponible (espèces)', tr.balances.cash], ['Argent disponible (Mobile Money)', tr.balances.mobile], ['Argent disponible (banque)', tr.balances.bank],
    ['Total disponible', tr.balances.total], ['Clients qui vous doivent', tr.receivables], ['Vous devez aux fournisseurs', tr.payables],
    ['Valeur du stock (prix d\'achat)', stockCostValue(products)],
  ];
  sit.forEach(([l, v], i) => {
    ensure(7); doc.setFont('helvetica', i === 3 ? 'bold' : 'normal'); doc.setFontSize(9); doc.setTextColor(...INK);
    doc.text(clean(l), M + 2, y); doc.text(clean(money(v)), W - M - 2, y, { align: 'right' });
    doc.setDrawColor(228, 231, 242); doc.setLineWidth(0.2); doc.line(M, y + 2, W - M, y + 2); y += 7;
  });
  y += 3;
  ensure(18); doc.setFont('helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(...MUTED);
  doc.text(doc.splitTextToSize(clean("Ce bilan est un document de gestion interne. Il reprend les ventes et dépenses enregistrées dans Nafora ; les achats de marchandises ne sont pas des charges (leur coût est dans le coût d'achat des ventes). Il ne remplace pas une comptabilité certifiée."), W - 2 * M), M, y);

  footer();
  return doc.output('blob');
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
const fileName = (s: ShopSettings, y: number, m: number | null) => `Bilan-${s.shopName}-${y}${m === null ? '' : '-' + String(m + 1).padStart(2, '0')}.pdf`.replace(/[^\w.\-]+/g, '_');

export async function downloadBilanPdf(sales: Sale[], expenses: Expense[], products: Product[], customers: Customer[], suppliers: Supplier[], settings: ShopSettings, year: number, month: number | null) {
  downloadBlob(await buildBilanPdf(sales, expenses, products, customers, suppliers, settings, year, month), fileName(settings, year, month));
}

/** Partage via la feuille de partage du téléphone (WhatsApp, e-mail…) ; sinon téléchargement. */
export async function shareBilanPdf(sales: Sale[], expenses: Expense[], products: Product[], customers: Customer[], suppliers: Supplier[], settings: ShopSettings, year: number, month: number | null): Promise<'shared' | 'downloaded'> {
  const blob = await buildBilanPdf(sales, expenses, products, customers, suppliers, settings, year, month);
  const name = fileName(settings, year, month);
  const file = new File([blob], name, { type: 'application/pdf' });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try { await nav.share({ files: [file], title: `Bilan ${monthLabel(year, month)}`, text: `Bilan de gestion - ${settings.shopName}` }); return 'shared'; }
    catch (e) { if ((e as Error).name === 'AbortError') return 'shared'; }
  }
  downloadBlob(blob, name);
  return 'downloaded';
}
