// E-mails promotionnels / marketing (administrateur). Envoi par lots de 50 via Resend, avec lien de désinscription.
import { json, fail, readBody, str, randomHex, sha256, type Env, type UserRow } from './util';
import { layout, esc, SITE } from './mail';

export const AUDIENCES: Record<string, { label: string; where: string }> = {
  all: { label: 'Tous les commerçants', where: '1=1' },
  new7: { label: 'Inscrits depuis moins de 7 jours', where: "u.created_at >= datetime('now','-7 days')" },
  inactive30: { label: 'Inactifs depuis plus de 30 jours', where: "u.last_login_at < datetime('now','-30 days')" },
  paid: { label: 'Abonnés (abonnement actif)', where: "EXISTS (SELECT 1 FROM subscriptions s WHERE s.shop_id = u.shop_id AND s.paid_until > datetime('now'))" },
  unpaid: { label: 'Pas encore abonnés', where: "NOT EXISTS (SELECT 1 FROM subscriptions s WHERE s.shop_id = u.shop_id AND s.paid_until > datetime('now'))" },
};
const BASE = "u.email IS NOT NULL AND u.email <> '' AND u.role <> 'admin' AND u.status = 'active' AND COALESCE(u.shop_role,'owner') = 'owner' AND COALESCE(u.mail_optout,0) = 0";
const whereOf = (a: string) => `${BASE} AND ${(AUDIENCES[a] || AUDIENCES.all).where}`;

const unsubToken = async (env: Env, userId: string) => (await sha256(`${userId}|${env.RESEND_API_KEY || ''}|unsub`)).slice(0, 24);
export const unsubUrl = async (env: Env, userId: string) => `${SITE}/api/unsubscribe?u=${encodeURIComponent(userId)}&t=${await unsubToken(env, userId)}`;

/** Texte simple → HTML (paragraphes, liens cliquables, {prenom}). */
export function bodyToHtml(text: string, firstName: string): string {
  const t = text.replace(/\{prenom\}/gi, firstName || '');
  return t.split(/\n{2,}/).map(par => {
    const h = esc(par.trim()).replace(/\n/g, '<br>').replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#0b1a5c">$1</a>');
    return h ? `<p>${h}</p>` : '';
  }).join('');
}

