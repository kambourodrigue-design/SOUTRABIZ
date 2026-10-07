import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Receipt, 
  BookUser, 
  Landmark,
  TrendingUp
} from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  lowStockCount: number;
  totalDebtorsCount: number;
  isAdmin?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  lowStockCount,
  totalDebtorsCount,
  isAdmin = false,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Accueil', icon: LayoutDashboard },
    { id: 'pos', label: 'Caisse', icon: ShoppingCart, highlight: true },
    { id: 'finances', label: 'Ratios', icon: TrendingUp },
    { id: 'stock', label: 'Stocks', icon: Package, badge: lowStockCount > 0 ? lowStockCount : null },
    { id: 'debts', label: 'Dettes', icon: BookUser, badge: totalDebtorsCount > 0 ? totalDebtorsCount : null },
    ...(isAdmin 
      ? [{ id: 'admin', label: 'Admin', icon: Landmark, badge: '👑' }]
      : [{ id: 'credit', label: 'Banque', icon: Landmark }]
    ),
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 px-1 py-1.5 shadow-lg safe-bottom">
      <div className="grid grid-cols-6 gap-0.5 max-w-md mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1 rounded-xl transition ${
                isActive
                  ? 'text-emerald-800 font-bold'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              {/* Highlight circle for POS */}
              <div className={`relative p-1 rounded-xl transition ${
                tab.highlight && !isActive ? 'bg-amber-100 text-amber-900' : ''
              } ${isActive ? 'bg-emerald-100 text-emerald-800' : ''}`}>
                <Icon className={`w-5 h-5 ${tab.highlight ? 'stroke-[2.5]' : ''}`} />
                
                {/* Notification Badge */}
                {tab.badge && (
                  <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] tracking-tight mt-0.5 truncate max-w-[48px] ${isActive ? 'font-bold' : 'font-medium'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
