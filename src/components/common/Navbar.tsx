import React from 'react';
import { ShopSettings, UserAccount } from '../../types';
import { BUSINESS_PRESETS } from '../../services/businessPresets';
import { PWAInstallButton } from './PWAInstallButton';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { 
  Store, 
  Wifi, 
  WifiOff, 
  Settings as SettingsIcon, 
  ShieldCheck, 
  User, 
  LogIn, 
  LogOut, 
  LayoutDashboard,
  Sparkles
} from 'lucide-react';

interface NavbarProps {
  settings: ShopSettings;
  onOpenSettings: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: UserAccount;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  onOpenSettings,
  activeTab,
  setActiveTab,
  currentUser,
  onOpenAuth,
  onLogout,
}) => {
  const isOnline = useOnlineStatus();
  const preset = BUSINESS_PRESETS[settings.businessCategory] || BUSINESS_PRESETS.other;

  return (
    <header className="sticky top-0 z-40 bg-emerald-900 text-white shadow-md border-b border-emerald-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Brand & Store Name */}
        <div className="flex items-center gap-2 sm:gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center shadow-inner text-emerald-950 font-black text-xl shrink-0">
            {preset.icon || 'S'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-base sm:text-lg tracking-tight truncate max-w-[150px] sm:max-w-xs text-white">
                {settings.shopName}
              </h1>
              {settings.isFormalized && (
                <span title="Entreprise Formalisée (RCCM)" className="text-amber-400">
                  <ShieldCheck className="w-4 h-4" />
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-200">
              <span className="truncate">{settings.city}</span>
              <span>•</span>
              <span className="font-semibold text-amber-300">{settings.currency}</span>
            </div>
          </div>
        </div>

        {/* Desktop Quick Nav Tabs */}
        <nav className="hidden lg:flex items-center gap-1 text-xs lg:text-sm font-medium">
          {[
            { id: 'dashboard', label: 'Tableau de bord' },
            { id: 'pos', label: 'Caisse POS' },
            { id: 'finances', label: 'Ratios' },
            { id: 'stock', label: 'Stocks' },
            { id: 'expenses', label: 'Dépenses' },
            { id: 'debts', label: 'Dettes' },
            { id: 'credit', label: 'Score Crédit' },
            { id: 'formalization', label: 'Formalisation' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-2.5 py-1.5 rounded-lg transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-emerald-800 text-white font-bold shadow-xs'
                  : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}

          {/* Admin Tab if role is admin */}
          {currentUser.role === 'admin' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-2.5 py-1.5 rounded-lg transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'admin'
                  ? 'bg-amber-400 text-stone-950 font-black shadow-xs'
                  : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Admin & PME</span>
            </button>
          )}
        </nav>

        {/* Right Actions: User Account + Connectivity + PWA Install + Settings */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          
          {/* User Account / Login Pill */}
          <div className="flex items-center">
            {currentUser.role === 'admin' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`lg:hidden px-2 py-1 rounded-xl text-xs font-black mr-1 flex items-center gap-1 ${
                  activeTab === 'admin' ? 'bg-amber-400 text-stone-950' : 'bg-amber-400/20 text-amber-300'
                }`}
              >
                <span>👑 Admin</span>
              </button>
            )}

            <button
              onClick={() => { if (confirm('Se déconnecter ?')) onLogout(); }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-800/90 hover:bg-emerald-800 text-xs font-bold text-emerald-100 border border-emerald-700 transition"
              title="Se déconnecter"
            >
              <div className="w-5 h-5 rounded-full bg-emerald-700 flex items-center justify-center text-[10px] text-amber-300 font-black">
                {currentUser.role === 'admin' ? 'A' : currentUser.name.charAt(0)}
              </div>
              <span className="hidden sm:inline truncate max-w-[100px]">
                {currentUser.name.split(' ')[0]}
              </span>
              <span className={`text-[10px] px-1 rounded font-mono ${currentUser.role === 'admin' ? 'bg-amber-400 text-stone-950 font-bold' : 'bg-emerald-950/60 text-emerald-300'}`}>
                {currentUser.role === 'admin' ? 'ADMIN' : 'PRO'}
              </span>
              <LogOut className="w-3.5 h-3.5 text-emerald-300" />
            </button>
          </div>

          {/* PWA In-App Install Prompt */}
          <PWAInstallButton />

          {/* Settings button */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-emerald-100 transition active:scale-95"
            title="Paramètres de l'activité"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>
        </div>

      </div>
    </header>
  );
};

