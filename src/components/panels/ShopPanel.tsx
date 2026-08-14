import React from 'react';
import { Panel } from '../ui/Panel';
import { ProgressBar } from '../ui/ProgressBar';
import { Button } from '../ui/Button';
import { useGameStore } from '../../stores/gameStore';
import { getLevelUpRequirement } from '../../game/engine/formulas';
import { RegionSystem } from '../../game/systems/RegionSystem';
import { formatGold } from '../../utils/format';
import { REGIONS } from '../../game/data/regions';
import type { RegionId } from '../../game/types';

interface Props { onClose: () => void }

export const ShopPanel: React.FC<Props> = ({ onClose }) => {
  const player = useGameStore(s => s.player);
  const unlockRegion = useGameStore(s => s.unlockRegion);
  const switchRegion = useGameStore(s => s.switchRegion);
  const upgradeShop = useGameStore(s => s.upgradeShop);

  const levelReq = getLevelUpRequirement(player.shopLevel);
  const unlockable = RegionSystem.checkUnlockable(player);

  const allRegions: RegionId[] = ['SEA', 'UK', 'US'];

  return (
    <Panel title="🏪 店铺管理" onClose={onClose}>
      {/* 店铺状态 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-800/50 rounded-lg p-4 text-center">
          <p className="text-3xl mb-1">🏪</p>
          <p className="text-sm text-slate-300">店铺等级</p>
          <p className="text-2xl font-bold text-purple-400">Lv.{player.shopLevel}</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4 text-center">
          <p className="text-3xl mb-1">⭐</p>
          <p className="text-sm text-slate-300">声誉值</p>
          <p className="text-2xl font-bold text-amber-400">{player.reputation}</p>
        </div>
      </div>

      {/* 升级条件 */}
      {player.shopLevel < 10 && (
        <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
          <h4 className="text-sm text-slate-400 mb-3">📈 升级至 Lv.{player.shopLevel + 1} 条件</h4>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>累计营收</span>
                <span>{formatGold(player.totalRevenue)} / {formatGold(levelReq.revenueRequired)}</span>
              </div>
              <ProgressBar
                value={Math.min(player.totalRevenue / levelReq.revenueRequired, 1)}
                max={1}
                color="#22c55e"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>累计完成订单</span>
                <span>{player.totalOrdersCompleted} / {levelReq.ordersRequired}</span>
              </div>
              <ProgressBar
                value={Math.min(player.totalOrdersCompleted / levelReq.ordersRequired, 1)}
                max={1}
                color="#3b82f6"
              />
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-700">
              <span className="text-xs text-slate-500">升级费用：{formatGold(levelReq.goldCost)}</span>
              <Button
                size="sm"
                disabled={
                  player.totalRevenue < levelReq.revenueRequired ||
                  player.totalOrdersCompleted < levelReq.ordersRequired ||
                  player.gold < levelReq.goldCost
                }
              onClick={() => upgradeShop()}
              >
                升级
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 区域 */}
      <div className="bg-slate-800/50 rounded-lg p-4">
        <h4 className="text-sm text-slate-400 mb-3">🌍 区域市场</h4>
        <div className="space-y-2">
          {allRegions.map(regionId => {
            const config = REGIONS[regionId];
            const unlocked = player.unlockedRegions.includes(regionId);
            const isCurrent = player.currentRegion === regionId;
            const canUnlock = unlockable.includes(regionId);

            return (
              <div
                key={regionId}
                className={`p-3 rounded-lg border transition-all ${
                  isCurrent ? 'border-purple-500 bg-purple-500/10' :
                  unlocked ? 'border-slate-600 bg-slate-800/50' :
                  'border-slate-800 bg-slate-900/50 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-200">
                      {unlocked ? '🌍' : '🔒'} {config.nameCN}
                    </p>
                    <p className="text-xs text-slate-500">
                      客单价 ${config.customerPriceRange[0]}-${config.customerPriceRange[1]} · 回款 {config.paymentCycle}天
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {canUnlock && (
                      <Button size="sm" onClick={() => unlockRegion(regionId)}>
                        🔓 解锁
                      </Button>
                    )}
                    {unlocked && !isCurrent && (
                      <Button size="sm" variant="ghost" onClick={() => switchRegion(regionId)}>
                        切换
                      </Button>
                    )}
                    {isCurrent && (
                      <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded">当前</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Panel>
  );
};
