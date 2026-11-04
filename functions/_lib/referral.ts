// Parrainage : chaque commerçant a un code (donc un lien). Quand un filleul paie un abonnement,
// le parrain gagne une commission dont le taux dépend du nombre de filleuls payants (voir shared/referral.ts).
// Tout est protégé : si la migration v9 n'a pas été faite, l'application fonctionne comme avant.

import { json, fail, readBody, str, randomHex, type Env, type UserRow } from './util';
import { loadBilling } from './billing';
import { REFERRAL_TIERS, referralPct, nextReferralTier, referralCommission, cleanReferralCode } from '../../shared/referral';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const newCode = () => { const b = new Uint8Array(7); crypto.getRandomValues(b); return Array.from(b, x => ALPHABET[x % ALPHABET.length]).join(''); };

/** Code de parrainage de la boutique (créé au besoin). null si la migration v9 n'est pas faite. */
export async function ensureCode(env: Env, shopId: string): Promise<string | null> {
  try {
    const read = async () => (await env.DB.prepare('SELECT referral_code FROM shops WHERE shop_id = ?').bind(shopId).first<{ referral_code: string | null }>());
    const r = await read();
    if (!r) return null;
    if (r.referral_code) return r.referral_code;
    for (let i = 0; i < 6; i++) {
      try {
        const res = await env.DB.prepare('UPDATE shops SET referral_code = ? WHERE shop_id = ? AND referral_code IS NULL').bind(newCode(), shopId).run();
        if (res.meta?.changes) break;
        break;
      } catch { /* collision d'unicité : on retente avec un autre code */ }
    }
    return (await read())?.referral_code || null;
  } catch { return null; }
}

/** À l'inscription : rattache la nouvelle boutique à son parrain (code invalide ou auto-parrainage ignorés). */
export async function attachReferral(env: Env, shopId: string, rawCode: unknown): Promise<void> {
  try {
    await ensureCode(env, shopId);
    const code = cleanReferralCode(rawCode);
    if (!code) return;
    const ref = await env.DB.prepare('SELECT shop_id FROM shops WHERE referral_code = ?').bind(code).first<{ shop_id: string }>();
    if (!ref || ref.shop_id === shopId) return;
    await env.DB.prepare('UPDATE shops SET referred_by = ? WHERE shop_id = ? AND referred_by IS NULL').bind(ref.shop_id, shopId).run();
  } catch { /* parrainage indisponible : l'inscription n'est jamais bloquée */ }
}

interface Filleul { shopId: string; name: string; city: string; joinedAt: string; paid: number; state: 'paid' | 'trial' }

async function filleuls(env: Env, shopId: string): Promise<Filleul[]> {
  const rows = (await env.DB.prepare(
    `SELECT s.shop_id, s.shop_name, s.city,
            (SELECT MIN(u.created_at) FROM users u WHERE u.shop_id = s.shop_id) AS joined,
            COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.shop_id = s.shop_id AND p.status = 'approved'), 0) AS paid
     FROM shops s WHERE s.referred_by = ? ORDER BY joined DESC LIMIT 500`).bind(shopId).all<any>()).results;
  return rows.map(r => ({ shopId: r.shop_id, name: r.shop_name || 'Boutique', city: r.city || '', joinedAt: r.joined || '', paid: Number(r.paid) || 0, state: Number(r.paid) > 0 ? 'paid' as const : 'trial' as const }));
}

export function computeReferral(list: Filleul[], paidOut: number) {
  const paying = list.filter(f => f.paid > 0).length;
  const pct = referralPct(paying);
  const totalPaid = list.reduce((n, f) => n + f.paid, 0);
  const earned = referralCommission(totalPaid, pct);
  const next = nextReferralTier(paying);
  return {
    invited: list.length, paying, pct, totalPaid, earned, paidOut, balance: Math.max(0, earned - paidOut),
    next: next ? { need: next.min - paying, pct: next.pct } : null,
    items: list.map(f => ({ name: f.name, city: f.city, joinedAt: f.joinedAt, state: f.state, paid: f.paid, commission: referralCommission(f.paid, pct) })),
  };
}
const payoutsOf = async (env: Env, shopId: string) =>
  Number((await env.DB.prepare('SELECT COALESCE(SUM(amount),0) AS n FROM referral_payouts WHERE shop_id = ?').bind(shopId).first<{ n: number }>())?.n) || 0;

