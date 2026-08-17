import React from 'react';
import { useGameStore } from '../../stores/gameStore';
import { getMissingCerts } from '../../game/systems/OpeningSystem';

interface NavItem {
  id: string;
  icon: string;
  label: string;
  panel: string;
}

const navItems: NavItem[] = [
  { id: 'dashboard', icon: '📊', label: '看板', panel: 'dashboard' },
  { id: 'sourcing', icon: '🛒', label: '选品', panel: 'sourcing' },
  { id: 'listing', icon: '📝', label: '上架', panel: 'listing' },
  { id: 'talent', icon: '🌟', label: '达人', panel: 'talentHub' },
  { id: 'orders', icon: '📋', label: '订单', panel: 'orders' },
  { id: 'logistics', icon: '📦', label: '物流', panel: 'logistics' },
  { id: 'finance', icon: '💰', label: '财务', panel: 'finance' },
  { id: 'shop', icon: '🏪', label: '店铺', panel: 'shop' },
  { id: 'tax', icon: '🧾', label: '税务', panel: 'tax' },
  { id: 'compliance', icon: '📜', label: '办证', panel: 'compliance' },
  { id: 'employees', icon: '🧑‍💼', label: '员工', panel: 'employees' },
  { id: 'loans', icon: '💳', label: '贷款', panel: 'loans' },
  { id: 'marketing', icon: '📣', label: '营销', panel: 'marketing' },
  { id: 'carrier', icon: '🚚', label: '承运商', panel: 'carrier' },
  { id: 'save', icon: '💾', label: '存档', panel: 'save' },
  { id: 'achievements', icon: '🏆', label: '成就', panel: 'achievements' },
  { id: 'data', icon: '📈', label: '数据', panel: 'data' },
];

export const BottomNav: React.FC = () => {
  const activePanel = useGameStore(s => s.activePanel);
  const setActivePanel = useGameStore(s => s.setActivePanel);
  const orders = useGameStore(s => s.orders);
  const inventory = useGameStore(s => s.inventory);

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const unlistedCount = inventory.filter(i => i.quantity > 0 && !(i.isListed ?? false)).length;
  const missingCertsCount = getMissingCerts(useGameStore.getState()).length;

  const badges: Record<string, { count: number; color: string } | undefined> = {
    orders: pendingCount > 0 ? { count: pendingCount, color: 'bg-red-500' } : undefined,
    logistics: pendingCount > 0 ? { count: pendingCount, color: 'bg-amber-500' } : undefined,
    listing: unlistedCount > 0 ? { count: unlistedCount, color: 'bg-sky-500' } : undefined,
    compliance: missingCertsCount > 0 ? { count: missingCertsCount, color: 'bg-rose-500' } : undefined,
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/90 backdrop-blur-md border-t border-slate-700/50">
      <div className="flex items-center justify-around px-1 py-1.5">
        {navItems.map(item => {
          const badge = badges[item.id];
          return (
            <button
              key={item.id}
              onClick={() => setActivePanel(activePanel === item.panel ? null : item.panel)}
              className={`flex flex-col items-center gap-0.5 px-1.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                activePanel === item.panel
                  ? 'bg-purple-600/20 text-purple-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <span className="relative text-lg">
                {item.icon}
                {badge && (
                  <span className={`absolute -top-1 -right-2 min-w-4 h-4 px-1 ${badge.color} text-white text-[10px] rounded-full flex items-center justify-center font-bold`}>
                    {badge.count > 9 ? '9+' : badge.count}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
