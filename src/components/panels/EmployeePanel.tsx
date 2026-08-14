import React, { useState } from 'react';
import { Panel } from '../ui/Panel';
import { Button } from '../ui/Button';
import { useGameStore } from '../../stores/gameStore';
import { EMPLOYEE_DEFS } from '../../game/systems/EmployeeSystem';
import { formatGold } from '../../utils/format';
import type { EmployeeRole } from '../../game/types';

interface Props { onClose: () => void }

const ROLE_ORDER: EmployeeRole[] = ['cs', 'ops', 'packer'];
const ROLE_ICON: Record<EmployeeRole, string> = { cs: '🎧', ops: '📈', packer: '📦' };

export const EmployeePanel: React.FC<Props> = ({ onClose }) => {
  const player = useGameStore(s => s.player);
  const employees = useGameStore(s => s.employees);
  const gamePhase = useGameStore(s => s.gamePhase);
  const hireEmployee = useGameStore(s => s.hireEmployee);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  const handleHire = (role: EmployeeRole) => {
    const r = hireEmployee(role);
    setStatus({ ok: r.success, msg: r.message });
  };

  const countByRole = (role: EmployeeRole) => employees.filter(e => e.role === role).length;

  return (
    <Panel title="🧑‍💼 员工管理" onClose={onClose}>
      {/* 当前团队 */}
      <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm text-slate-400">👥 当前团队（{employees.length} 人）</h4>
          <span className="text-xs text-slate-500">月度发薪日：每 30 天</span>
        </div>
        {employees.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">尚未招募任何员工，生意全靠你一个人扛。</p>
        ) : (
          <div className="space-y-2">
            {employees.map(emp => (
              <div key={emp.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{ROLE_ICON[emp.role]}</span>
                  <div>
                    <p className="text-sm text-slate-200">{emp.name}</p>
                    <p className="text-[10px] text-slate-500">入职 Day {emp.hiredDay}</p>
                  </div>
                </div>
                <span className="text-xs text-amber-400">月薪 {formatGold(emp.salary)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 招募 */}
      <h4 className="text-sm text-slate-400 mb-3">➕ 招募新员工（支付首月薪资）</h4>
      <div className="space-y-3">
        {ROLE_ORDER.map(role => {
          const def = EMPLOYEE_DEFS[role];
          const affordable = player.gold >= def.salary && gamePhase === 'playing';
          return (
            <div key={role} className="bg-slate-800/50 rounded-lg p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{ROLE_ICON[role]}</span>
                <div>
                  <p className="text-sm font-medium text-slate-200">
                    {def.name}
                    {countByRole(role) > 0 && (
                      <span className="ml-2 text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">
                        在职 {countByRole(role)}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{def.desc}</p>
                  <p className="text-xs text-amber-400 mt-1">首月薪资 {formatGold(def.salary)}</p>
                </div>
              </div>
              <Button
                variant="success"
                size="sm"
                disabled={!affordable}
                onClick={() => handleHire(role)}
              >
                招募
              </Button>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-500 mt-4 leading-relaxed">
        💡 客服降低退货率、运营提升自然流量；打包员会在每日自动处理待发货订单。
        发薪日若资金不足以支付某员工薪资，该员工将离职。
      </p>

      {status && (
        <div className={`mt-3 p-3 rounded-lg text-sm ${status.ok ? 'bg-emerald-600/20 text-emerald-300' : 'bg-red-600/20 text-red-300'}`}>
          {status.msg}
        </div>
      )}
    </Panel>
  );
};
