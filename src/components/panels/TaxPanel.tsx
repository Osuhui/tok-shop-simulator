import React, { useState } from 'react';
import { Panel } from '../ui/Panel';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';
import { useGameStore } from '../../stores/gameStore';
import { getTaxRule } from '../../game/data/taxRules';
import { auditProbabilityMultiplier } from '../../game/systems/TaxSystem';
import { formatGold, formatPercent } from '../../utils/format';

interface Props { onClose: () => void }

const TAX_TYPE_LABEL: Record<string, string> = {
  VAT: '增值税 (VAT)',
  SALES_TAX: '销售税 (Sales Tax)',
  GST: '消费税 (GST)',
};

export const TaxPanel: React.FC<Props> = ({ onClose }) => {
  const player = useGameStore(s => s.player);
  const tax = useGameStore(s => s.tax);
  const gamePhase = useGameStore(s => s.gamePhase);
  const fileTax = useGameStore(s => s.fileTax);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  const rule = getTaxRule(player.currentRegion);
  const exempt = rule.rate <= 0;
  const nextFilingDay = tax.lastFilingDay > 0 ? tax.lastFilingDay + rule.filingCycleDays : rule.filingCycleDays;
  const riskPct = Math.min(tax.auditRisk, 1);
  const highRisk = riskPct >= 0.5;
  const mult = auditProbabilityMultiplier({ ...useGameStore.getState(), player, tax } as any);

  const handleFile = () => {
    const r = fileTax();
    setStatus({ ok: r.success, msg: r.message });
  };

  return (
    <Panel title="🧾 税务中心" onClose={onClose}>
      {/* 当前区域税制 */}
      <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
        <h4 className="text-sm text-slate-400 mb-3">📍 当前区域税制（{player.currentRegion}）</h4>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-slate-500">税种</p>
            <p className="text-sm font-bold text-slate-200 mt-1">{TAX_TYPE_LABEL[rule.type] ?? rule.type}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">税率</p>
            <p className="text-sm font-bold text-amber-400 mt-1">{formatPercent(rule.rate)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">申报周期</p>
            <p className="text-sm font-bold text-slate-200 mt-1">每 {rule.filingCycleDays} 天</p>
          </div>
        </div>
        {exempt && (
          <p className="text-xs text-emerald-400 mt-3">✅ 当前区域为跨境小包豁免，无需计提流转税。</p>
        )}
      </div>

      {/* 本期税务状态 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-800/50 rounded-lg p-4 text-center">
          <p className="text-2xl mb-1">💸</p>
          <p className="text-xs text-slate-300">本期应缴税款</p>
          <p className={`text-2xl font-bold ${tax.taxOwed > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            {formatGold(tax.taxOwed)}
          </p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-4 text-center">
          <p className="text-2xl mb-1">📅</p>
          <p className="text-xs text-slate-300">下次申报日</p>
          <p className="text-2xl font-bold text-purple-400">Day {nextFilingDay}</p>
        </div>
      </div>

      {/* VAT 登记状态 */}
      <div className="bg-slate-800/50 rounded-lg p-4 mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-300">VAT 增值税登记</p>
          <p className="text-xs text-slate-500 mt-0.5">登记后稽查概率恢复正常，可合规抵扣</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded ${tax.vatRegistered ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
          {tax.vatRegistered ? '已登记' : '未登记'}
        </span>
      </div>

      {/* 稽查风险 */}
      <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>稽查风险</span>
          <span className={highRisk ? 'text-red-400' : 'text-slate-400'}>
            {formatPercent(riskPct)} {highRisk && '⚠️ 高危，恐触发稽查'}
          </span>
        </div>
        <ProgressBar value={riskPct} max={1} color={highRisk ? '#ef4444' : '#f59e0b'} />
        {player.currentRegion === 'UK' && !tax.vatRegistered && (
          <p className="text-xs text-amber-400 mt-2">
            ⚠️ UK 未持 VAT 证件，稽查概率 ×{mult}（建议办理 VAT 证后申报）
          </p>
        )}
      </div>

      {/* 申报操作 */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          按时申报可清零稽查风险；长期拖延将累积风险直至稽查上门。
        </p>
        <Button
          variant={tax.taxOwed > 0 ? 'danger' : 'secondary'}
          disabled={tax.taxOwed <= 0 || gamePhase !== 'playing'}
          onClick={handleFile}
        >
          {tax.taxOwed > 0 ? `申报缴税 ${formatGold(tax.taxOwed)}` : '暂无需缴税'}
        </Button>
      </div>

      {status && (
        <div className={`mt-3 p-3 rounded-lg text-sm ${status.ok ? 'bg-emerald-600/20 text-emerald-300' : 'bg-red-600/20 text-red-300'}`}>
          {status.msg}
        </div>
      )}
    </Panel>
  );
};
