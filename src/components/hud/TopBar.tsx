import React, { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useUIStore } from '../../stores/uiStore';
import { formatGold, formatDay } from '../../utils/format';
import { ProgressBar } from '../ui/ProgressBar';
import { SPEED_LABELS } from '../../game/types';
import type { GameSpeed } from '../../game/types';

const speeds: GameSpeed[] = ['pause', '1x', '2x', '4x', '8x'];

export const TopBar: React.FC = () => {
  const player = useGameStore(s => s.player);
  const gameSpeed = useGameStore(s => s.gameSpeed);
  const dayProgress = useGameStore(s => s.dayProgress);
  const setGameSpeed = useGameStore(s => s.setGameSpeed);
  const skipToNextDay = useGameStore(s => s.skipToNextDay);
  const gamePhase = useGameStore(s => s.gamePhase);
  const notifications = useGameStore(s => s.notifications);
  const toggleNotifications = useUIStore(s => s.toggleNotifications);
  const toggleSettings = useUIStore(s => s.toggleSettings);
  const [collapsed, setCollapsed] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="fixed top-0 left-0 right-0 z-40 glass border-b border-slate-700/30">
      <div className="flex items-center justify-between px-3 md:px-4 py-1.5 gap-2">
        {/* 左侧：标题 */}
        <button onClick={() => setCollapsed(!collapsed)} className="flex items-center gap-2 shrink-0 cursor-pointer">
          <span className="text-xl md:text-2xl font-extrabold bg-gradient-to-r from-purple-400 via-fuchsia-400 to-orange-400 text-transparent bg-clip-text">
            TokShop
          </span>
          <span className="text-[10px] text-slate-600 bg-slate-800/60 px-1.5 py-0.5 rounded hidden sm:inline font-mono">
            D{formatDay(player.day)}
          </span>
        </button>

        {/* 中间：资源（小屏可折叠） */}
        {!collapsed && (
          <div className="flex items-center gap-2 md:gap-3 flex-wrap justify-center">
            <ResourceBadge icon="💰" value={formatGold(player.gold)} color="text-amber-400" />
            <HealthBadge value={player.healthScore} />
            <span className="text-xs text-slate-500 hidden md:inline">
              ⭐ <span className="text-slate-300 font-mono">{player.reputation}</span>
            </span>
            <span className="text-xs text-purple-400 font-bold hidden sm:inline">Lv.{player.shopLevel}</span>
          </div>
        )}

        {/* 右侧：控制 */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* 日进度条 */}
          <div className="w-16 md:w-20 hidden sm:block">
            <ProgressBar value={dayProgress} max={1} color="#a855f7" height="h-1.5" />
          </div>

          {/* 速度 */}
          <div className="flex items-center bg-slate-800/60 rounded-lg p-0.5">
            {speeds.map(speed => (
              <button
                key={speed}
                onClick={() => setGameSpeed(speed)}
                className={`px-1.5 py-1 text-[10px] md:text-xs rounded-md transition-all cursor-pointer whitespace-nowrap ${
                  gameSpeed === speed ? 'bg-purple-600 text-white shadow-glow-purple' : 'text-slate-400 hover:text-white'
                }`}
              >
                {SPEED_LABELS[speed].split(' ')[1] || SPEED_LABELS[speed]}
              </button>
            ))}
          </div>

          {/* 快进 */}
          <button
            onClick={skipToNextDay}
            disabled={gamePhase !== 'playing'}
            title="跳过一天"
            className="px-1.5 py-1 text-xs rounded-md bg-slate-800/60 text-slate-300 hover:text-white hover:bg-slate-700/80 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all whitespace-nowrap"
          >
            ⏭
          </button>

          {/* 通知铃铛 */}
          <button onClick={toggleNotifications} className="relative text-slate-400 hover:text-white cursor-pointer transition-colors px-1">
            🔔
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold badge-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* 设置 */}
          <button onClick={toggleSettings} className="text-slate-400 hover:text-white cursor-pointer transition-colors px-1 hidden sm:block">⚙️</button>
        </div>
      </div>
    </div>
  );
};

const ResourceBadge: React.FC<{ icon: string; value: string; color: string }> = ({ icon, value, color }) => (
  <div className="flex items-center gap-1">
    <span className="text-sm">{icon}</span>
    <span className={`text-xs md:text-sm font-bold font-mono tabular-nums ${color}`}>{value}</span>
  </div>
);

const HealthBadge: React.FC<{ value: number }> = ({ value }) => {
  const color = value >= 4 ? '#10b981' : value >= 3 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-center gap-1">
      <span className="text-sm">❤️</span>
      <div className="w-10 md:w-12">
        <ProgressBar value={value} max={5} color={color} height="h-1.5" />
      </div>
    </div>
  );
};
