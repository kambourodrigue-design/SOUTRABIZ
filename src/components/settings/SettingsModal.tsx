import React, { useState } from 'react';
import { ShopSettings, CurrencyCode } from '../../types';
import { storage } from '../../services/storage';
import { 
  Settings as SettingsIcon, 
  X, 
  Save, 
  Download, 
  Upload, 
  RotateCcw, 
  ShieldCheck, 
  HardDrive,
  Check
} from 'lucide-react';

interface SettingsModalProps {
  settings: ShopSettings;
  onSaveSettings: (settings: ShopSettings) => void;
  onClose: () => void;
  onReloadAllData: () => void;
  isDemo?: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onSaveSettings,
  onClose,
  onReloadAllData,
  isDemo = false,
}) => {
  const [formData, setFormData] = useState<ShopSettings>({ ...settings });
  const [importStatus, setImportStatus] = useState<string | null>(null);

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
    link.download = `soutrabiz_sauvegarde_${new Date().toISOString().split('T')[0]}.json`;
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

  const handleResetDemo = () => {
    const msg = isDemo
      ? "Réinitialiser les données avec les exemples par défaut ?"
      : "Effacer TOUTES les données de votre boutique (produits, ventes, dépenses, clients) ? Cette action est définitive.";
    if (confirm(msg)) {
      if (isDemo) storage.resetToDemo(); else storage.clearAll();
      onReloadAllData();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 p-5 sm:p-6 my-auto animate-in fade-in zoom-in-95 space-y-5 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <SettingsIcon className="w-4 h-4" />
            </div>
            <h3 className="font-black text-lg text-stone-900">Paramètres de la Boutique</h3>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 p-1 rounded-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="text-xs font-bold text-stone-700">Nom du Commerce / Boutique *</label>
            <input
              type="text"
              required
              value={formData.shopName}
              onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-stone-700">Nom du Gérant / Propriétaire</label>
              <input
                type="text"
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700">Devise Principale</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value as CurrencyCode })}
                className="w-full mt-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm font-bold text-emerald-800"
              >
                <option value="XOF">FCFA (XOF - UEMOA)</option>
                <option value="GNF">GNF (Franc Guinéen)</option>
                <option value="USD">USD ($ Dollar)</option>
                <option value="EUR">EUR (€ Euro)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-stone-700">Pays</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700">Ville & Quartier</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-stone-700">Téléphone / Compte Mobile Money</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm"
                placeholder="+225 07..."
              />
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700">Secteur d'Activité</label>
              <select
                value={formData.businessCategory || 'retail_food'}
                onChange={(e) => setFormData({ ...formData, businessCategory: e.target.value as any })}
                className="w-full mt-1 px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-bold text-emerald-900"
              >
                <option value="retail_food">🛒 Commerce Général & Alimentation</option>
                <option value="fashion_tailor">👗 Couture & Atelier Mode</option>
                <option value="hardware_craft">🔨 Quincaillerie & BTP</option>
                <option value="restaurant_maquis">🍽️ Restaurant, Fast-food & Maquis</option>
                <option value="beauty_salon">💇 Salon Coiffure & Esthétique</option>
                <option value="garage_mechanic">🔧 Garage & Pièces Auto/Moto</option>
                <option value="services_cyber">📱 Services, Cyber & Mobile Money</option>
                <option value="health_pharma">💊 Dépôt Pharmaceutique</option>
                <option value="other">🏢 Autre Activité</option>
              </select>
            </div>
          </div>

          {/* Legal / Formalization identifiers */}
          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-stone-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-800" />
                <span>Statut Légal & Numéros d'Enregistrement</span>
              </span>
              <label className="flex items-center gap-1.5 text-xs text-stone-600 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isFormalized}
                  onChange={(e) => setFormData({ ...formData, isFormalized: e.target.checked })}
                  className="rounded text-emerald-800 focus:ring-emerald-700"
                />
                <span>Formalisé (RCCM)</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <input
                  type="text"
                  placeholder="N° RCCM (ex: CI-ABJ-...)"
                  value={formData.rccmNumber || ''}
                  onChange={(e) => setFormData({ ...formData, rccmNumber: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="N° Compte Contribuable / IFU"
                  value={formData.taxId || ''}
                  onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-black text-sm shadow-sm flex items-center justify-center gap-2 active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer les Paramètres</span>
          </button>

        </form>

        {/* Offline Storage & Backup Management */}
        <div className="pt-3 border-t border-stone-200 space-y-3">
          <div className="flex items-center gap-2 text-stone-800 font-bold text-xs uppercase tracking-wider">
            <HardDrive className="w-4 h-4 text-stone-600" />
            <span>Sauvegarde Locale & Sécurité Hors-Ligne</span>
          </div>

          <p className="text-xs text-stone-500">
            Toutes vos données sont stockées directement sur votre téléphone/appareil et fonctionnent 100% sans connexion internet.
          </p>

          {importStatus && (
            <div className="p-2.5 bg-emerald-100 text-emerald-900 rounded-xl text-xs font-semibold text-center">
              {importStatus}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleExportBackup}
              className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exporter Données</span>
            </button>

            <label className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs transition cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Restaurer Fichier</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>
          </div>

          {/* Déploiement Vercel / Cloudflare */}
          <div className="pt-2 border-t border-stone-200/80">
            <span className="text-[11px] font-extrabold text-stone-600 uppercase tracking-wider block mb-1.5">
              Déploiement Vercel / Cloudflare Pages
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <a
                href="/bizflow-africa-source.zip"
                download="bizflow-africa-source.zip"
                className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-xs transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Code Source Complet (.ZIP)</span>
              </a>

              <a
                href="/bizflow-africa-dist.zip"
                download="bizflow-africa-dist.zip"
                className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-stone-800 hover:bg-stone-900 text-white font-bold text-xs shadow-xs transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Site Compilé Prêt (.ZIP)</span>
              </a>
            </div>
            <p className="text-[10px] text-stone-400 mt-1">
              Prêt à importer sur GitHub, Vercel ou en glisser-déposer sur Cloudflare Pages.
            </p>
          </div>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={handleResetDemo}
              className="text-xs text-stone-400 hover:text-stone-600 underline flex items-center justify-center gap-1 mx-auto"
            >
              <RotateCcw className="w-3 h-3" /> {isDemo ? 'Réinitialiser les données exemples' : 'Effacer toutes les données de la boutique'}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
