import React from 'react';
import { LifeBuoy, MessageCircle, Phone } from 'lucide-react';
import { openSupport, useSupport } from '../../services/support';

/** Aide : écrire à l'assistance sur WhatsApp (message prêt, avec la boutique et le plan) ou appeler. */
export const SupportPanel: React.FC = () => {
  const s = useSupport();
  if (!s.whatsapp) return null;
  return (
    <div className="pt-2 border-t border-stone-200/80 space-y-2" data-testid="support-panel">
      <h4 className="font-bold text-stone-800 text-sm flex items-center gap-1.5"><LifeBuoy className="w-4 h-4 text-emerald-700" /> Aide et assistance</h4>
      <p className="text-xs text-stone-600">Une question, un blocage ? Écrivez-nous : votre boutique et votre plan sont ajoutés au message pour qu'on vous aide plus vite.{s.hours ? ` Réponse : ${s.hours}.` : ''}</p>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => openSupport()} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm"><MessageCircle className="w-4 h-4" /> WhatsApp</button>
        <a href={`tel:+${s.whatsapp}`} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-stone-300 text-stone-800 font-bold text-sm hover:bg-stone-100"><Phone className="w-4 h-4" /> Appeler</a>
      </div>
    </div>
  );
};
