import React from 'react';
import { Panel } from '../ui/Panel';
import { ProgressBar } from '../ui/ProgressBar';
import { useGameStore } from '../../stores/gameStore';
import { formatGold, formatDay, formatNumber } from '../../utils/format';
import { REGIONS } from '../../game/data/regions';
import { getProduct } from '../../game/data/products';
import { estimateDaysToNetWorth } from '../../game/engine/projection';
import { getLevelUpRequirement } from '../../game/engine/formulas';

interface Props { onClose: () => void }

const OnboardStep: React.FC<{ done: boolean; title: string; hint: string; panel?: string; onNavigate?: (panel: string) => void }> = ({ done, title, hint, panel, onNavigate }) => (
  <div
    className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
      done ? 'bg-emerald-500/5' : 'bg-slate-800/40 border-l-2 border-purple-500 cursor-pointer hover:bg-slate-800/70'
    }`}
    onClick={() => !done && panel && onNavigate?.(panel)}
  >
    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 ${
      done ? 'bg-emerald-500 text-white shadow-glow-emerald' : 'bg-slate-700 text-slate-400'
    }`}>
      {done ? '✓' : ''}
    </span>
    <div className="flex-1 min-w-0">
      <p className={`text-sm truncate ${done ? 'text-emerald-300/60 line-through' : 'text-slate-200'}`}>{title}</p>
      {!done && <p className="text-[11px] text-slate-500">{hint}</p>}
    </div>
    {!done && panel && <span className="text-[11px] text-purple-400 shrink-0 font-medium">去完成 →</span>}
  </div>
);

