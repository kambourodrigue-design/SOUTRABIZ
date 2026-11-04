import React, { useEffect, useState } from 'react';
import { api, AdminReferrer, AdminReferralDetail } from '../../services/api';
import { uiAlert, uiPrompt } from '../common/dialogs';

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n));
const day = (iso: string) => iso ? new Date(iso).toLocaleDateString('fr-FR') : '';

/** Admin : parrains, leurs affiliés (filleuls) et versements de commissions. */
export const AdminReferralsPanel: React.FC = () => {
  const [rows, setRows] = useState<AdminReferrer[] | null>(null);
  const [cur, setCur] = useState('F CFA'); const [enabled, setEnabled] = useState(true);
  const [detail, setDetail] = useState<AdminReferralDetail | null>(null);
  const [err, setErr] = useState('');
  const load = () => api.adminReferrals().then(r => { setRows(r.items); setCur(r.currency); setEnabled(r.enabled); }).catch(e => setErr((e as Error).message));
  useEffect(() => { load(); }, []);
  const open = (id: string) => api.adminReferral(id).then(setDetail).catch(e => uiAlert((e as Error).message));
  const payout = async () => {
    if (!detail) return;
    const v = await uiPrompt(`Montant versé à ${detail.shopName} (solde : ${fmt(detail.balance || 0)} ${cur})`, String(detail.balance || 0));
    if (v === null) return;
    const note = await uiPrompt('Note (ex. Orange Money, référence)', '');
    try { setDetail(await api.adminReferralPayout(detail.shopId, Number(v), note || '')); load(); } catch (e) { uiAlert((e as Error).message); }
  };
  if (err) return <p className="text-sm text-red-600">{err}</p>;
  if (!rows) return <p className="text-sm text-stone-500">Chargement…</p>;
  if (!enabled) return <p className="text-sm text-amber-700">Parrainage inactif : exécutez migration-v9.sql dans la console D1.</p>;
  return (
    <div className="space-y-3" data-testid="admin-referrals">
      {rows.length === 0 && <p className="text-sm text-stone-500">Aucun parrainage pour le moment.</p>}
      <div className="space-y-2">
        {rows.map(r => (
          <button key={r.shopId} onClick={() => open(r.shopId)} className="w-full text-left bg-white border border-stone-200 rounded-xl p-3">
            <div className="flex justify-between gap-2"><b className="truncate">{r.shopName}</b><span className="text-xs font-bold text-emerald-700">{r.pct} %</span></div>
            <p className="text-xs text-stone-600">{r.owner} · {r.phone} · code {r.code}</p>
            <p className="text-xs mt-1">{r.invited} affilié{r.invited > 1 ? 's' : ''} · {r.paying} payant{r.paying > 1 ? 's' : ''} · gagné {fmt(r.earned)} · versé {fmt(r.paidOut)} · <b>solde {fmt(r.balance)} {cur}</b></p>
          </button>))}
      </div>
      {detail && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-3" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-4 space-y-3" onClick={e => e.stopPropagation()} data-testid="admin-referral-detail">
            <div className="flex justify-between"><h3 className="font-bold">Affiliés de {detail.shopName}</h3><button onClick={() => setDetail(null)} aria-label="Fermer">✕</button></div>
            <p className="text-xs text-stone-600">Code {detail.code}{detail.referredBy ? ` · parrainé par ${detail.referredBy}` : ''} · taux {detail.pct} % · gagné {fmt(detail.earned || 0)} · versé {fmt(detail.paidOut || 0)} · solde <b>{fmt(detail.balance || 0)} {cur}</b></p>
            {(detail.balance || 0) > 0 && <button onClick={payout} className="w-full py-2 rounded-xl bg-emerald-700 text-white text-sm font-bold">Enregistrer un versement</button>}
            <ul className="divide-y divide-stone-100 text-sm">
              {(detail.items || []).map((f, i) => (
                <li key={i} className="py-1.5 flex justify-between gap-2"><span className="truncate">{f.name}{f.city ? ` · ${f.city}` : ''} <span className="text-xs text-stone-500">{day(f.joinedAt)}</span></span>
                  <span className={`text-xs font-bold whitespace-nowrap ${f.state === 'paid' ? 'text-emerald-700' : 'text-amber-700'}`}>{f.state === 'paid' ? `payé ${fmt(f.paid)} → ${fmt(f.commission)}` : 'En essai'}</span></li>))}
            </ul>
            {!!detail.payouts.length && <div><p className="text-xs font-bold mt-2">Versements</p>{detail.payouts.map((p, i) => <p key={i} className="text-xs text-stone-600">{day(p.created_at)} · {fmt(p.amount)} {cur}{p.note ? ` · ${p.note}` : ''}</p>)}</div>}
          </div>
        </div>)}
    </div>
  );
};