/** GET /api/referral : lien, paliers et gains du commerçant connecté (propriétaire seulement). */
export async function myReferral(env: Env, user: UserRow) {
  if ((user.shop_role || 'owner') !== 'owner') return fail('Réservé au propriétaire de la boutique.', 403);
  const code = await ensureCode(env, user.shop_id);
  if (!code) return json({ enabled: false });
  const b = await loadBilling(env);
  let paidOut = 0, list: Filleul[] = [];
  try { [list, paidOut] = await Promise.all([filleuls(env, user.shop_id), payoutsOf(env, user.shop_id)]); } catch { return json({ enabled: false }); }
  return json({ enabled: true, code, tiers: REFERRAL_TIERS, currency: b.currency, price12: b.price12, ...computeReferral(list, paidOut) });
}

/** Administration : /api/admin/referrals, /api/admin/referrals/<boutique>, /api/admin/referrals/<boutique>/payout */
export async function adminReferrals(req: Request, env: Env, parts: string[]) {
  const shopId = parts[2];
  const b = await loadBilling(env);
  if (!shopId) {
    if (req.method !== 'GET') return fail('Méthode non autorisée.', 405);
    let rows: any[] = [];
    try {
      rows = (await env.DB.prepare(
        `SELECT r.referred_by AS shop_id, COUNT(*) AS invited, SUM(CASE WHEN r.paid > 0 THEN 1 ELSE 0 END) AS paying, SUM(r.paid) AS total_paid
         FROM (SELECT s.referred_by, COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.shop_id = s.shop_id AND p.status = 'approved'), 0) AS paid
               FROM shops s WHERE s.referred_by IS NOT NULL) r
         GROUP BY r.referred_by ORDER BY invited DESC LIMIT 300`).all<any>()).results;
    } catch { return json({ enabled: false, items: [], currency: b.currency }); }
    const items = [];
    for (const r of rows) {
      const info = await env.DB.prepare(
        `SELECT s.shop_name, s.city, s.referral_code, u.name, u.phone,
                COALESCE((SELECT SUM(amount) FROM referral_payouts WHERE shop_id = s.shop_id), 0) AS paid_out
         FROM shops s LEFT JOIN users u ON u.shop_id = s.shop_id AND COALESCE(u.shop_role,'owner') = 'owner'
         WHERE s.shop_id = ? LIMIT 1`).bind(r.shop_id).first<any>();
      const pct = referralPct(Number(r.paying) || 0);
      const earned = referralCommission(Number(r.total_paid) || 0, pct);
      items.push({
        shopId: r.shop_id, shopName: info?.shop_name || '—', city: info?.city || '', owner: info?.name || '', phone: info?.phone || '', code: info?.referral_code || '',
        invited: r.invited, paying: Number(r.paying) || 0, pct, earned, paidOut: Number(info?.paid_out) || 0, balance: Math.max(0, earned - (Number(info?.paid_out) || 0)),
      });
    }
    return json({ enabled: true, currency: b.currency, items });
  }

  const shop = await env.DB.prepare('SELECT shop_id, shop_name, city, referral_code, referred_by FROM shops WHERE shop_id = ?').bind(shopId).first<any>();
  if (!shop) return fail('Boutique introuvable.', 404);

  if (parts[3] === 'payout') {
    if (req.method !== 'POST') return fail('Méthode non autorisée.', 405);
    const body = await readBody(req, 2000);
    const amount = Math.round(Number(body.amount));
    const cur = computeReferral(await filleuls(env, shopId), await payoutsOf(env, shopId));
    if (!Number.isFinite(amount) || amount <= 0) return fail('Montant invalide.');
    if (amount > cur.balance) return fail(`Le montant dépasse le solde à verser (${cur.balance}).`);
    await env.DB.prepare('INSERT INTO referral_payouts (id, shop_id, amount, note, created_at) VALUES (?,?,?,?,?)')
      .bind('pay-' + randomHex(8), shopId, amount, str(body.note, 200) || null, new Date().toISOString()).run();
  } else if (req.method !== 'GET') return fail('Méthode non autorisée.', 405);

  let parent: string | null = null;
  if (shop.referred_by) parent = (await env.DB.prepare('SELECT shop_name FROM shops WHERE shop_id = ?').bind(shop.referred_by).first<any>())?.shop_name || null;
  const payouts = (await env.DB.prepare('SELECT amount, note, created_at FROM referral_payouts WHERE shop_id = ? ORDER BY created_at DESC LIMIT 50').bind(shopId).all<any>()).results;
  const res = computeReferral(await filleuls(env, shopId), await payoutsOf(env, shopId));
  return json({ enabled: true, currency: b.currency, shopId, shopName: shop.shop_name, code: shop.referral_code, referredBy: parent, payouts, ...res });
}
