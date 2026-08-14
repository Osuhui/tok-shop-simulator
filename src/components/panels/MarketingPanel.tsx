import React, { useState } from 'react';
import { Panel } from '../ui/Panel';
import { Button } from '../ui/Button';
import { useGameStore } from '../../stores/gameStore';
import { DURATION, MIN_SPEND } from '../../game/systems/MarketingSystem';
import { formatGold } from '../../utils/format';
import type { CampaignType } from '../../game/types';

interface Props { onClose: () => void }

const PROMO: { type: CampaignType; label: string; icon: string; desc: string }[] = [
  { type: 'ads', label: '投流广告', icon: '📣', desc: '付费买量，活动期持续带来额外订单' },
  { type: 'social', label: '社媒推广', icon: '📱', desc: '低成本种草，隔日带来订单' },
  { type: 'seo', label: 'SEO 优化', icon: '🔍', desc: '月度订阅，长期提升自然流量' },
];

export const MarketingPanel: React.FC<Props> = ({ onClose }) => {
  const player = useGameStore(s => s.player);
  const campaigns = useGameStore(s => s.campaigns);
  const gamePhase = useGameStore(s => s.gamePhase);
  const startCampaign = useGameStore(s => s.startCampaign);
  const [spend, setSpend] = useState<Record<string, number>>({ ads: 100, social: 50, seo: 200 });
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  const handleStart = (type: CampaignType) => {
    const r = startCampaign(type, spend[type] ?? MIN_SPEND[type]);
    setStatus({ ok: r.success, msg: r.message });
  };

  return (
    <Panel title="📣 营销中心" onClose={onClose}>
      <h4 className="text-sm text-slate-400 mb-3">🚀 发起营销活动</h4>
      <div className="space-y-3 mb-4">
        {PROMO.map(({ type, label, icon, desc }) => (
          <div key={type} className="bg-slate-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-slate-200">{icon} {label}</p>
              <span className="text-[11px] text-slate-500">
                {DURATION[type] >= 999 ? '月度订阅' : `持续 ${DURATION[type]} 天`} · 最低 ${MIN_SPEND[type]}
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-2">{desc}</p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">投入 $</span>
              <input
                type="number"
                min={MIN_SPEND[type]}
                value={spend[type]}
                onChange={e => setSpend(s => ({ ...s, [type]: Math.max(0, Number(e.target.value) || 0) }))}
                className="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
              />
              <Button
                variant="primary"
                size="sm"
                disabled={gamePhase !== 'playing' || spend[type] < MIN_SPEND[type]}
                onClick={() => handleStart(type)}
              >
                启动
              </Button>
            </div>
          </div>
        ))}
      </div>

      <h4 className="text-sm text-slate-400 mb-3">📋 进行中的活动</h4>
      {campaigns.length === 0 ? (
        <p className="text-xs text-slate-500 text-center py-4">暂无进行中的营销活动。</p>
      ) : (
        <div className="space-y-2">
          {campaigns.map(c => {
            const remaining = DURATION[c.type] >= 999 ? null : Math.max(0, c.durationDays - (player.day - c.startedDay));
            return (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50">
                <div>
                  <p className="text-sm text-slate-200">
                    {c.type === 'ads' ? '📣 投流广告' : c.type === 'social' ? '📱 社媒推广' : '🔍 SEO 优化'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">投入 {formatGold(c.spend)}</p>
                </div>
                <span className="text-xs text-cyan-400">
                  {remaining === null ? '月度订阅中' : `剩 ${remaining} 天`}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-slate-500 mt-4">💡 SEO 为月度订阅，每月自动扣费并持续带来自然流量；活动期内投流/社媒会额外生成订单。</p>

      {status && (
        <div className={`mt-3 p-3 rounded-lg text-sm ${status.ok ? 'bg-emerald-600/20 text-emerald-300' : 'bg-red-600/20 text-red-300'}`}>
          {status.msg}
        </div>
      )}
    </Panel>
  );
};
