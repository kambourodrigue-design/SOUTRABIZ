import React, { useEffect, useState } from 'react';
import { api, PlanSettings, PlanStatus, PaymentRow } from '../../services/api';

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n));
const day = (iso: string | null) => iso ? new Date(iso).toLocaleDateString('fr-FR') : '';

/** Abonnement Pro du propriétaire : état, prix, instructions de paiement et déclaration du paiement. */
export const BillingPanel: React.FC = () => {
  const [data, setData] = useState<{ status: PlanStatus; settings: PlanSettings; payments: PaymentRow[] } | null>(null);
  const [months, setMonths] = useState(1); const [ref, setRef] = useState(''); const [method, setMethod] = useState('orange_money');
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const load = () => api.billing().then(setData).catch(() => { /* hors-ligne : panneau masqué */ });
  useEffect(() => { load(); }, []);
  if (!data || !data.status.enforced) return null;     // facturation désactivée : rien à afficher
  const { status: st, settings: s } = data;
  const price = months === 1 ? s.price1 : months === 3 ? s.price3 : s.price12;
  const badge = st.state === 'paid' ? ['bg-emerald-100 text-emerald-800', `Pro jusqu'au ${day(st.paidUntil)}`]
    : st.state === 'trial' ? ['bg-amber-100 text-amber-800', `Essai Pro : ${st.daysLeft} jour(s) restant(s)`]
    : ['bg-stone-200 text-stone-700', 'Plan gratuit'];
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(''); setMsg(''); setBusy(true);
    try { await api.billingPay({ months, method, reference: ref.trim() }); setRef(''); setMsg("Merci ! Votre paiement sera validé sous peu."); await load(); }
    catch (x) { setErr((x as Error).message); } finally { setBusy(false); }
  };
  const pending = data.payments.filter(p => p.status === 'pending');
  return (
    <div className="pt-2 border-t border-stone-200/80 space-y-3" data-testid="billing-panel">
      <div className="flex items-center justify-between gap-2"><h4 className="font-bold text-stone-800 text-sm">Abonnement</h4><span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${badge[0]}`}>{badge[1]}</span></div>
      <p className="text-xs text-stone-600">Le plan Pro ouvre l'assistant IA ({`jusqu'à 15 questions/jour`} au lieu de {s.freeAiPerDay}) et permet d'ajouter autant d'employés que vous voulez (gratuit : {s.freeTeamMax}). Votre caisse et vos données restent toujours accessibles, quel que soit le plan.</p>
      <form onSubmit={submit} className="space-y-2 bg-stone-50 rounded-xl p-3 border border-stone-200">
        <div className="grid grid-cols-3 gap-2">
          {[[1, s.price1], [3, s.price3], [12, s.price12]].map(([m, p]) => (
            <button type="button" key={m} onClick={() => setMonths(m)} className={`rounded-xl border p-2 text-center text-xs font-bold ${months === m ? 'border-emerald-700 bg-emerald-50 text-emerald-900' : 'border-stone-300 bg-white'}`}>{m === 12 ? '1 an' : `${m} mois`}<div className="text-sm">{fmt(p)} {s.currency}</div></button>))}
        </div>
        <div className="text-xs bg-white border border-stone-200 rounded-lg p-2 whitespace-pre-wrap"><b>1.</b> Envoyez {fmt(price)} {s.currency} :{'\n'}{s.payInfo}</div>
        <div className="text-xs font-semibold text-stone-700"><b>2.</b> Indiquez ensuite la référence de la transaction reçue par SMS :</div>
        <div className="flex gap-2">
          <select value={method} onChange={e => setMethod(e.target.value)} className="px-2 py-2 rounded-xl border border-stone-300 text-xs"><option value="orange_money">Orange Money</option><option value="wave">Wave</option><option value="mtn_momo">MTN MoMo</option><option value="moov_money">Moov Money</option><option value="bank_transfer">Virement</option></select>
          <input value={ref} onChange={e => setRef(e.target.value)} placeholder="Référence / n° de transaction" maxLength={40} className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-stone-300 text-sm" data-testid="pay-ref" /></div>
        {err && <p className="text-xs text-red-700">{err}</p>}{msg && <p className="text-xs text-emerald-700">{msg}</p>}
        <button disabled={busy || ref.trim().length < 4} className="w-full py-2 rounded-xl bg-emerald-700 text-white font-bold text-sm disabled:opacity-50" data-testid="pay-submit">J'ai payé : envoyer pour validation</button>
      </form>
      {data.payments.length > 0 && <div className="text-[11px] text-stone-500 space-y-0.5">{data.payments.slice(0, 5).map(p => <div key={p.id}>{day(p.createdAt)} • {fmt(p.amount)} {s.currency} • {p.months} mois • {p.status === 'approved' ? '✅ validé' : p.status === 'rejected' ? `❌ refusé${p.note ? ' (' + p.note + ')' : ''}` : '⏳ en attente'}</div>)}</div>}
      {pending.length > 0 && <p className="text-[11px] text-stone-400">La validation se fait à la main, généralement dans la journée.</p>}
    </div>
  );
};
