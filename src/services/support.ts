import { useEffect, useState } from 'react';
import { api } from './api';

/** Assistance : numéro WhatsApp et horaires viennent du serveur (SUPPORT_WHATSAPP / SUPPORT_HOURS). */
export interface SupportInfo { whatsapp: string; hours: string }
let info: SupportInfo | null = null;
let pending: Promise<SupportInfo> | null = null;
let ctx = { shop: '', name: '', phone: '', plan: '' };

export const setSupportContext = (c: Partial<typeof ctx>) => { ctx = { ...ctx, ...c }; };

export function loadSupport(): Promise<SupportInfo> {
  if (info) return Promise.resolve(info);
  if (!pending) {
    pending = api.plans().then(p => (info = { whatsapp: String((p as any).whatsapp || ''), hours: String((p as any).supportHours || '') }))
      .catch(() => { pending = null; return { whatsapp: '', hours: '' }; });
  }
  return pending;
}

export function useSupport(): SupportInfo {
  const [s, setS] = useState<SupportInfo>(info || { whatsapp: '', hours: '' });
  useEffect(() => { let on = true; loadSupport().then(v => { if (on) setS(v); }); return () => { on = false; }; }, []);
  return s;
}

const PLAN_LABEL: Record<string, string> = { trial: 'essai', paid: 'Pro', free: 'gratuit', off: '' };

export function supportMessage(): string {
  const parts = ["Bonjour, j'ai besoin d'aide avec Nafora."];
  const det = [ctx.shop && `Boutique : ${ctx.shop}`, ctx.name && `Nom : ${ctx.name}`, ctx.phone && `Téléphone : ${ctx.phone}`, PLAN_LABEL[ctx.plan] && `Plan : ${PLAN_LABEL[ctx.plan]}`].filter(Boolean);
  return parts.concat(det as string[]).join('\n');
}

export async function openSupport(): Promise<boolean> {
  const s = await loadSupport();
  if (!s.whatsapp) return false;
  window.open(`https://wa.me/${s.whatsapp}?text=${encodeURIComponent(supportMessage())}`, '_blank', 'noopener');
  return true;
}
