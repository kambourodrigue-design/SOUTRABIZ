// E-mails automatiques (bienvenue, fin d'essai) via Resend. Sans RESEND_API_KEY, rien n'est envoyé et rien ne casse.
import type { Env, UserRow } from './util';
import { loadBilling, planStatus } from './billing';
import { ensureCode } from './referral';

export const SITE = 'https://nafora.link';
export const esc = (s: string) => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n);

export async function sendMail(env: Env, to: string, subject: string, html: string, text: string): Promise<boolean> {
  if (!env.RESEND_API_KEY || !to) return false;
  try {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 8000);
    const res = await fetch((env.RESEND_API_URL || 'https://api.resend.com') + '/emails', {
      method: 'POST', signal: ctl.signal,
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: env.MAIL_FROM || 'Nafora <contact@nafora.link>', to: [to], reply_to: env.MAIL_REPLY_TO || undefined, subject, html, text }),
    });
    clearTimeout(t);
    return res.ok;
  } catch { return false; }
}

const wa = (env: Env) => { const n = (env.SUPPORT_WHATSAPP || '').replace(/\D/g, ''); return n ? `https://wa.me/${n}` : ''; };

export function layout(title: string, bodyHtml: string, cta: { label: string; url: string } | null, env: Env, footerHtml = '') {
  const w = wa(env);
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#f4f6fb;font-family:Arial,Helvetica,sans-serif;color:#1c2540">
<div style="max-width:560px;margin:0 auto;padding:20px">
<div style="background:#0b1a5c;border-radius:16px 16px 0 0;padding:22px;text-align:center"><span style="color:#ffc83d;font-size:26px;font-weight:800;letter-spacing:.5px">Nafora</span></div>
<div style="background:#fff;border-radius:0 0 16px 16px;padding:24px;line-height:1.55;font-size:15px">
<h1 style="font-size:20px;margin:0 0 12px">${title}</h1>${bodyHtml}
${cta ? `<p style="text-align:center;margin:26px 0"><a href="${cta.url}" style="background:#ffc83d;color:#111;text-decoration:none;font-weight:800;padding:13px 24px;border-radius:12px;display:inline-block">${cta.label}</a></p>` : ''}
${w ? `<p style="font-size:13px;color:#56607a">Une question ? Écrivez-nous sur <a href="${w}" style="color:#0b1a5c">WhatsApp</a> : on vous répond vite.</p>` : ''}
</div><p style="text-align:center;font-size:12px;color:#8a93a8">Nafora · ${SITE.replace('https://', '')}</p>${footerHtml}</div></body></html>`;
}

export async function mailWelcome(env: Env, to: string, name: string, shopId: string): Promise<boolean> {
  const b = await loadBilling(env);
  const first = esc((name || '').split(' ')[0] || 'Bonjour');
  const code = await ensureCode(env, shopId);
  const ref = code ? `${SITE}/?ref=${code}` : '';
  const days = b.enabled && b.trialDays > 0 ? `Vous profitez de <b>${b.trialDays} jours d'essai Pro offerts</b>, sans carte bancaire.` : 'Votre compte est prêt.';
  const html = layout(`Bienvenue sur Nafora, ${first} !`,
    `<p>${days} Voici comment démarrer en 5 minutes :</p>
<ol style="padding-left:20px"><li><b>Ajoutez vos produits</b> (onglet Stocks) : nom, prix de vente, quantité.</li>
<li><b>Faites une première vente</b> (onglet Caisse) : touchez un produit, puis « Encaisser ».</li>
<li><b>Notez une dette</b> (onglet Dettes) : Nafora prépare le message WhatsApp de relance.</li></ol>
<p>Tout marche <b>même sans internet</b> et se synchronise dès que vous retrouvez du réseau.</p>
${ref ? `<p style="background:#fff8e1;border-radius:10px;padding:12px">🤝 <b>Gagnez jusqu'à 10 %</b> : invitez vos amis commerçants avec votre lien personnel <a href="${ref}" style="color:#0b1a5c">${ref}</a> et touchez une commission sur leurs abonnements.</p>` : ''}`,
    { label: "Ouvrir Nafora", url: SITE }, env);
  const text = `Bienvenue sur Nafora, ${name} !\n\n${b.enabled ? `${b.trialDays} jours d'essai Pro offerts. ` : ''}Démarrez : 1) ajoutez vos produits (Stocks), 2) faites une vente (Caisse), 3) notez une dette (Dettes).\n\nOuvrir : ${SITE}\n${ref ? `Votre lien de parrainage : ${ref}\n` : ''}`;
  return sendMail(env, to, `Bienvenue sur Nafora, ${name.split(' ')[0] || ''} !`, html, text);
}

