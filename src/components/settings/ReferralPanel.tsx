import React, { useEffect, useState } from 'react';
import { api, ReferralInfo } from '../../services/api';
import { referralUrl } from '../../services/referralLink';

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n));

/** Parrainage du propriétaire : lien personnel, paliers de commission et filleuls. */
export const ReferralPanel: React.FC = () => {
  const [d, setD] = useState<ReferralInfo | null>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => { api.referral().then(setD).catch(() => { /* hors-ligne : masqué */ }); }, []);
  if (!d || !d.enabled || !d.code) return null;
  const url = referralUrl(d.code), cur = d.currency || 'F CFA', max = Math.max(...(d.tiers || []).map(t => t.pct), 10);
  const copy = async () => { try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { window.prompt('Copiez votre lien :', url); } };
  const wa = `https://wa.me/?text=${encodeURIComponent(`Je gère mon commerce avec Nafora (stock, ventes, dettes, bilan). Essayez gratuitement : ${url}`)}`;
  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-3" data-testid="referral-panel">
      <div>
        <h3 className="font-bold text-stone-900">🤝 Parrainez, gagnez jusqu'à {max}&nbsp;%</h3>
        <p className="text-xs text-stone-600 mt-0.5">Vous touchez une commission sur chaque abonnement payé par un commerçant que vous avez invité.</p>
      </div>
      <div className="flex gap-2">
        <input readOnly value={url} onFocus={e => e.currentTarget.select()} className="flex-1 min-w-0 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs" data-testid="referral-link" />
        <button onClick={copy} className="px-3 py-2 rounded-xl bg-stone-900 text-white text-xs font-bold">{copied ? 'Copié ✓' : 'Copier'}</button>
      </div>
      <a href={wa} target="_blank" rel="noopener noreferrer" className="block text-center py-2 rounded-xl bg-green-600 text-white text-sm font-bold">Partager sur WhatsApp</a>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-stone-50 rounded-xl p-2"><p className="text-lg font-black">{d.invited}</p><p className="text-[11px] text-stone-600">invités</p></div>
        <div className="bg-stone-50 rounded-xl p-2"><p className="text-lg font-black">{d.paying}</p><p className="text-[11px] text-stone-600">abonnés</p></div>
        <div className="bg-emerald-50 rounded-xl p-2"><p className="text-lg font-black text-emerald-700">{d.pct} %</p><p className="text-[11px] text-stone-600">votre taux</p></div>
      </div>
      <p className="text-sm">Gagné : <b>{fmt(d.earned || 0)} {cur}</b> · À recevoir : <b className="text-emerald-700">{fmt(d.balance || 0)} {cur}</b></p>
      {d.next && <p className="text-xs text-stone-600">Encore {d.next.need} abonné{d.next.need > 1 ? 's' : ''} pour passer à {d.next.pct} %.</p>}
      <p className="text-[11px] text-stone-500">Paliers : {(d.tiers || []).map(t => `dès ${t.min} abonné${t.min > 1 ? 's' : ''} → ${t.pct} %`).join(' · ')}. Versement par l'équipe Nafora (Mobile Money).</p>
      {!!d.items?.length && (
        <ul className="divide-y divide-stone-100 text-sm">
          {d.items.map((f, i) => (
            <li key={i} className="py-1.5 flex justify-between gap-2">
              <span className="truncate">{f.name}{f.city ? ` · ${f.city}` : ''}</span>
              <span className={`text-xs font-bold whitespace-nowrap ${f.state === 'paid' ? 'text-emerald-700' : 'text-amber-700'}`}>{f.state === 'paid' ? `+${fmt(f.commission)} ${cur}` : 'En essai'}</span>
            </li>))}
        </ul>)}
    </div>
  );
};
