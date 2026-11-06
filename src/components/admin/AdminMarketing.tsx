import React, { useEffect, useState } from 'react';
import { api, MailingInfo } from '../../services/api';
import { uiAlert, uiConfirm, Select } from '../common/dialogs';

const MODELS: { id: string; label: string; subject: string; body: string; ctaLabel: string; ctaUrl: string }[] = [
  { id: 'promo', label: '🎁 Promo abonnement', subject: 'Offre spéciale Nafora : -20 % sur votre abonnement', body: "Bonjour {prenom},\n\nCette semaine seulement, profitez de -20 % sur l'abonnement annuel Nafora.\n\nAvec Nafora Pro : stock, dettes clients, bilan PDF, catalogue en ligne et assistant IA, même sans internet.\n\nPaiement simple par Mobile Money, directement dans l'application.", ctaLabel: 'Profiter de l\'offre', ctaUrl: 'https://nafora.link' },
  { id: 'news', label: '✨ Nouveauté', subject: 'Nouveau dans Nafora : inventaire et ajustement de stock', body: "Bonjour {prenom},\n\nNafora s'améliore pour vous :\n\n• Inventaire : comptez vos articles, l'application calcule les écarts.\n• Ajustement de stock : casse, perte, vol... tout est enregistré.\n• Bilan de gestion en PDF, mensuel ou annuel.\n\nOuvrez l'application pour les découvrir.", ctaLabel: 'Ouvrir Nafora', ctaUrl: 'https://nafora.link' },
  { id: 'comeback', label: '👋 Relance inactifs', subject: 'Vos ventes vous attendent sur Nafora', body: "Bonjour {prenom},\n\nCela fait un moment que nous ne vous avons pas vu sur Nafora. Vos produits, vos clients et vos dettes sont toujours là, en sécurité.\n\nReprenez en 2 minutes : notez vos ventes du jour et gardez un oeil sur votre argent.\n\nUne question ? Répondez simplement à ce message.", ctaLabel: 'Reprendre mon activité', ctaUrl: 'https://nafora.link' },
  { id: 'referral', label: '🤝 Parrainage', subject: 'Gagnez jusqu\'à 10 % en invitant vos amis commerçants', body: "Bonjour {prenom},\n\nChaque commerçant Nafora a un lien de parrainage personnel (Paramètres → Abonnement).\n\nQuand un ami invité s'abonne, vous touchez une commission : 5 % dès 1 ami, 7 % dès 5 amis, 10 % dès 10 amis.\n\nPartagez votre lien sur WhatsApp !", ctaLabel: 'Voir mon lien', ctaUrl: 'https://nafora.link' },
];

