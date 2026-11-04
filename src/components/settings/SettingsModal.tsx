import React, { useState } from 'react';
import { ShopSettings, CurrencyCode } from '../../types';
import { storage } from '../../services/storage';
import { api } from '../../services/api';
import { TeamPanel } from './TeamPanel';
import { BillingPanel } from './BillingPanel';
import { ReferralPanel } from './ReferralPanel';
import { SupportPanel } from './SupportPanel';
import { CatalogPanel } from './CatalogPanel';
import {
  Settings as SettingsIcon, X, Save, Download, Upload, RotateCcw, ShieldCheck, HardDrive,
  Store, Gift, Users, LifeBuoy, Lock, Wallet, ChevronDown, AlertTriangle,
} from 'lucide-react';
import { Select } from '../common/dialogs';
import { uiAlert, uiConfirm } from '../common/dialogs';
import { BUSINESS_PRESETS } from '../../services/businessPresets';

interface SettingsModalProps {
  settings: ShopSettings;
  onSaveSettings: (settings: ShopSettings) => void;
  onClose: () => void;
  onReloadAllData: () => void;
  onClearData: (kind: 'sales' | 'expenses' | 'customers' | 'suppliers' | 'products' | 'all' | 'sample') => void;
  isDemo?: boolean;
  shopRole?: 'owner' | 'manager' | 'cashier';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onSaveSettings,
  onClose,
  onReloadAllData,
  onClearData,
  isDemo = false,
  shopRole = 'owner',
}) => {
  const isOwner = isDemo || shopRole === 'owner';
  const isCashier = !isDemo && shopRole === 'cashier';
  const [formData, setFormData] = useState<ShopSettings>({ ...settings });
  const [importStatus, setImportStatus] = useState<string | null>(null);
  type Tab = 'shop' | 'plan' | 'team' | 'help';
  const [tab, setTab] = useState<Tab>(isCashier ? 'help' : 'shop');

  const [pwCur, setPwCur] = useState('');
  const [pwNew, setPwNew] = useState('');
  const [pwMsg, setPwMsg] = useState<string | null>(null);

  const handleChangePassword = async () => {
    setPwMsg(null);
    if (pwNew.length < 8) { setPwMsg('Nouveau mot de passe : 8 caractères minimum.'); return; }
    try {
      await api.changePassword(pwCur, pwNew);
      setPwMsg('✅ Mot de passe modifié.');
      setPwCur(''); setPwNew('');
    } catch (e) { setPwMsg('❌ ' + (e as Error).message); }
  };

  const handleLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const max = 256;
      const ratio = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * ratio);
      c.height = Math.round(img.height * ratio);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      let data = c.toDataURL('image/png');
      if (data.length > 90_000) data = c.toDataURL('image/jpeg', 0.8); // garde le fichier léger
      setFormData(f => ({ ...f, logo: data }));
      URL.revokeObjectURL(url);
    };
    img.onerror = () => { uiAlert('Image illisible.'); URL.revokeObjectURL(url); };
    img.src = url;
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    onClose();
  };

  const handleExportBackup = () => {
    const jsonStr = storage.exportBackupJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nafora_sauvegarde_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = storage.importBackupJson(content);
      if (success) {
        setImportStatus("Sauvegarde restaurée avec succès !");
        setTimeout(() => {
          onReloadAllData();
          onClose();
        }, 1200);
      } else {
        setImportStatus("Erreur : Fichier de sauvegarde invalide.");
      }
    };
    reader.readAsText(file);
  };

  const handleResetDemo = async () => {
    const msg = isDemo
      ? "Réinitialiser les données avec les exemples par défaut ?"
      : "Effacer TOUTES les données de votre boutique (produits, ventes, dépenses, clients) ? Cette action est définitive.";
    if (await uiConfirm(msg)) {
      if (isDemo) { storage.resetToDemo(); onReloadAllData(); } else { onClearData('all'); }
      onClose();
    }
  };

  const fld = 'w-full mt-1 px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/30';
  const lbl = 'text-xs font-bold text-stone-700';
  const card = 'rounded-2xl border border-stone-200 bg-white p-4 space-y-3';
  const cardTitle = (icon: React.ReactNode, t: string, hint?: string) => (
    <div>
      <h4 className="flex items-center gap-2 text-sm font-black text-stone-900">{icon}{t}</h4>
      {hint && <p className="text-xs text-stone-500 mt-0.5">{hint}</p>}
    </div>
  );
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'shop' as Tab, label: 'Boutique', icon: <Store className="w-4 h-4" /> },
    ...(!isDemo && isOwner ? [{ id: 'plan' as Tab, label: 'Abonnement', icon: <Gift className="w-4 h-4" /> }] : []),
    ...(!isDemo && isOwner ? [{ id: 'team' as Tab, label: 'Équipe', icon: <Users className="w-4 h-4" /> }] : []),
    { id: 'help' as Tab, label: 'Aide', icon: <LifeBuoy className="w-4 h-4" /> },
  ].filter(t => !(isCashier && t.id === 'shop'));

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs sm:p-4">
      <div className="w-full max-w-lg bg-stone-50 sm:rounded-3xl rounded-t-3xl shadow-2xl border border-stone-200 flex flex-col h-[94vh] sm:h-auto sm:max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95" data-testid="settings-modal">

        {/* En-tête fixe : identité + onglets */}
        <div className="bg-white border-b border-stone-200 px-4 pt-4 pb-2 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center overflow-hidden shrink-0">
              {formData.logo ? <img src={formData.logo} alt="Logo" className="w-full h-full object-contain" /> : <SettingsIcon className="w-5 h-5 text-stone-500" />}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-black text-lg text-stone-900 leading-tight">Paramètres</h3>
              <p className="text-xs text-stone-500 truncate">{formData.shopName || 'Ma boutique'}</p>
            </div>
            <button onClick={onClose} aria-label="Fermer" className="p-2 rounded-xl text-stone-500 hover:bg-stone-100"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex gap-1 mt-3" role="tablist">
            {tabs.map(t => (
              <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} data-testid={`settings-tab-${t.id}`}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl text-[11px] font-bold transition ${tab === t.id ? 'bg-emerald-800 text-white shadow-sm' : 'text-stone-600 hover:bg-stone-100'}`}>
                {t.icon}<span>{t.label}</span>
              </button>))}
          </div>
        </div>

        {/* ===== Onglet Boutique ===== */}
        {tab === 'shop' && !isCashier && (
          <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">

              <div className={card}>
                {cardTitle(<Store className="w-4 h-4 text-emerald-800" />, 'Ma boutique', 'Ces informations apparaissent sur vos reçus.')}
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-center overflow-hidden shrink-0">
                    {formData.logo ? <img src={formData.logo} alt="Logo" className="w-full h-full object-contain" /> : <span className="text-2xl">🏪</span>}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <label className="px-3 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs cursor-pointer">
                      {formData.logo ? 'Changer le logo' : 'Ajouter un logo'}
                      <input type="file" accept="image/*" onChange={handleLogoFile} className="hidden" />
                    </label>
                    {formData.logo && <button type="button" onClick={() => setFormData({ ...formData, logo: undefined })} className="px-3 py-2 rounded-xl bg-stone-100 text-stone-700 font-bold text-xs">Retirer</button>}
                  </div>
                </div>
                <div>
                  <label className={lbl}>Nom de la boutique *</label>
                  <input type="text" required value={formData.shopName} onChange={(e) => setFormData({ ...formData, shopName: e.target.value })} className={`${fld} font-semibold`} />
                </div>
                <div>
                  <label className={lbl}>Nom du gérant / propriétaire</label>
                  <input type="text" value={formData.ownerName} onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })} className={fld} />
                </div>
                <div>
                  <label className={lbl}>Secteur d'activité</label>
                  <Select value={formData.businessCategory || 'retail_food'} onChange={(e) => setFormData({ ...formData, businessCategory: e.target.value as any })} className={`${fld} font-bold text-emerald-900`}>
                    {Object.values(BUSINESS_PRESETS).map(preset => (<option key={preset.id} value={preset.id}>{preset.icon} {preset.title}</option>))}
                  </Select>
                </div>
              </div>

              <div className={card}>
                {cardTitle(<span className="text-base">📍</span>, 'Contact et monnaie')}
                <div>
                  <label className={lbl}>Téléphone / Mobile Money</label>
                  <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className={fld} placeholder="+225 07..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Pays</label>
                    <input type="text" value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} className={fld} />
                  </div>
                  <div>
                    <label className={lbl}>Ville / Quartier</label>
                    <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className={fld} />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Monnaie</label>
                  <Select value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value as CurrencyCode })} className={`${fld} font-bold text-emerald-800`}>
                    <option value="XOF">FCFA (XOF - UEMOA)</option>
                    <option value="GNF">GNF (Franc Guinéen)</option>
                    <option value="USD">USD ($ Dollar)</option>
                    <option value="EUR">EUR (€ Euro)</option>
                  </Select>
                </div>
              </div>

              {isOwner && (
                <div className={card}>
                  {cardTitle(<Wallet className="w-4 h-4 text-emerald-800" />, 'Trésorerie de départ', "L'argent que vous aviez avant de commencer à enregistrer. Sert au calcul de la trésorerie.")}
                  <div className="grid grid-cols-3 gap-2">
                    {([['openingCash', 'Espèces'], ['openingMobile', 'Mobile Money'], ['openingBank', 'Banque']] as const).map(([k, label]) => (
                      <div key={k}>
                        <label className="text-[11px] font-bold text-stone-600">{label}</label>
                        <input type="number" min="0" inputMode="numeric" placeholder="0" value={(formData as any)[k] ?? ''}
                          onChange={(e) => setFormData({ ...formData, [k]: e.target.value === '' ? undefined : Number(e.target.value) } as ShopSettings)}
                          className="w-full mt-1 px-2 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-mono-num" />
                      </div>))}
                  </div>
                </div>)}

              <details className="rounded-2xl border border-stone-200 bg-white group" open={!!(formData.isFormalized || formData.rccmNumber || formData.taxId)}>
                <summary className="flex items-center justify-between gap-2 p-4 cursor-pointer list-none">
                  <span className="flex items-center gap-2 text-sm font-black text-stone-900"><ShieldCheck className="w-4 h-4 text-emerald-800" />Statut légal <span className="text-xs font-semibold text-stone-500">(facultatif)</span></span>
                  <ChevronDown className="w-4 h-4 text-stone-500 transition group-open:rotate-180" />
                </summary>
                <div className="px-4 pb-4 space-y-3">
                  <label className="flex items-center gap-2 text-sm text-stone-700 font-semibold cursor-pointer">
                    <input type="checkbox" checked={formData.isFormalized} onChange={(e) => setFormData({ ...formData, isFormalized: e.target.checked })} className="rounded text-emerald-800 w-4 h-4" />
                    Mon entreprise est formalisée (RCCM)
                  </label>
                  <input type="text" placeholder="N° RCCM (ex : CI-ABJ-...)" value={formData.rccmNumber || ''} onChange={(e) => setFormData({ ...formData, rccmNumber: e.target.value })} className={fld} />
                  <input type="text" placeholder="N° compte contribuable / IFU" value={formData.taxId || ''} onChange={(e) => setFormData({ ...formData, taxId: e.target.value })} className={fld} />
                </div>
              </details>
            </div>

            {/* Bouton d'enregistrement toujours visible */}
            <div className="shrink-0 bg-white border-t border-stone-200 p-3">
              <button type="submit" data-testid="settings-save" className="w-full py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-black text-sm shadow-sm flex items-center justify-center gap-2 active:scale-95">
                <Save className="w-4 h-4" /><span>Enregistrer</span>
              </button>
            </div>
          </form>
        )}

        {/* ===== Onglet Abonnement & parrainage ===== */}
        {tab === 'plan' && !isDemo && isOwner && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <BillingPanel />
            <ReferralPanel />
          </div>
        )}

        {/* ===== Onglet Équipe & catalogue ===== */}
        {tab === 'team' && !isDemo && isOwner && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <TeamPanel />
            <CatalogPanel shopName={formData.shopName || ''} />
          </div>
        )}

        {/* ===== Onglet Aide, sauvegarde, sécurité ===== */}
        {tab === 'help' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!isDemo && <SupportPanel />}

            <div className={card}>
              {cardTitle(<HardDrive className="w-4 h-4 text-emerald-800" />, 'Sauvegarde', 'Vos données sont sur votre téléphone et marchent sans internet. Gardez une copie de sécurité.')}
              {importStatus && <div className="p-2.5 bg-emerald-100 text-emerald-900 rounded-xl text-xs font-semibold text-center">{importStatus}</div>}
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={handleExportBackup} className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs transition">
                  <Download className="w-4 h-4" /><span>Exporter</span>
                </button>
                {isOwner && (
                  <label className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs transition cursor-pointer">
                    <Upload className="w-4 h-4" /><span>Restaurer</span>
                    <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
                  </label>)}
              </div>
            </div>

            {!isDemo && (
              <details className="rounded-2xl border border-stone-200 bg-white group">
                <summary className="flex items-center justify-between gap-2 p-4 cursor-pointer list-none">
                  <span className="flex items-center gap-2 text-sm font-black text-stone-900"><Lock className="w-4 h-4 text-emerald-800" />Mot de passe</span>
                  <ChevronDown className="w-4 h-4 text-stone-500 transition group-open:rotate-180" />
                </summary>
                <div className="px-4 pb-4 space-y-2">
                  <input type="password" placeholder="Mot de passe actuel" autoComplete="current-password" value={pwCur} onChange={(e) => setPwCur(e.target.value)} className={fld} />
                  <input type="password" placeholder="Nouveau (8 caractères minimum)" autoComplete="new-password" value={pwNew} onChange={(e) => setPwNew(e.target.value)} className={fld} />
                  <button type="button" onClick={handleChangePassword} className="w-full py-2.5 rounded-xl bg-stone-800 hover:bg-stone-900 text-white font-bold text-xs">Changer mon mot de passe</button>
                  {pwMsg && <p className="text-xs font-semibold text-stone-700">{pwMsg}</p>}
                </div>
              </details>)}

            {isOwner && (
              <details className="rounded-2xl border border-rose-200 bg-white group" data-testid="danger-zone">
                <summary className="flex items-center justify-between gap-2 p-4 cursor-pointer list-none">
                  <span className="flex items-center gap-2 text-sm font-black text-rose-800"><AlertTriangle className="w-4 h-4" />Effacer des données</span>
                  <ChevronDown className="w-4 h-4 text-stone-500 transition group-open:rotate-180" />
                </summary>
                <div className="px-4 pb-4 space-y-3">
                  <p className="text-xs text-stone-500">Pour repartir de zéro et saisir vos vraies données. Action définitive.</p>
                  <div className="grid grid-cols-2 gap-2">
                    {([['sales', '🧾 Ventes'], ['expenses', '💸 Dépenses / achats'], ['customers', '👥 Clients & créances'], ['suppliers', '🚚 Fournisseurs & dettes'], ['products', '📦 Produits & stock']] as const).map(([kind, label]) => (
                      <button key={kind} type="button" onClick={async () => { if (await uiConfirm(`Effacer définitivement : ${label.slice(3)} ?`)) onClearData(kind); }}
                        className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-xs border border-rose-200 transition">{label}</button>))}
                    <button type="button" onClick={async () => { if (await uiConfirm("Charger un catalogue d'exemple de votre secteur ? Il REMPLACERA vos produits actuels.")) onClearData('sample'); }}
                      className="p-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs border border-stone-200 transition">✨ Catalogue d'exemple</button>
                  </div>
                  <button type="button" onClick={handleResetDemo} className="w-full text-xs text-rose-700 underline flex items-center justify-center gap-1 pt-1">
                    <RotateCcw className="w-3 h-3" /> {isDemo ? 'Réinitialiser les données exemples' : 'Effacer toutes les données de la boutique'}
                  </button>
                </div>
              </details>)}
          </div>
        )}
      </div>
    </div>
  );
};
