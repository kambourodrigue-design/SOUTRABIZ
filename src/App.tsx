/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Product, Sale, Expense, Customer, Supplier, ShopSettings, UserAccount } from './types';
import { storage } from './services/storage';
import { calculateCreditScore } from './services/creditScore';
import { authCache, DEMO_USER } from './services/auth';
import { api, ApiError, AdminListResponse, ShopBundle } from './services/api';
import { initialShopSettings } from './data/initialData';
import { getSectorProducts } from './data/sectorCatalogSeeds';

// Components
import { Navbar } from './components/common/Navbar';
import { BottomNav } from './components/common/BottomNav';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { SettingsModal } from './components/settings/SettingsModal';
import { AuthModal } from './components/auth/AuthModal';

import { DailyDashboard } from './components/dashboard/DailyDashboard';
import { POSView } from './components/pos/POSView';
import { StockView } from './components/stock/StockView';
import { ExpensesView } from './components/expenses/ExpensesView';
import { DebtsView } from './components/debts/DebtsView';
import { FinancesView } from './components/finances/FinancesView';
import { CreditScoreView } from './components/credit/CreditScoreView';
import { FormalizationGuide } from './components/formalization/FormalizationGuide';
import { AdminDashboard } from './components/admin/AdminDashboard';

type SessionState = 'loading' | 'out' | 'in';
type SyncState = 'idle' | 'pending' | 'saving' | 'error' | 'offline';
const DATA_KEYS = ['products', 'sales', 'expenses', 'customers', 'suppliers'] as const;