export const DashboardPanel: React.FC<Props> = ({ onClose }) => {
  const player = useGameStore(s => s.player);
  const orders = useGameStore(s => s.orders);
  const inventory = useGameStore(s => s.inventory);
  const goal = useGameStore(s => s.goal);
  const todayRevenue = useGameStore(s => s.todayRevenue);
  const todayExpenses = useGameStore(s => s.todayExpenses);
  const todayOrdersCount = useGameStore(s => s.todayOrdersCount);
  const netWorthHistory = useGameStore(s => s.netWorthHistory);
  const setActivePanel = useGameStore(s => s.setActivePanel);

  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const shippedOrders = orders.filter(o => o.status === 'shipped' || o.status === 'inTransit').length;
  const region = REGIONS[player.currentRegion];

  const invValue = inventory.reduce((sum, it) => sum + (getProduct(it.productId)?.cost ?? 0) * it.quantity, 0);
  const debt = useGameStore.getState().loans.reduce((sum, l) => sum + l.repayAmount, 0);
  const netWorth = Math.round((player.gold + invValue - debt) * 100) / 100;

  const dailyProfit = todayRevenue - todayExpenses;
  const profitTrend = dailyProfit > 0 ? '↑' : dailyProfit < 0 ? '↓' : '→';

  // Onboarding
  const hasStock = inventory.some(i => i.quantity > 0);
  const hasOrder = orders.length > 0;
  const hasShipped = orders.some(o => o.status !== 'pending');
  const hasUpgraded = player.shopLevel >= 2;
  const steps = [
    { key: 'stock', title: '采购初始库存', hint: '去「选品」买点货，仓库才有得卖', done: hasStock, panel: 'sourcing' },
    { key: 'order', title: '获得第一笔订单', hint: '等自然流量，或去「达人」谈合作引流', done: hasOrder, panel: 'talentHub' },
    { key: 'ship', title: '完成首单发货', hint: '去「物流」把待处理订单发出去', done: hasShipped, panel: 'logistics' },
    { key: 'upgrade', title: '升级店铺至 Lv.2', hint: '满足营收/订单/金币条件后升级', done: hasUpgraded, panel: 'shop' },
  ];

  return (
    <Panel title="📊 每日看板" onClose={onClose}>
      {/* KPI 卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KpiCard label="当前资金" value={formatGold(player.gold)} color="amber" />
        <KpiCard label="今日利润" value={`${profitTrend} ${formatGold(Math.abs(dailyProfit))}`} color={dailyProfit >= 0 ? 'emerald' : 'rose'} />
        <KpiCard label="今日支出" value={formatGold(todayExpenses)} color="slate" />
        <KpiCard label="游戏天数" value={formatDay(player.day)} color="purple" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KpiCard label="待处理订单" value={String(pendingOrders)} color={pendingOrders > 0 ? 'amber' : 'slate'} />
        <KpiCard label="运输中" value={String(shippedOrders)} color="cyan" />
        <KpiCard label="今日新单" value={String(todayOrdersCount)} color="sky" />
        <KpiCard label="累计完成" value={formatNumber(player.totalOrdersCompleted)} color="emerald" />
      </div>

      {/* 经营目标 */}
      {goal && (
        <div className="glass-panel mb-4 bg-gradient-to-r from-emerald-500/3 to-purple-500/3">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-emerald-400">🏁 经营目标</h4>
            <span className="text-xs text-slate-500 font-mono">Day {player.day} / {goal.day}</span>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <ProgressBar label="店铺等级" value={player.shopLevel} max={goal.shopLevel} display={`Lv.${player.shopLevel} / ${goal.shopLevel}`} color="#a855f7" glow />
              <div className="mt-2" />
              <ProgressBar label="净资产" value={netWorth} max={goal.netWorth} display={`${formatGold(netWorth)} / ${formatGold(goal.netWorth)}`} color="#10b981" glow />
            </div>
            {/* 环形速览 */}
            <div className="flex items-center justify-center gap-4">
              <RingProgress pct={goal.shopLevel > 0 ? player.shopLevel / goal.shopLevel : 0} color="#a855f7" label="等级" />
              <RingProgress pct={goal.netWorth > 0 ? netWorth / goal.netWorth : 0} color="#10b981" label="资产" />
            </div>
          </div>
          {/* 推演 */}
          {netWorthHistory && (() => {
            const eta = estimateDaysToNetWorth(netWorthHistory, goal.netWorth);
            const levelRatio = goal.shopLevel > 0 ? player.shopLevel / goal.shopLevel : 0;
            const worthRatio = goal.netWorth > 0 ? netWorth / goal.netWorth : 0;
            const bottleneck = worthRatio < levelRatio ? '净资产' : '店铺等级';
            const req = getLevelUpRequirement(player.shopLevel);
            const needsRevenue = Math.max(0, req.revenueRequired - player.totalRevenue);
            const needsOrders = Math.max(0, req.ordersRequired - player.totalOrdersCompleted);
            return (
              <div className="mt-3 pt-3 border-t border-slate-700/30 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-slate-400">
                  <span>{eta !== null ? `📈 预计 Day ${player.day + eta} 达标` : '📉 增速不足 — 需更多订单'}</span>
                  <span className="text-amber-400">瓶颈：{bottleneck}</span>
                </div>
                <p className="text-slate-500">
                  下次升级差：营收 {formatGold(needsRevenue)} · 订单 {needsOrders} 单 · 金币 {formatGold(req.goldCost)}
                </p>
              </div>
            );
          })()}
        </div>
      )}

      {/* 新手引导 */}
      {steps.some(s => !s.done) && (
        <div className="glass-panel mb-4 border-purple-500/20">
          <h4 className="text-sm font-bold text-purple-300 mb-3">👋 新手第一步</h4>
          <div className="space-y-1.5">
            {steps.map(s => (
              <OnboardStep key={s.key} done={s.done} title={s.title} hint={s.hint} panel={s.panel}
                onNavigate={(p) => { setActivePanel(p); }} />
            ))}
          </div>
        </div>
      )}

      {/* 区域信息 */}
      <div className="glass-panel">
        <h4 className="text-sm font-bold text-slate-400 mb-3">📌 {region.nameCN} · 市场概况</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <InfoRow label="合规难度" value={'⭐'.repeat(region.complianceDifficulty)} />
          <InfoRow label="客单价" value={`$${region.customerPriceRange[0]} – $${region.customerPriceRange[1]}`} />
          <InfoRow label="回款周期" value={`${region.paymentCycle} 天`} />
          <InfoRow label="物流时效" value={`${region.logisticsSpeed} 天`} />
        </div>
      </div>
    </Panel>
  );
};

// ---- 子组件 ----

const KpiCard: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => {
  const colorMap: Record<string, string> = {
    amber: 'text-amber-400', emerald: 'text-emerald-400', rose: 'text-rose-400',
    purple: 'text-purple-400', cyan: 'text-cyan-400', sky: 'text-sky-400', slate: 'text-slate-400',
  };
  return (
    <div className="glass p-3 text-center">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-lg font-bold font-mono tabular-nums ${colorMap[color] ?? 'text-slate-200'}`}>{value}</p>
    </div>
  );
};

const RingProgress: React.FC<{ pct: number; color: string; label: string }> = ({ pct, color, label }) => {
  const r = 28; const circ = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, pct));
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="#1e293b" strokeWidth="6" />
        <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - clamped)}
          strokeLinecap="round" transform="rotate(-90 36 36)"
          style={{ transition: 'stroke-dashoffset 0.8s ease-out', filter: `drop-shadow(0 0 4px ${color}40)` }}
        />
        <text x="36" y="40" textAnchor="middle" fill="#f1f5f9" fontSize="14" fontWeight="bold" fontFamily="JetBrains Mono, monospace">
          {Math.round(clamped * 100)}%
        </text>
      </svg>
      <span className="text-[10px] text-slate-500">{label}</span>
    </div>
  );
};

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div><span className="text-slate-500 text-xs">{label}</span><p className="text-slate-300 text-sm">{value}</p></div>
);
