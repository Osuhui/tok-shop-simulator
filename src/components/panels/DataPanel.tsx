import React from 'react';
import { Panel } from '../ui/Panel';
import { useGameStore } from '../../stores/gameStore';
import type { MetricHistory } from '../../game/types';
import { formatGold } from '../../utils/format';

const EMPTY: MetricHistory = { netWorth: [], revenue: [], expense: [], orders: [] };

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) {
    return <div className="text-[11px] text-slate-500 py-2">数据累积中…（经营几天后显示趋势）</div>;
  }
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 100;
  const h = 30;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full" style={{ height: 32 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

interface MetricCardProps {
  label: string;
  data: number[];
  color: string;
  format: (v: number) => string;
}

function MetricCard({ label, data, color, format }: MetricCardProps) {
  const latest = data.length > 0 ? data[data.length - 1] : 0;
  const prev = data.length > 1 ? data[data.length - 2] : latest;
  const delta = latest - prev;
  const trend = delta > 0 ? 'text-emerald-400' : delta < 0 ? 'text-rose-400' : 'text-slate-400';
  const arrow = delta > 0 ? '▲' : delta < 0 ? '▼' : '—';
  return (
    <div className="bg-slate-800/50 rounded-lg p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">{label}</p>
        <p className={`text-[11px] ${trend}`}>{arrow} {format(delta)}</p>
      </div>
      <p className="text-lg font-bold text-slate-100 mt-1">{format(latest)}</p>
      <div className="mt-2">
        <Sparkline data={data} color={color} />
      </div>
    </div>
  );
}

export const DataPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const m = useGameStore((s) => s.metricsHistory) ?? EMPTY;
  const days = Math.max(m.netWorth.length, 0);

  return (
    <Panel title="📈 经营数据" onClose={onClose}>
      <p className="text-xs text-slate-400 mb-3">
        近 {days} 日经营指标趋势（数据每日自动滚动记录，纯观测不影响数值）。
      </p>
      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="净资产" data={m.netWorth} color="#fbbf24" format={formatGold} />
        <MetricCard label="当日营收" data={m.revenue} color="#34d399" format={formatGold} />
        <MetricCard label="当日支出" data={m.expense} color="#f87171" format={formatGold} />
        <MetricCard label="当日订单数" data={m.orders} color="#60a5fa" format={(v) => `${Math.round(v)}`} />
      </div>
    </Panel>
  );
};
