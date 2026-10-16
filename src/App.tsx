/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { Product, Sale, Expense, Customer, Supplier, ShopSettings, UserAccount } from './types';
import { storage } from './services/storage';
import { calculateCreditScore } from './services/creditScore';
import { authCache, DEMO_USER } from './services/auth';
import { api, ApiError } from './services/api';
import { SyncEngine, fetchAllChanges, buildSnapshot, type Snapshot, type SyncInfo } from './services/syncEngine';
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
type ShopRole = 'owner' | 'manager' | 'cashier';
const ALL_TABS = ['dashboard', 'pos', 'finances', 'stock', 'expenses', 'debts', 'credit', 'formalization'];
const tabsFor = (role: ShopRole): string[] =>
  role === 'cashier' ? ['pos', 'debts'] : ALL_TABS;
const ROLE_LABEL: Record<ShopRole, string> = { owner: 'PRO', manager: 'GÉRANT', cashier: 'CAISSIER' };

export default function App() {
  // Authentification
  const [session, setSession] = useState<SessionState>('loading');
  const [isDemo, setIsDemo] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserAccount>(DEMO_USER);
  const [viewingAs, setViewingAs] = useState<UserAccount | null>(null); // admin en consultation
  const [syncInfo, setSyncInfo] = useState<SyncInfo>({ status: 'idle', pending: 0, lastSync: null });

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

  // --- Synchronisation serveur (voir services/syncEngine.ts) -----------------
  const shopRole: ShopRole = isDemo ? 'owner' : (currentUser.shopRole || 'owner');
  const isPlatformAdmin = currentUser.role === 'admin';
  const syncEnabled = session === 'in' && !isDemo && !viewingAs;

  const latest = useRef<Snapshot>({ products, sales, expenses, customers, suppliers, settings });
  latest.current = { products, sales, expenses, customers, suppliers, settings };
  const unauthorizedRef = useRef<() => void>(() => {});
  const engineRef = useRef<SyncEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current = new SyncEngine({
      getSnapshot: () => latest.current,
      flush: () => { try { flushSync(() => {}); } catch { /* ignore */ } },
      setSnapshot: (p) => {
        latest.current = { ...latest.current, ...p };
        flushSync(() => {
          if (p.products) setProducts(p.products);
          if (p.sales) setSales(p.sales);
          if (p.expenses) setExpenses(p.expenses);
          if (p.customers) setCustomers(p.customers);
          if (p.suppliers) setSuppliers(p.suppliers);
          if (p.settings) setSettings(p.settings);
        });
      },
      onInfo: setSyncInfo,
      onUnauthorized: () => unauthorizedRef.current(),
    });
  }
  const engine = engineRef.current;

  const goLoggedOut = useCallback(() => {
    engine.destroy();
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
    setActiveTab('dashboard');
    setSession('out');
  }, [engine]);
  unauthorizedRef.current = () => {
    alert('Votre session a expiré ou votre accès a été suspendu. Veuillez vous reconnecter.');
    goLoggedOut();
  };

  const firstTab = (u: UserAccount) =>
    u.role === 'admin' ? 'admin' : (u.shopRole === 'cashier' ? 'pos' : 'dashboard');

  // Au démarrage : reprendre la session si elle existe
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await api.me();
        if (cancelled) return;
        setCurrentUser(me.user);
        authCache.set(me.user);
        await engine.start(me.user.shopId);
        if (cancelled) return;
        setSession('in');
        setActiveTab(firstTab(me.user));
      } catch (e) {
        if (cancelled) return;
        const cached = authCache.get();
        if (e instanceof ApiError && e.status === 0 && cached) {
          // hors-ligne : on continue avec les données locales, tout sera envoyé au retour du réseau
          setCurrentUser(cached);
          try { await engine.start(cached.shopId); } catch { /* données locales seulement */ }
          if (cancelled) return;
          setSession('in');
          setActiveTab(firstTab(cached));
        } else {
          goLoggedOut();
        }
      }
    })();
    return () => { cancelled = true; };
  }, [engine, goLoggedOut]);

  // Cache local (sert au mode hors-ligne) — pas pendant la consultation d'une autre boutique
  useEffect(() => { if (!viewingAs) storage.saveProducts(products); }, [products, viewingAs]);
  useEffect(() => { if (!viewingAs) storage.saveSales(sales); }, [sales, viewingAs]);
  useEffect(() => { if (!viewingAs) storage.saveExpenses(expenses); }, [expenses, viewingAs]);
  useEffect(() => { if (!viewingAs) storage.saveCustomers(customers); }, [customers, viewingAs]);
  useEffect(() => { if (!viewingAs) storage.saveSuppliers(suppliers); }, [suppliers, viewingAs]);
  useEffect(() => { if (!viewingAs) storage.saveSettings(settings); }, [settings, viewingAs]);

  // Chaque modification est repérée par le moteur, qui l'enverra en différé
  useEffect(() => {
    if (syncEnabled) engine.notify();
  }, [products, sales, expenses, customers, suppliers, settings, syncEnabled, engine]);

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
    if (!isDemo && shopRole === 'cashier') return;
    setSettings(updated);
    // If business category changed, offer to adapt products
    if (isDemo && updated.businessCategory !== settings.businessCategory) {
      setProducts(getSectorProducts(updated.businessCategory));
    }
  };

  const handleClearData = (kind: 'sales' | 'expenses' | 'customers' | 'suppliers' | 'products' | 'all' | 'sample') => {
    if (!isDemo && shopRole !== 'owner') return;
    if (kind === 'sales' || kind === 'all') setSales([]);
    if (kind === 'expenses' || kind === 'all') setExpenses([]);
    if (kind === 'customers' || kind === 'all') setCustomers([]);
    if (kind === 'suppliers' || kind === 'all') setSuppliers([]);
    if (kind === 'products' || kind === 'all') setProducts([]);
    if (kind === 'sample') setProducts(getSectorProducts(settings.businessCategory));
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
  const handleAuthSuccess = async (user: UserAccount, _shop: ShopSettings | null, _isNew: boolean) => {
    setIsDemo(false);
    setCurrentUser(user);
    authCache.set(user);
    setSession('loading');
    try {
      await engine.start(user.shopId); // le serveur fait foi : on charge les données de la boutique
      setSession('in');
      setActiveTab(firstTab(user));
    } catch {
      alert('Impossible de charger vos données. Vérifiez votre connexion et réessayez.');
      try { await api.logout(); } catch { /* ignore */ }
      goLoggedOut();
    }
  };

  const handleStartDemo = () => {
    engine.destroy();
    storage.wipeLocal();
    setProducts(storage.getProducts());
    setSales(storage.getSales());
    setExpenses(storage.getExpenses());
    setCustomers(storage.getCustomers());
    setSuppliers(storage.getSuppliers());
    setSettings({ ...initialShopSettings });
    setCurrentUser(DEMO_USER);
    setIsDemo(true);
    setSession('in');
    setActiveTab('dashboard');
  };

  const handleLogout = async () => {
    if (!isDemo && syncEnabled) {
      try { await engine.syncNow(); } catch { /* dernière sauvegarde au mieux */ }
      if (engine.pendingCount() > 0 && !confirm(
        `${engine.pendingCount()} modification(s) n'ont pas encore été envoyées (pas de réseau ?). Elles seront PERDUES si vous vous déconnectez. Se déconnecter quand même ?`
      )) return;
    }
    if (!isDemo) { try { await api.logout(); } catch { /* ignore */ } }
    goLoggedOut();
  };

  // --- Espace admin : consultation d'une boutique (lecture seule) ---
  const handleImpersonate = async (user: UserAccount) => {
    try {
      await engine.syncNow();                    // envoyer d'abord ce qui attend
      engine.stop(true);                         // plus aucun envoi pendant la consultation
      const { changes } = await fetchAllChanges(user.shopId);
      const snap = buildSnapshot(changes, { settings: null });
      engine.applyForeign(snap);
      setViewingAs(user);
      setActiveTab('dashboard');
    } catch (e) { alert((e as Error).message); }
  };

  const handleExitViewing = async () => {
    try {
      setSession('loading');
      await engine.restart(currentUser.shopId);
      setViewingAs(null);
      setActiveTab('admin');
      setSession('in');
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
        allowedTabs={isPlatformAdmin ? undefined : tabsFor(shopRole)}
        roleLabel={ROLE_LABEL[shopRole]}
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
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 lg:p-6 pb-24 xl:pb-8">
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
            suppliers={suppliers}
            onUpdateSuppliers={handleUpdateSuppliers}
            onAddExpense={handleAddExpense}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpensesView
            expenses={expenses}
            settings={settings}
            onAddExpense={handleAddExpense}
            onDeleteExpense={handleDeleteExpense}
            suppliers={suppliers}
            onUpdateSuppliers={handleUpdateSuppliers}
          />
        )}

        {activeTab === 'debts' && (
          <DebtsView
            customers={customers}
            suppliers={suppliers}
            settings={settings}
            onUpdateCustomers={handleUpdateCustomers}
            onUpdateSuppliers={handleUpdateSuppliers}
            allowSuppliers={shopRole !== 'cashier'}
            onAddExpense={shopRole !== 'cashier' ? handleAddExpense : undefined}
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
            currentUser={currentUser}
            onImpersonate={handleImpersonate}
            onUnauthorized={() => unauthorizedRef.current()}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lowStockCount={lowStockCount}
        totalDebtorsCount={debtorsCount + supplierDebtsCount}
        isAdmin={isPlatformAdmin}
        allowedTabs={isPlatformAdmin ? undefined : tabsFor(shopRole)}
      />

      {/* Settings & Offline Backup Modal */}
      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onSaveSettings={handleSaveSettings}
          onClose={() => setIsSettingsOpen(false)}
          onReloadAllData={handleReloadAllData}
          onClearData={handleClearData}
          isDemo={isDemo}
          shopRole={shopRole}
        />
      )}

      {/* Indicateur de synchronisation */}
      {syncEnabled && syncInfo.status !== 'idle' && (
        <div className={`fixed left-3 bottom-20 xl:bottom-4 z-40 px-3 py-1.5 rounded-full text-[11px] font-bold shadow-md border ${
          syncInfo.status === 'error' ? 'bg-rose-100 text-rose-800 border-rose-200'
          : syncInfo.status === 'offline' ? 'bg-amber-100 text-amber-900 border-amber-200'
          : 'bg-white text-stone-700 border-stone-200'
        }`}>
          {syncInfo.status === 'syncing' && '☁️ Synchronisation…'}
          {syncInfo.status === 'pending' && `☁️ ${syncInfo.pending} modification(s) en attente…`}
          {syncInfo.status === 'offline' && `📴 Hors-ligne — ${syncInfo.pending} modification(s) seront envoyées au retour du réseau`}
          {syncInfo.status === 'error' && '⚠️ Échec de synchronisation — nouvelle tentative…'}
        </div>
      )}

    </div>
  );
}