/** Admin : e-mails promotionnels et marketing (test, envoi par lots, historique). */
export const AdminMarketing: React.FC = () => {
  const [info, setInfo] = useState<MailingInfo | null>(null);
  const [err, setErr] = useState('');
  const [audience, setAudience] = useState('all');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [ctaLabel, setCtaLabel] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [busy, setBusy] = useState('');
  const load = () => api.adminMailing().then(setInfo).catch(e => setErr((e as Error).message));
  useEffect(() => { load(); }, []);
  if (err) return <p className="text-sm text-red-600">{err}</p>;
  if (!info) return <p className="text-sm text-stone-500">Chargement…</p>;
  if (!info.ready) return <p className="text-sm text-amber-700">Marketing inactif : exécutez migration-v11.sql dans la console D1.</p>;

  const fld = 'w-full mt-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm';
  const payload = { subject: subject.trim(), body: body.trim(), audience, ctaLabel: ctaLabel.trim(), ctaUrl: ctaUrl.trim() };
  const count = info.audiences[audience]?.count ?? 0;
  const valid = payload.subject && payload.body;
  const apply = (id: string) => { const m = MODELS.find(x => x.id === id); if (m) { setSubject(m.subject); setBody(m.body); setCtaLabel(m.ctaLabel); setCtaUrl(m.ctaUrl); } };

  const test = async () => {
    if (!valid) { uiAlert("Écrivez l'objet et le message."); return; }
    setBusy('Envoi du test…');
    try { const r = await api.adminMailingSend({ ...payload, test: true }); uiAlert(`Test envoyé à ${r.to}. Vérifiez aussi vos spams.`); }
    catch (e) { uiAlert((e as Error).message); } finally { setBusy(''); }
  };
  const send = async () => {
    if (!valid) { uiAlert("Écrivez l'objet et le message."); return; }
    if (!(await uiConfirm(`Envoyer « ${payload.subject} » à ${count} commerçant(s) ? Cette action est définitive.`))) return;
    let offset = 0, campaignId: string | undefined, sent = 0, failed = 0;
    try {
      for (let guard = 0; guard < 400; guard++) {
        setBusy(`Envoi en cours… ${offset}/${count}`);
        const r = await api.adminMailingSend({ ...payload, offset, campaignId });
        campaignId = r.campaignId; sent += r.sent || 0; failed += r.failed || 0; offset = r.next || offset;
        if (r.error) { await uiAlert(`Arrêt : ${r.error}\nEnvoyés : ${sent}. Les offres gratuites de Resend sont limitées à 100 e-mails par jour.`); break; }
        if (r.done) { await uiAlert(`Terminé : ${sent} e-mail(s) envoyé(s)${failed ? `, ${failed} en échec` : ''}.`); break; }
      }
    } catch (e) { await uiAlert((e as Error).message); } finally { setBusy(''); load(); }
  };

  return (
    <div className="space-y-4" data-testid="admin-marketing">
      {!info.configured && <p className="text-sm bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3">La clé RESEND_API_KEY est absente : aucun envoi n'est possible.</p>}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-3">
        <h3 className="font-black text-stone-900">Nouvel e-mail</h3>
        <div className="flex flex-wrap gap-2">
          {MODELS.map(m => <button key={m.id} type="button" onClick={() => apply(m.id)} className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-xs font-bold text-stone-700">{m.label}</button>)}
        </div>
        <div>
          <label className="text-xs font-bold text-stone-700">Destinataires</label>
          <Select value={audience} onChange={e => setAudience(e.target.value)} className={fld}>
            {Object.entries(info.audiences).map(([k, v]) => <option key={k} value={k}>{v.label} ({v.count})</option>)}
          </Select>
          <p className="text-[11px] text-stone-500 mt-1">Seuls les propriétaires avec e-mail, non désinscrits, reçoivent le message.</p>
        </div>
        <div><label className="text-xs font-bold text-stone-700">Objet</label>
          <input value={subject} maxLength={150} onChange={e => setSubject(e.target.value)} className={fld} data-testid="mk-subject" placeholder="Objet de l'e-mail" /></div>
        <div><label className="text-xs font-bold text-stone-700">Message</label>
          <textarea value={body} rows={8} maxLength={8000} onChange={e => setBody(e.target.value)} className={fld} data-testid="mk-body" placeholder={"Bonjour {prenom},\n\n..."} />
          <p className="text-[11px] text-stone-500">{'{prenom}'} est remplacé par le prénom. Une ligne vide sépare les paragraphes.</p></div>
        <div className="grid grid-cols-2 gap-2">
          <div><label className="text-xs font-bold text-stone-700">Bouton (texte)</label><input value={ctaLabel} maxLength={40} onChange={e => setCtaLabel(e.target.value)} className={fld} placeholder="Ouvrir Nafora" /></div>
          <div><label className="text-xs font-bold text-stone-700">Bouton (lien)</label><input value={ctaUrl} onChange={e => setCtaUrl(e.target.value)} className={fld} placeholder="https://nafora.link" /></div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={test} disabled={!!busy || !info.configured} data-testid="mk-test" className="py-2.5 rounded-xl border border-emerald-700 text-emerald-800 font-bold text-sm disabled:opacity-50">M'envoyer un test</button>
          <button onClick={send} disabled={!!busy || !info.configured || !count} data-testid="mk-send" className="py-2.5 rounded-xl bg-emerald-800 text-white font-bold text-sm disabled:opacity-50">Envoyer à {count}</button>
        </div>
        {busy && <p className="text-xs font-semibold text-stone-600" data-testid="mk-busy">{busy}</p>}
        <p className="text-[11px] text-stone-500">Chaque e-mail contient un lien de désinscription automatique. Resend gratuit : 100 e-mails par jour, 3 000 par mois.</p>
      </div>
      <div className="bg-white border border-stone-200 rounded-2xl p-4">
        <h3 className="font-black text-stone-900 mb-2">Historique</h3>
        {info.campaigns.length === 0 ? <p className="text-sm text-stone-500">Aucun envoi pour le moment.</p> : (
          <ul className="divide-y divide-stone-100 text-sm">
            {info.campaigns.map(c => (
              <li key={c.id} className="py-2"><p className="font-bold break-words">{c.subject}</p>
                <p className="text-xs text-stone-500">{new Date(c.created_at).toLocaleDateString('fr-FR')} · {info.audiences[c.audience]?.label || c.audience} · {c.sent}/{c.total} envoyés{c.failed ? ` · ${c.failed} échecs` : ''}</p></li>))}
          </ul>)}
      </div>
    </div>
  );
};