export default function App() {
  // Authentification
  const [session, setSession] = useState<SessionState>('loading');
  const [isDemo, setIsDemo] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserAccount>(DEMO_USER);
  const [viewingAs, setViewingAs] = useState<UserAccount | null>(null); // admin en consultation
  const [adminData, setAdminData] = useState<AdminListResponse | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [syncState, setSyncState] = useState<SyncState>('idle');

  // Master application states
  const [products, setProducts] = useState<Product[]>(() => storage.getProducts());
  const [sales, setSales] = useState<Sale[]>(() => storage.getSales());
  const [expenses, setExpenses] = useState<Expense[]>(() => storage.getExpenses());
  const [customers, setCustomers] = useState<Customer[]>(() => storage.getCustomers());
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => storage.getSuppliers());
  const [settings, setSettings] = useState<ShopSettings>(() => {
    const saved = storage.getSettings();
    return {
      ...saved,
      shopId: saved.shopId || 'shop-1',
      businessCategory: saved.businessCategory || 'retail_food',
    };
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // --- Synchronisation serveur ---------------------------------------------
  const syncEnabled = session === 'in' && !isDemo && !viewingAs;
  const hydratedRef = useRef(false);
  const lastSentRef = useRef<Record<string, string>>({});

  const applyBundle = useCallback((bundle: ShopBundle, fallback?: ShopSettings) => {
    const d = bundle.data || {};
    setProducts((d.products as Product[]) || []);
    setSales((d.sales as Sale[]) || []);
    setExpenses((d.expenses as Expense[]) || []);
    setCustomers((d.customers as Customer[]) || []);
    setSuppliers((d.suppliers as Supplier[]) || []);
    const st = bundle.settings || fallback;
    if (st) setSettings(st);
    // ce qui vient du serveur est considéré comme déjà synchronisé
    lastSentRef.current = {
      ...Object.fromEntries(DATA_KEYS.filter(k => d[k] !== undefined).map(k => [k, JSON.stringify(d[k])])),
      settings: st ? JSON.stringify(st) : '',
    };
  }, []);

  const goLoggedOut = useCallback(() => {
    hydratedRef.current = false;
    authCache.clear();
    storage.wipeLocal();
    setProducts(storage.getProducts());
    setSales(storage.getSales());
    setExpenses(storage.getExpenses());
    setCustomers(storage.getCustomers());
    setSuppliers(storage.getSuppliers());
    setSettings(storage.getSettings());
    setIsDemo(false);
    setViewingAs(null);
    setAdminData(null);
    setActiveTab('dashboard');
    setSession('out');
  }, []);

  // Au démarrage : reprendre la session si elle existe
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await api.me();
        if (cancelled) return;
        setCurrentUser(me.user);
        authCache.set(me.user);
        applyBundle(me);
        hydratedRef.current = true;
        setSession('in');
        setActiveTab(me.user.role === 'admin' ? 'admin' : 'dashboard');
      } catch (e) {
        if (cancelled) return;
        const cached = authCache.get();
        if (e instanceof ApiError && e.status === 0 && cached) {
          // hors-ligne : on continue avec les données locales
          setCurrentUser(cached);
          lastSentRef.current = {}; // tout renvoyer au retour du réseau
          hydratedRef.current = true;
          setSession('in');
          setSyncState('offline');
        } else {
          goLoggedOut();
        }
      }
    })();
    return () => { cancelled = true; };
  }, [applyBundle, goLoggedOut]);

  // Cache local (sert au mode hors-ligne)
  useEffect(() => { storage.saveProducts(products); }, [products]);
  useEffect(() => { storage.saveSales(sales); }, [sales]);
  useEffect(() => { storage.saveExpenses(expenses); }, [expenses]);
  useEffect(() => { storage.saveCustomers(customers); }, [customers]);
  useEffect(() => { storage.saveSuppliers(suppliers); }, [suppliers]);
  useEffect(() => { storage.saveSettings(settings); }, [settings]);

  const latest = useRef({ products, sales, expenses, customers, suppliers, settings });
  latest.current = { products, sales, expenses, customers, suppliers, settings };

  const pushToServer = useCallback(async () => {
    if (!hydratedRef.current) return;
    const cur: Record<string, unknown> = latest.current;
    const payload: Record<string, unknown> = {};
    const sent: Record<string, string> = {};
    for (const k of [...DATA_KEYS, 'settings'] as const) {
      const str = JSON.stringify(cur[k]);
      if (lastSentRef.current[k] !== str) { payload[k] = cur[k]; sent[k] = str; }
    }
    if (Object.keys(payload).length === 0) { setSyncState('idle'); return; }
    if (!navigator.onLine) { setSyncState('offline'); return; }
    setSyncState('saving');
    try {
      await api.saveData(payload);
      lastSentRef.current = { ...lastSentRef.current, ...sent };
      // des changements ont pu arriver pendant l'envoi
      const again = [...DATA_KEYS, 'settings'].some(
        k => lastSentRef.current[k] !== JSON.stringify((latest.current as any)[k])
      );
      setSyncState(again ? 'pending' : 'idle');
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        alert('Votre session a expiré. Veuillez vous reconnecter.');
        goLoggedOut();
      } else {
        setSyncState(e instanceof ApiError && e.status === 0 ? 'offline' : 'error');
      }
    }
  }, [goLoggedOut]);

  // Envoi différé à chaque modification
  useEffect(() => {
    if (!syncEnabled || !hydratedRef.current) return;
    setSyncState(s => (s === 'saving' ? s : 'pending'));
    const t = setTimeout(pushToServer, 1500);
    return () => clearTimeout(t);
  }, [products, sales, expenses, customers, suppliers, settings, syncEnabled, pushToServer]);

  // Nouvelle tentative : retour du réseau + toutes les 30 s si en attente
  useEffect(() => {
    if (!syncEnabled) return;
    const retry = () => { pushToServer(); };
    window.addEventListener('online', retry);
    const iv = setInterval(() => {
      setSyncState(s => { if (s === 'error' || s === 'offline' || s === 'pending') retry(); return s; });
    }, 30000);
    return () => { window.removeEventListener('online', retry); clearInterval(iv); };
  }, [syncEnabled, pushToServer]);

  // Dynamic Credit Score Calculation (incorporating both customers and suppliers)
  const creditScore = useMemo(() => {
    return calculateCreditScore(
      sales,
      expenses,
      customers,
      products,
      settings.isFormalized,
      suppliers
    );
  }, [sales, expenses, customers, products, settings.isFormalized, suppliers]);

  // Counts for notification badges
  const lowStockCount = useMemo(() => {
    return products.filter(p => p.stockQuantity <= p.minAlertThreshold).length;
  }, [products]);

  const debtorsCount = useMemo(() => {
    return customers.filter(c => c.totalDebt > 0).length;
  }, [customers]);

  const supplierDebtsCount = useMemo(() => {
    return suppliers.filter(s => s.totalDebt > 0).length;
  }, [suppliers]);

  // Handlers
  const handleRecordSale = (newSale: Sale, updatedProducts: Product[], updatedCustomers: Customer[]) => {
    setSales(prev => [newSale, ...prev]);
    setProducts(updatedProducts);
    setCustomers(updatedCustomers);
  };

  const handleAddExpense = (newExpense: Expense) => {
    setExpenses(prev => [newExpense, ...prev]);
  };

  const handleDeleteExpense = (expenseId: string) => {
    setExpenses(prev => prev.filter(e => e.id !== expenseId));
  };

  const handleUpdateProducts = (updated: Product[]) => {
    setProducts(updated);
  };

  const handleUpdateCustomers = (updated: Customer[]) => {
    setCustomers(updated);
  };

  const handleUpdateSuppliers = (updated: Supplier[]) => {
    setSuppliers(updated);
  };

  const handleSaveSettings = (updated: ShopSettings) => {
    setSettings(updated);
    // If business category changed, offer to adapt products
    if (updated.businessCategory !== settings.businessCategory) {
      const sectorProducts = getSectorProducts(updated.businessCategory);
      setProducts(sectorProducts);
    }
  };

  const handleReloadAllData = () => {
    setProducts(storage.getProducts());
    setSales(storage.getSales());
    setExpenses(storage.getExpenses());
    setCustomers(storage.getCustomers());
    setSuppliers(storage.getSuppliers());
    setSettings(prev => ({ ...storage.getSettings(), shopId: prev.shopId }));
  };

  // Auth Handlers
  const handleAuthSuccess = (user: UserAccount, shop: ShopSettings | null, isNew: boolean) => {
    setIsDemo(false);
    setCurrentUser(user);
    authCache.set(user);
    if (isNew && shop) {
      // nouveau compte : catalogue du secteur, le reste vide ; tout est envoyé au serveur
      lastSentRef.current = {};
      setSettings(shop);
      setProducts(getSectorProducts(shop.businessCategory));
      setSales([]); setExpenses([]); setCustomers([]); setSuppliers([]);
      hydratedRef.current = true;
      setSession('in');
      setActiveTab('dashboard');
      return;
    }
    // connexion : on charge les données du serveur
    api.me().then(me => {
      applyBundle(me, shop || undefined);
      hydratedRef.current = true;
      setSession('in');
      setActiveTab(user.role === 'admin' ? 'admin' : 'dashboard');
    }).catch(() => { alert('Impossible de charger vos données. Réessayez.'); goLoggedOut(); });
  };

  const handleStartDemo = () => {
    storage.wipeLocal();
    setProducts(storage.getProducts());
    setSales(storage.getSales());
    setExpenses(storage.getExpenses());
    setCustomers(storage.getCustomers());
    setSuppliers(storage.getSuppliers());
    setSettings({ ...initialShopSettings });
    setCurrentUser(DEMO_USER);
    setIsDemo(true);
    hydratedRef.current = false;
    setSession('in');
    setActiveTab('dashboard');
  };

  const handleLogout = async () => {
    if (!isDemo && syncEnabled) {
      await pushToServer(); // dernière sauvegarde avant de partir
    }
    if (!isDemo) { try { await api.logout(); } catch { /* ignore */ } }
    goLoggedOut();
  };

  // --- Espace admin ---
  const refreshAdmin = useCallback(async () => {
    try {
      setAdminError(null);
      setAdminData(await api.adminList());
    } catch (e) {
      setAdminError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'admin' && currentUser.role === 'admin' && session === 'in' && !isDemo) {
      refreshAdmin();
    }
  }, [activeTab, currentUser.role, session, isDemo, refreshAdmin]);

  const handleToggleUserStatus = async (userId: string) => {
    const u = adminData?.users.find(x => x.id === userId);
    if (!u) return;
    try {
      await api.adminSetStatus(userId, u.status === 'active' ? 'suspended' : 'active');
      await refreshAdmin();
    } catch (e) { alert((e as Error).message); }
  };

  const handleResetUserPassword = async (userId: string, newPassword: string) => {
    await api.adminResetPassword(userId, newPassword);
  };

  const handleDeleteUser = async (userId: string) => {
    await api.adminDelete(userId);
    await refreshAdmin();
  };

  const handleImpersonateShop = async (_shop: ShopSettings, user: UserAccount) => {
    try {
      // l'envoi des données de l'admin doit être terminé avant de changer de boutique
      await pushToServer();
      const bundle = await api.adminShopData(user.id);
      setViewingAs(user);
      applyBundle(bundle, _shop);
      setActiveTab('dashboard');
    } catch (e) { alert((e as Error).message); }
  };

  const handleExitViewing = async () => {
    try {
      const me = await api.me();
      setViewingAs(null);
      applyBundle(me);
      setActiveTab('admin');
    } catch { goLoggedOut(); }
  };

  if (session === 'loading') {
    return (
      <div className="min-h-screen bg-emerald-950 flex items-center justify-center text-emerald-100 font-bold">
        Chargement de SoutraBiz…
      </div>
    );
  }

  if (session === 'out') {
    return (
      <div className="min-h-screen bg-emerald-950">
        <AuthModal
          initialMode="login"
          canClose={false}
          onClose={() => {}}
          onAuthSuccess={handleAuthSuccess}
          onDemo={handleStartDemo}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col text-stone-900 selection:bg-emerald-600 selection:text-white">
      
      {/* Offline Toast Indicator */}
      <OfflineIndicator />

      {/* Top Navbar */}
      <Navbar
        settings={settings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onOpenAuth={() => {}}
        onLogout={handleLogout}
      />

      {viewingAs && (
        <div className="bg-amber-400 text-stone-950 text-xs sm:text-sm font-bold px-4 py-2 flex flex-wrap items-center justify-between gap-2">
          <span>
            👁️ Consultation de la boutique de {viewingAs.name} — les modifications ne sont pas enregistrées.
          </span>
          <button onClick={handleExitViewing} className="px-3 py-1 rounded-lg bg-stone-900 text-white">
            Quitter la consultation
          </button>
        </div>
      )}
      {isDemo && (
        <div className="bg-stone-800 text-amber-300 text-xs font-bold px-4 py-1.5 text-center">
          Mode démo — les données restent sur cet appareil. Déconnectez-vous pour créer un vrai compte.
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 lg:p-6 pb-24 lg:pb-8">
        {activeTab === 'dashboard' && (
          <DailyDashboard
            sales={sales}
            expenses={expenses}
            customers={customers}
            suppliers={suppliers}
            products={products}
            settings={settings}
            creditScore={creditScore}
            onNavigate={(tab) => setActiveTab(tab)}
            onQuickSale={() => setActiveTab('pos')}
            onQuickExpense={() => setActiveTab('expenses')}
            onQuickDebt={() => setActiveTab('debts')}
          />
        )}

        {activeTab === 'pos' && (
          <POSView
            products={products}
            customers={customers}
            settings={settings}
            onRecordSale={handleRecordSale}
          />
        )}

        {activeTab === 'stock' && (
          <StockView
            products={products}
            settings={settings}
            onUpdateProducts={handleUpdateProducts}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpensesView
            expenses={expenses}
            settings={settings}
            onAddExpense={handleAddExpense}
            onDeleteExpense={handleDeleteExpense}
          />
        )}

        {activeTab === 'debts' && (
          <DebtsView
            customers={customers}
            suppliers={suppliers}
            settings={settings}
            onUpdateCustomers={handleUpdateCustomers}
            onUpdateSuppliers={handleUpdateSuppliers}
          />
        )}

        {activeTab === 'finances' && (
          <FinancesView
            sales={sales}
            expenses={expenses}
            products={products}
            customers={customers}
            suppliers={suppliers}
            settings={settings}
          />
        )}

        {activeTab === 'credit' && (
          <CreditScoreView
            creditScore={creditScore}
            settings={settings}
            sales={sales}
            expenses={expenses}
            products={products}
            customers={customers}
            suppliers={suppliers}
            onNavigateToFormalization={() => setActiveTab('formalization')}
          />
        )}

        {activeTab === 'formalization' && (
          <FormalizationGuide
            settings={settings}
            onUpdateSettings={handleSaveSettings}
          />
        )}

        {activeTab === 'admin' && (
          <AdminDashboard
            data={adminData}
            error={adminError}
            onRefresh={refreshAdmin}
            onToggleUserStatus={handleToggleUserStatus}
            onResetPassword={handleResetUserPassword}
            onDeleteUser={handleDeleteUser}
            onImpersonateShop={handleImpersonateShop}
            currentUser={currentUser}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lowStockCount={lowStockCount}
        totalDebtorsCount={debtorsCount + supplierDebtsCount}
        isAdmin={currentUser.role === 'admin'}
      />

      {/* Settings & Offline Backup Modal */}
      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onSaveSettings={handleSaveSettings}
          onClose={() => setIsSettingsOpen(false)}
          onReloadAllData={handleReloadAllData}
          isDemo={isDemo}
        />
      )}

      {/* Indicateur de synchronisation */}
      {syncEnabled && syncState !== 'idle' && (
        <div className={`fixed left-3 bottom-20 lg:bottom-4 z-40 px-3 py-1.5 rounded-full text-[11px] font-bold shadow-md border ${
          syncState === 'error' ? 'bg-rose-100 text-rose-800 border-rose-200'
          : syncState === 'offline' ? 'bg-amber-100 text-amber-900 border-amber-200'
          : 'bg-white text-stone-700 border-stone-200'
        }`}>
          {syncState === 'saving' && '☁️ Enregistrement…'}
          {syncState === 'pending' && '☁️ Modifications en attente…'}
          {syncState === 'offline' && '📴 Hors-ligne — sera synchronisé au retour du réseau'}
          {syncState === 'error' && '⚠️ Échec de synchronisation — nouvelle tentative…'}
        </div>
      )}

    </div>
  );
}
