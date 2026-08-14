import React from 'react';
import { Panel } from '../ui/Panel';
import { useGameStore } from '../../stores/gameStore';
import { formatGold, formatNumber } from '../../utils/format';

interface Props { onClose: () => void }

export const FinancePanel: React.FC<Props> = ({ onClose }) => {
  const player = useGameStore(s => s.player);
  const orders = useGameStore(s => s.orders);
  const todayRevenue = useGameStore(s => s.todayRevenue);
  const todayExpenses = useGameStore(s => s.todayExpenses);

  const totalPendingAmount = orders
    .filter(o => o.status === 'pending')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const totalDeliveredAmount = orders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const netToday = todayRevenue - todayExpenses;

  return (
    <Panel title="💰 财务报表" onClose={onClose}>
      {/* 概览 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-500 mb-1">现金余额</p>
          <p className="text-xl font-bold text-amber-400">{formatGold(player.gold)}</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-500 mb-1">今日营收</p>
          <p className="text-xl font-bold text-emerald-400">{formatGold(todayRevenue)}</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
          <p className="text-xs text-slate-500 mb-1">今日支出</p>
          <p className="text-xl font-bold text-red-400">{formatGold(todayExpenses)}</p>
        </div>
        <div className={`bg-slate-800/50 rounded-lg p-3 text-center`}>
          <p className="text-xs text-slate-500 mb-1">今日净利</p>
          <p className={`text-xl font-bold ${netToday >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {netToday >= 0 ? '+' : ''}{formatGold(netToday)}
          </p>
        </div>
      </div>

      {/* 详细 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-800/50 rounded-lg p-4">
          <h4 className="text-sm text-slate-400 mb-2">📈 累计数据</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">累计营收</span>
              <span className="text-slate-300">{formatGold(player.totalRevenue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">累计订单</span>
              <span className="text-slate-300">{formatNumber(player.totalOrdersCompleted)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">累计罚款</span>
              <span className="text-red-400">{formatGold(player.totalFines)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">店铺等级</span>
              <span className="text-purple-400">Lv.{player.shopLevel}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-lg p-4">
          <h4 className="text-sm text-slate-400 mb-2">📋 应收应付</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">待发货订单金额</span>
              <span className="text-amber-400">{formatGold(totalPendingAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">已发货待回款</span>
              <span className="text-cyan-400">{formatGold(totalDeliveredAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">每日运营成本</span>
              <span className="text-slate-400">{formatGold(10 + 2 * player.shopLevel)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 现金流警告 */}
      {player.gold < 500 && (
        <div className="bg-red-500/10 border border-red-600 rounded-lg p-3 text-sm">
          <p className="text-red-400 font-bold">⚠️ 现金流警告</p>
          <p className="text-red-300/70 text-xs mt-1">
            当前现金低于 $500。如果资金归零，你将面临破产风险。请尽快发货回款或考虑借款！
          </p>
        </div>
      )}
    </Panel>
  );
};
