import React, { useState } from 'react';
import { Panel } from '../ui/Panel';
import { Button } from '../ui/Button';
import { useGameStore } from '../../stores/gameStore';
import { LOAN_PRODUCTS } from '../../game/systems/LoanSystem';
import { formatGold } from '../../utils/format';
import type { LoanType } from '../../game/types';

interface Props { onClose: () => void }

const TYPE_LABEL: Record<LoanType, string> = { payday: '极速贷', bank: '银行经营贷' };

export const LoanPanel: React.FC<Props> = ({ onClose }) => {
  const player = useGameStore(s => s.player);
  const loans = useGameStore(s => s.loans);
  const gamePhase = useGameStore(s => s.gamePhase);
  const takeLoan = useGameStore(s => s.takeLoan);
  const repayLoan = useGameStore(s => s.repayLoan);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  const totalDebt = loans.reduce((s, l) => s + l.repayAmount, 0);

  const handleTake = (type: LoanType) => {
    const r = takeLoan(type);
    setStatus({ ok: r.success, msg: r.message });
  };
  const handleRepay = (id: string) => {
    const r = repayLoan(id);
    setStatus({ ok: r.success, msg: r.message });
  };

  return (
    <Panel title="💳 贷款与现金流" onClose={onClose}>
      {/* 现金流概览 */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-500">当前现金</p>
          <p className="text-lg font-bold text-amber-400">{formatGold(player.gold)}</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-500">待还负债</p>
          <p className="text-lg font-bold text-red-400">{formatGold(totalDebt)}</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-500">在贷笔数</p>
          <p className="text-lg font-bold text-slate-200">{loans.length}</p>
        </div>
      </div>

      {/* 借款产品 */}
      <h4 className="text-sm text-slate-400 mb-3">➕ 借款产品</h4>
      <div className="space-y-3 mb-4">
        {(Object.keys(LOAN_PRODUCTS) as LoanType[]).map(type => {
          const p = LOAN_PRODUCTS[type];
          const repay = Math.round(p.principal * p.repayMultiplier);
          const locked = player.shopLevel < p.minShopLevel;
          return (
            <div key={type} className="bg-slate-800/50 rounded-lg p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-200">
                  {TYPE_LABEL[type]}
                  {locked && <span className="ml-2 text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">需 Lv.{p.minShopLevel}</span>}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{p.desc}</p>
                <p className="text-xs text-amber-400 mt-1">
                  借 {formatGold(p.principal)} · {p.dueInDays} 天还 {formatGold(repay)}（×{p.repayMultiplier}）
                </p>
              </div>
              <Button
                variant={type === 'payday' ? 'danger' : 'secondary'}
                size="sm"
                disabled={locked || gamePhase !== 'playing'}
                onClick={() => handleTake(type)}
              >
                借款
              </Button>
            </div>
          );
        })}
      </div>

      {/* 我的贷款 */}
      <h4 className="text-sm text-slate-400 mb-3">📋 我的贷款</h4>
      {loans.length === 0 ? (
        <p className="text-xs text-slate-500 text-center py-4">暂无贷款，现金流健康。</p>
      ) : (
        <div className="space-y-2">
          {loans.map(loan => {
            const overdue = player.day > loan.dueDay;
            return (
              <div key={loan.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50">
                <div>
                  <p className="text-sm text-slate-200">{TYPE_LABEL[loan.type]}</p>
                  <p className={`text-[11px] mt-0.5 ${overdue ? 'text-red-400' : 'text-slate-500'}`}>
                    还 {formatGold(loan.repayAmount)} · 到期 Day {loan.dueDay}{overdue && ' ⚠️逾期罚息中'}
                  </p>
                </div>
                <Button
                  variant="success"
                  size="sm"
                  disabled={player.gold < loan.repayAmount || gamePhase !== 'playing'}
                  onClick={() => handleRepay(loan.id)}
                >
                  还款
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-slate-500 mt-4">💡 贷款可解燃眉之急，但逾期会罚息并扣健康分；极速贷利息极高，慎用。</p>

      {status && (
        <div className={`mt-3 p-3 rounded-lg text-sm ${status.ok ? 'bg-emerald-600/20 text-emerald-300' : 'bg-red-600/20 text-red-300'}`}>
          {status.msg}
        </div>
      )}
    </Panel>
  );
};
