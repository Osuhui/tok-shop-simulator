import React, { useState } from 'react';
import { Panel } from '../ui/Panel';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';
import { useGameStore } from '../../stores/gameStore';
import { CERT_DEFINITIONS, CERT_DEFINITION_MAP } from '../../game/data/certificates';
import { isShopOpen, getMissingCerts, getOpeningProgress } from '../../game/systems/OpeningSystem';
import { formatGold } from '../../utils/format';
import type { Certificate } from '../../game/types';

interface Props { onClose: () => void }

const REGION_LABEL: Record<string, string> = { UK: '英国', US: '美国', SEA: '东南亚' };

const STATUS_LABEL: Record<Certificate['status'], string> = {
  none: '未办理',
  applying: '办理中',
  active: '已持有',
  expired: '已过期',
};

export const CompliancePanel: React.FC<Props> = ({ onClose }) => {
  const certificates = useGameStore(s => s.certificates);
  const difficultyId = useGameStore(s => s.difficultyId);
  const player = useGameStore(s => s.player);
  const gamePhase = useGameStore(s => s.gamePhase);
  const applyCertificate = useGameStore(s => s.applyCertificate);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  // 开业状态纯派生（certificates / difficultyId 变化时重算）
  const open = isShopOpen(useGameStore.getState());
  const missing = getMissingCerts(useGameStore.getState());
  const progress = getOpeningProgress(useGameStore.getState());
  const needsOpening = progress.total > 0;

  const certOf = (id: string) => certificates.find(c => c.id === id);

  const handleApply = (certId: Certificate['id']) => {
    const r = applyCertificate(certId);
    setStatus({ ok: r.success, msg: r.message });
  };

  return (
    <Panel title="📜 办证与合规" onClose={onClose}>
      {/* 开业进度 */}
      <div className={`rounded-lg border p-4 mb-4 ${open || !needsOpening
        ? 'border-emerald-700 bg-emerald-500/10'
        : 'border-rose-700 bg-rose-500/10'}`}>
        {needsOpening ? (
          <>
            <div className="flex items-center justify-between mb-3">
              <h4 className={`text-sm font-bold ${open ? 'text-emerald-400' : 'text-rose-400'}`}>
                {open ? '✅ 店铺已开业' : '🔒 筹备开业中'}
              </h4>
              <span className="text-xs text-slate-500">
                {open ? '自然流量与达人合作已开放' : '办齐开业证件前无法上架 / 接单'}
              </span>
            </div>
            <ProgressBar
              label="开业证件"
              value={progress.done}
              max={progress.total}
              display={`${progress.done} / ${progress.total}`}
              color="#f59e0b"
              glow
            />
            {!open && (
              <p className="text-xs text-slate-400 mt-3">
                还差：
                {missing.map(id => CERT_DEFINITION_MAP[id].name).join('、')}
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-emerald-400">
            ✅ 当前难度无开业证件要求，店铺直接开业（其余证件按需补办）。
          </p>
        )}
      </div>

      {/* 证件目录 */}
      <h4 className="text-sm text-slate-400 mb-3">🗂️ 证件目录（L0 开店 · L1 运营合规）</h4>
      <div className="space-y-3 mb-4">
        {CERT_DEFINITIONS.map(def => {
          const cert = certOf(def.id);
          const held = cert?.status === 'active';
          const applying = cert?.status === 'applying';
          const disabled =
            held || applying || player.gold < def.cost || gamePhase !== 'playing';
          return (
            <div key={def.id} className="bg-slate-800/50 rounded-lg p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-slate-200">{def.name}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${def.layer === 'L0' ? 'bg-amber-600/20 text-amber-400' : 'bg-sky-600/20 text-sky-400'}`}>
                    {def.layer}
                  </span>
                  {def.region && (
                    <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">
                      {REGION_LABEL[def.region] ?? def.region}
                    </span>
                  )}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    held ? 'bg-emerald-600/20 text-emerald-400'
                    : applying ? 'bg-purple-600/20 text-purple-400'
                    : 'bg-slate-700 text-slate-400'
                  }`}>
                    {STATUS_LABEL[cert?.status ?? 'none']}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 truncate">{def.description}</p>
                <p className="text-xs text-amber-400/90 mt-1">
                  {def.cost > 0 ? `办理费 ${formatGold(def.cost)} · ` : '免费办理 · '}
                  周期 {def.leadTimeDays} 天
                  {applying && cert?.grantedDay !== undefined && (
                    <span className="text-purple-400"> · 预计 Day {cert.grantedDay} 下发</span>
                  )}
                </p>
              </div>
              <Button
                variant={held ? 'ghost' : 'success'}
                size="sm"
                disabled={disabled}
                onClick={() => handleApply(def.id)}
              >
                {held ? '✓ 已持有' : applying ? '⏳ 办理中' : '申请'}
              </Button>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-500">
        💡 当前难度：{difficultyId === 'hard' ? '硬核（全部 L0 证件办齐才能开业）' : difficultyId === 'normal' ? '标准（核心证件办齐才能开业）' : '轻松（先开业，证件可后补）'}。
        证件到期待审后自动生效；{needsOpening && !open
          ? '办齐后自动开业，即可到「上架」开始接单。'
          : '开业证件已齐，可到「上架」上架商品。'}
      </p>

      {status && (
        <div className={`mt-3 p-3 rounded-lg text-sm ${status.ok ? 'bg-emerald-600/20 text-emerald-300' : 'bg-red-600/20 text-red-300'}`}>
          {status.msg}
        </div>
      )}
    </Panel>
  );
};
