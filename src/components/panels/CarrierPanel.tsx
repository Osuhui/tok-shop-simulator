import React, { useState } from 'react';
import { Panel } from '../ui/Panel';
import { Button } from '../ui/Button';
import { useGameStore } from '../../stores/gameStore';
import { CARRIERS } from '../../game/data/carriers';
import { shippingMultiplier } from '../../game/systems/CarriersSystem';
import type { CarrierId } from '../../game/types';

interface Props { onClose: () => void }

const CIDS: CarrierId[] = ['rabbit', 'eagle', 'whale'];

export const CarrierPanel: React.FC<Props> = ({ onClose }) => {
  const player = useGameStore(s => s.player);
  const carrierId = useGameStore(s => s.carrierId);
  const gamePhase = useGameStore(s => s.gamePhase);
  const selectCarrier = useGameStore(s => s.selectCarrier);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  const baseMult = shippingMultiplier({ ...useGameStore.getState(), carrierId } as any, 5);
  const peak = (day: number) => shippingMultiplier({ ...useGameStore.getState(), carrierId } as any, day) > baseMult;

  const handleSelect = (id: CarrierId) => {
    const before = carrierId;
    selectCarrier(id);
    const after = useGameStore.getState().carrierId;
    if (after === before) {
      setStatus({ ok: false, msg: `${CARRIERS[id].name} 不支持当前区域` });
    } else {
      setStatus({ ok: true, msg: `已切换至 ${CARRIERS[id].name}` });
    }
  };

  return (
    <Panel title="🚚 物流承运商" onClose={onClose}>
      <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">当前旺季状态</p>
          <span className={`text-xs px-2 py-1 rounded ${peak(player.day) ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
            {peak(player.day) ? '🔥 旺季爆仓（运费 ×1.5）' : '平季'}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-2">当前运费倍率：<span className="text-amber-400 font-bold">×{baseMult.toFixed(2)}</span>（旺季将在每 90 天的后 10 天触发）</p>
      </div>

      <div className="space-y-3">
        {CIDS.map(id => {
          const c = CARRIERS[id];
          const active = carrierId === id;
          const supported = c.regions.includes(player.currentRegion);
          return (
            <div
              key={id}
              className={`rounded-lg p-4 border transition-all ${
                active ? 'border-purple-500 bg-purple-500/10' : 'border-slate-800 bg-slate-900/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-200">{c.name}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    运费 ×{c.costMultiplier} · 时效 {c.speedDays} 天 · 可靠 {(c.reliability * 100).toFixed(0)}%
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5">覆盖：{c.regions.join(' / ')}</p>
                </div>
                {active ? (
                  <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded">当前</span>
                ) : (
                  <Button
                    size="sm"
                    variant={supported ? 'secondary' : 'ghost'}
                    disabled={!supported || gamePhase !== 'playing'}
                    onClick={() => handleSelect(id)}
                  >
                    {supported ? '切换' : '不支持'}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-500 mt-4">💡 飞鹰快但贵、鲸鱼便宜但要海运、兔子均衡；旺季全平台运费上浮，提前备货更划算。</p>

      {status && (
        <div className={`mt-3 p-3 rounded-lg text-sm ${status.ok ? 'bg-emerald-600/20 text-emerald-300' : 'bg-red-600/20 text-red-300'}`}>
          {status.msg}
        </div>
      )}
    </Panel>
  );
};
