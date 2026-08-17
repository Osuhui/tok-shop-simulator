import React from 'react';
import { Panel } from '../ui/Panel';
import { useGameStore } from '../../stores/gameStore';
import { ACHIEVEMENTS } from '../../game/data/achievements';
import type { AchievementCategory } from '../../game/types';

const CATEGORY_META: Record<AchievementCategory, { label: string; icon: string }> = {
  business: { label: '经营', icon: '🛠️' },
  finance: { label: '财务', icon: '💰' },
  compliance: { label: '合规', icon: '📜' },
  growth: { label: '成长', icon: '🌱' },
  social: { label: '营销', icon: '📣' },
  reputation: { label: '口碑', icon: '⭐' },
};

const CATEGORY_ORDER: AchievementCategory[] = ['business', 'finance', 'compliance', 'growth', 'social', 'reputation'];

export const AchievementPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const achievements = useGameStore((s) => s.achievements) ?? [];
  const total = ACHIEVEMENTS.length;
  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const pct = total > 0 ? Math.round((unlockedCount / total) * 100) : 0;

  return (
    <Panel title="🏆 成就" onClose={onClose}>
      <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-300">已解锁成就</p>
          <p className="text-lg font-bold text-amber-400">{unlockedCount} / {total}</p>
        </div>
        <div className="mt-2 h-2 w-full rounded-full bg-slate-700 overflow-hidden">
          <div className="h-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {CATEGORY_ORDER.map((cat) => {
        const list = ACHIEVEMENTS.filter((a) => a.category === cat);
        if (list.length === 0) return null;
        return (
          <div key={cat} className="mb-4">
            <h4 className="text-xs uppercase tracking-wide text-slate-500 mb-2">
              {CATEGORY_META[cat].icon} {CATEGORY_META[cat].label}
            </h4>
            <div className="space-y-2">
              {list.map((a) => {
                const p = achievements.find((x) => x.id === a.id);
                const unlocked = !!p?.unlocked;
                return (
                  <div
                    key={a.id}
                    className={`flex items-start gap-3 rounded-lg p-3 border ${
                      unlocked ? 'bg-amber-500/10 border-amber-700' : 'bg-slate-800/40 border-slate-700/50 opacity-60'
                    }`}
                  >
                    <span className="text-2xl">{a.icon}</span>
                    <div className="flex-1">
                      <p className={`text-sm font-bold ${unlocked ? 'text-amber-300' : 'text-slate-300'}`}>{a.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{a.description}</p>
                      {unlocked && p?.unlockedDay !== undefined && (
                        <p className="text-[10px] text-emerald-400 mt-1">✓ 已于 Day {p.unlockedDay} 解锁</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </Panel>
  );
};
