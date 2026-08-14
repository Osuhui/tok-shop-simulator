import React from 'react';

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  height?: string;
  showLabel?: boolean;
  label?: string;
  display?: string;
  glow?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  color = '#a855f7',
  height = 'h-2',
  showLabel = false,
  label,
  display,
  glow = false,
}) => {
  const pct = max === 1 ? value * 100 : (value / max) * 100;
  const displayPct = Math.min(100, Math.max(0, pct));

  return (
    <div className="w-full">
      {(showLabel || label || display) && (
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>{label || ''}</span>
          <span className="font-mono tabular-nums">{display ?? `${displayPct.toFixed(0)}%`}</span>
        </div>
      )}
      <div className={`w-full bg-slate-800/50 rounded-full ${height} overflow-hidden`}>
        <div
          className={`${height} rounded-full transition-all duration-500 ease-out ${glow ? 'shadow-glow-purple' : ''}`}
          style={{
            width: `${displayPct}%`,
            background: `linear-gradient(90deg, ${color}, ${lighten(color, 30)})`,
          }}
        />
      </div>
    </div>
  );
};

function lighten(hex: string, amt: number): string {
  const cleaned = hex.replace('#', '');
  // 支持 3 位短 hex（如 #fff → #ffffff）
  const full = cleaned.length === 3 ? cleaned.split('').map(c => c + c).join('') : cleaned;
  const n = parseInt(full, 16);
  if (isNaN(n)) return hex; // 非 hex 输入直接返回原色
  const r = Math.min(255, ((n >> 16) & 0xff) + amt);
  const g = Math.min(255, ((n >> 8) & 0xff) + amt);
  const b = Math.min(255, (n & 0xff) + amt);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
