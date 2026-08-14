import React, { useEffect } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useUIStore } from '../../stores/uiStore';
import { useGameLoop } from '../../hooks/useGameLoop';
import { GameScene } from '../scene/GameScene';
import { TopBar } from '../hud/TopBar';
import { BottomNav } from '../hud/BottomNav';
import { NotificationToast } from '../hud/NotificationToast';
import { DashboardPanel } from '../panels/DashboardPanel';
import { SourcingPanel } from '../panels/SourcingPanel';
import { OrderPanel } from '../panels/OrderPanel';
import { LogisticsPanel } from '../panels/LogisticsPanel';
import { FinancePanel } from '../panels/FinancePanel';
import { ShopPanel } from '../panels/ShopPanel';
import { TalentHubPanel } from '../panels/TalentHubPanel';
import { TaxPanel } from '../panels/TaxPanel';
import { EmployeePanel } from '../panels/EmployeePanel';
import { LoanPanel } from '../panels/LoanPanel';
import { MarketingPanel } from '../panels/MarketingPanel';
import { CarrierPanel } from '../panels/CarrierPanel';
import { ListingPanel } from '../panels/ListingPanel';
import { SaveLoadPanel } from '../panels/SaveLoadPanel';
import { Modal } from '../ui/Modal';
import { AnimatePresence } from 'framer-motion';
import { EventDialog } from '../panels/EventDialog';
import { FxLayer } from '../fx/FxLayer';

export const GameScreen: React.FC = () => {
  const activePanel = useGameStore(s => s.activePanel);
  const setActivePanel = useGameStore(s => s.setActivePanel);
  const initNewGame = useGameStore(s => s.initNewGame);
  const player = useGameStore(s => s.player);
  const gamePhase = useGameStore(s => s.gamePhase);
  const showNotifications = useUIStore(s => s.showNotifications);
  const showSettings = useUIStore(s => s.showSettings);
  const toggleNotifications = useUIStore(s => s.toggleNotifications);
  const toggleSettings = useUIStore(s => s.toggleSettings);
  const notifications = useGameStore(s => s.notifications);
  const markNotificationRead = useGameStore(s => s.markNotificationRead);

  // 启动游戏循环
  useGameLoop();

  // 首次进入初始化
  useEffect(() => {
    if (gamePhase === 'menu') {
      initNewGame();
    }
  }, []);

  const renderPanel = () => {
    if (!activePanel) return null;
    const onClose = () => setActivePanel(null);

    switch (activePanel) {
      case 'dashboard': return <DashboardPanel onClose={onClose} />;
      case 'sourcing': return <SourcingPanel onClose={onClose} />;
      case 'talentHub': return <TalentHubPanel onClose={onClose} />;
      case 'listing': return <ListingPanel onClose={onClose} />;
      case 'orders': return <OrderPanel onClose={onClose} />;
      case 'logistics': return <LogisticsPanel onClose={onClose} />;
      case 'finance': return <FinancePanel onClose={onClose} />;
      case 'shop': return <ShopPanel onClose={onClose} />;
      case 'tax': return <TaxPanel onClose={onClose} />;
      case 'employees': return <EmployeePanel onClose={onClose} />;
      case 'loans': return <LoanPanel onClose={onClose} />;
      case 'marketing': return <MarketingPanel onClose={onClose} />;
      case 'carrier': return <CarrierPanel onClose={onClose} />;
      case 'save': return <SaveLoadPanel onClose={onClose} />;
      default: return null;
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950">
      {/* 3D场景层 */}
      <GameScene />

      {/* HUD层 */}
      <TopBar />
      <BottomNav />
      <NotificationToast />
      <FxLayer />

      {/* 面板层 */}
      <AnimatePresence>
        {activePanel && (
          <div className="absolute inset-0 z-30 flex items-start justify-center pt-16 pb-16 pointer-events-none">
            <div className="pointer-events-auto w-full max-w-3xl max-h-full overflow-y-auto mx-4">
              {renderPanel()}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* 通知模态 */}
      <Modal isOpen={showNotifications} onClose={toggleNotifications} title="🔔 通知中心" maxWidth="max-w-md">
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">暂无通知</p>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  n.read ? 'bg-slate-800/50' : 'bg-slate-800 border border-slate-700'
                }`}
                onClick={() => markNotificationRead(n.id)}
              >
                <div className="flex items-start gap-2">
                  <span className="text-sm">
                    {n.type === 'danger' ? '🔴' : n.type === 'warning' ? '🟡' : n.type === 'success' ? '🟢' : '🔵'}
                  </span>
                  <div>
                    <p className={`text-sm ${n.read ? 'text-slate-400' : 'text-slate-200 font-medium'}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                    <p className="text-[10px] text-slate-600 mt-1">
                      Day {player.day}
                    </p>
                  </div>
                  {!n.read && <span className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0 mt-1.5" />}
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* 事件对话框 */}
      <EventDialog />

      {/* 设置模态 */}
      <Modal isOpen={showSettings} onClose={toggleSettings} title="⚙️ 设置" maxWidth="max-w-sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-400">管理你的游戏存档：保存进度、读取旧档、删除无用槽位。</p>
          <button
            onClick={() => { toggleSettings(); setActivePanel('save'); }}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 px-3 rounded-lg text-sm font-medium cursor-pointer transition-colors"
          >
            💾 打开存档管理
          </button>
          <div className="text-xs text-slate-600 pt-4 text-center">
            Phase 0 · React + Three.js + Zustand
          </div>
        </div>
      </Modal>
    </div>
  );
};