export async function mailTrialEnding(env: Env, to: string, name: string, daysLeft: number, ended: boolean): Promise<boolean> {
  const b = await loadBilling(env);
  const first = esc((name || '').split(' ')[0] || '');
  const cur = b.currency || 'F CFA';
  const head = ended ? "Votre essai Pro est terminé" : daysLeft <= 1 ? "Dernier jour de votre essai Pro" : `Il reste ${daysLeft} jours à votre essai Pro`;
  const html = layout(`${head}${first ? `, ${first}` : ''}`,
    `<p>${ended ? "Vos données sont toujours là et en sécurité." : "Profitez-en pour tout tester : stock, dettes, bilan PDF, catalogue en ligne."} Pour continuer avec toutes les fonctions Pro :</p>
<table style="width:100%;border-collapse:collapse;margin:10px 0">
<tr><td style="padding:8px;border-bottom:1px solid #e6e9f2">1 mois</td><td style="padding:8px;border-bottom:1px solid #e6e9f2;text-align:right"><b>${fmt(b.price1)} ${cur}</b></td></tr>
<tr><td style="padding:8px;border-bottom:1px solid #e6e9f2">3 mois</td><td style="padding:8px;border-bottom:1px solid #e6e9f2;text-align:right"><b>${fmt(b.price3)} ${cur}</b></td></tr>
<tr><td style="padding:8px">12 mois</td><td style="padding:8px;text-align:right"><b>${fmt(b.price12)} ${cur}</b></td></tr></table>
<p>Paiement simple par Mobile Money, depuis l'application : Paramètres → Abonnement.</p>`,
    { label: "Choisir mon abonnement", url: SITE }, env);
  const text = `${head}.\n\n1 mois : ${fmt(b.price1)} ${cur} · 3 mois : ${fmt(b.price3)} ${cur} · 12 mois : ${fmt(b.price12)} ${cur}\nPaiement Mobile Money : Paramètres → Abonnement.\n${SITE}`;
  return sendMail(env, to, `${head} — Nafora`, html, text);
}

/** Rappel unique de fin d'essai (envoyé quand le commerçant ouvre l'application). Protégé : jamais bloquant. */
export async function maybeTrialReminder(env: Env, user: UserRow, run: (p: Promise<unknown>) => void): Promise<void> {
  try {
    if (!env.RESEND_API_KEY || !user.email || user.role === 'admin' || (user.shop_role || 'owner') !== 'owner') return;
    const row = await env.DB.prepare('SELECT mail_trial_at FROM users WHERE id = ?').bind(user.id).first<{ mail_trial_at: string | null }>();
    if (!row || row.mail_trial_at) return;
    const st = await planStatus(env, user.shop_id);
    if (!st.enforced || st.state === 'paid') return;
    const ended = st.state === 'free';
    if (!ended && !(st.state === 'trial' && st.daysLeft <= 1)) return;
    const mark = await env.DB.prepare("UPDATE users SET mail_trial_at = ? WHERE id = ? AND mail_trial_at IS NULL").bind(new Date().toISOString(), user.id).run();
    if (!mark.meta?.changes) return;
    run(mailTrialEnding(env, user.email, user.name || '', st.daysLeft, ended));
  } catch { /* colonne absente (migration v10 non faite) : on n'envoie rien */ }
}