/** GET /api/unsubscribe?u=&t= : désinscription en un clic (page publique). */
export async function unsubscribe(url: URL, env: Env) {
  const u = url.searchParams.get('u') || '', t = url.searchParams.get('t') || '';
  const page = (msg: string, status = 200) => new Response(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Nafora</title><body style="font-family:Arial;background:#f4f6fb;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0"><div style="background:#fff;border-radius:16px;padding:28px;max-width:420px;text-align:center"><h2 style="color:#0b1a5c">Nafora</h2><p>${msg}</p><a href="${SITE}" style="color:#0b1a5c">Retour au site</a></div>`, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  if (!u || !t || t !== (await unsubToken(env, u))) return page('Lien invalide.', 400);
  try { await env.DB.prepare('UPDATE users SET mail_optout = 1 WHERE id = ?').bind(u).run(); } catch { return page('Service momentanément indisponible. Réessayez plus tard.', 503); }
  return page('Vous êtes désinscrit(e) des e-mails promotionnels de Nafora. Vous recevrez encore les messages liés à votre compte.');
}

async function counts(env: Env) {
  const out: Record<string, number> = {};
  for (const k of Object.keys(AUDIENCES)) {
    out[k] = Number((await env.DB.prepare(`SELECT COUNT(*) AS n FROM users u WHERE ${whereOf(k)}`).first<{ n: number }>())?.n) || 0;
  }
  return out;
}

export async function adminMailing(req: Request, env: Env, admin: UserRow, parts: string[]) {
  const configured = !!env.RESEND_API_KEY;
  if (req.method === 'GET') {
    try {
      const [c, camps] = await Promise.all([
        counts(env),
        env.DB.prepare('SELECT id, subject, audience, total, sent, failed, created_at FROM mail_campaigns ORDER BY created_at DESC LIMIT 20').all<any>(),
      ]);
      return json({ configured, ready: true, audiences: Object.fromEntries(Object.entries(AUDIENCES).map(([k, v]) => [k, { label: v.label, count: c[k] }])), campaigns: camps.results });
    } catch { return json({ configured, ready: false, audiences: {}, campaigns: [] }); }
  }
  if (req.method !== 'POST' || parts[2] !== 'send') return fail('Méthode non autorisée.', 405);
  if (!configured) return fail("Clé d'envoi absente : ajoutez le secret RESEND_API_KEY dans Cloudflare.", 400);

  const b = await readBody(req, 60_000);
  const subject = str(b.subject, 150), text = str(b.body, 8000);
  const ctaLabel = str(b.ctaLabel, 40), ctaUrl = str(b.ctaUrl, 300);
  const audience = AUDIENCES[b.audience] ? b.audience : 'all';
  if (!subject || !text) return fail("L'objet et le message sont obligatoires.");
  if (ctaUrl && !/^https?:\/\//i.test(ctaUrl)) return fail("Le lien du bouton doit commencer par https://");
  const cta = ctaLabel && ctaUrl ? { label: esc(ctaLabel), url: ctaUrl } : null;

  const build = async (u: { id: string; email: string; name: string }) => {
    const first = (u.name || '').split(' ')[0] || '';
    const link = await unsubUrl(env, u.id);
    const html = layout(esc(subject), bodyToHtml(text, first), cta, env,
      `<p style="text-align:center;font-size:11px;color:#8a93a8">Vous recevez ce message car vous avez un compte Nafora. <a href="${link}" style="color:#8a93a8">Se désinscrire</a></p>`);
    return {
      from: env.MAIL_FROM || 'Nafora <contact@nafora.link>', to: [u.email], reply_to: env.MAIL_REPLY_TO || undefined,
      subject: subject.replace(/\{prenom\}/gi, first), html,
      text: `${text.replace(/\{prenom\}/gi, first)}\n\nSe désinscrire : ${link}`,
      headers: { 'List-Unsubscribe': `<${link}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
    };
  };
  const post = async (payload: unknown[]) => {
    const r = await fetch((env.RESEND_API_URL || 'https://api.resend.com') + '/emails/batch', { method: 'POST', headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!r.ok) { let m = ''; try { m = (await r.json() as any)?.message || ''; } catch { /* ignore */ } return { ok: false, error: m || `Erreur d'envoi (${r.status})` }; }
    return { ok: true, error: '' };
  };

  if (b.test) {   // test : uniquement à l'administrateur
    if (!admin.email) return fail("Votre compte administrateur n'a pas d'adresse e-mail.");
    const res = await post([await build({ id: admin.id, email: admin.email, name: admin.name || '' })]);
    return res.ok ? json({ ok: true, test: true, to: admin.email }) : fail(res.error);
  }

  // envoi réel : lot de 50 à partir de offset (le navigateur enchaîne les lots)
  const offset = Math.max(0, Math.floor(Number(b.offset) || 0));
  let campaignId = str(b.campaignId, 40);
  const total = Number((await env.DB.prepare(`SELECT COUNT(*) AS n FROM users u WHERE ${whereOf(audience)}`).first<{ n: number }>())?.n) || 0;
  if (!total) return fail('Aucun destinataire pour cette liste.');
  if (!campaignId) {
    campaignId = 'camp-' + randomHex(6);
    await env.DB.prepare('INSERT INTO mail_campaigns (id, subject, audience, total, sent, failed, created_at) VALUES (?,?,?,?,0,0,?)').bind(campaignId, subject, audience, total, new Date().toISOString()).run();
  }
  const rows = (await env.DB.prepare(`SELECT u.id, u.email, u.name FROM users u WHERE ${whereOf(audience)} ORDER BY u.created_at, u.id LIMIT 50 OFFSET ?`).bind(offset).all<any>()).results;
  let sent = 0, failed = 0, error = '';
  if (rows.length) {
    const res = await post(await Promise.all(rows.map(build)));
    if (res.ok) sent = rows.length; else { failed = rows.length; error = res.error; }
    await env.DB.prepare('UPDATE mail_campaigns SET sent = sent + ?, failed = failed + ? WHERE id = ?').bind(sent, failed, campaignId).run();
  }
  const next = offset + rows.length;
  return json({ ok: !error, campaignId, total, sent, failed, next, done: next >= total || !rows.length || !!error, error });
}
