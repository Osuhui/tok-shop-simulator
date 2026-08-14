import React, { useEffect, useState } from 'react';
import { fxBus } from '../../game/fxBus';
import type { FxItem } from '../../game/fxBus';

const KIND_STYLE: Record<string, string> = {
  gold: 'text-emerald-400',
  bad: 'text-red-400',
  levelup: 'text-purple-400',
  victory: 'text-amber-300',
  ship: 'text-cyan-300',
  order: 'text-sky-300',
  bankrupt: 'text-rose-500',
};

interface ConfettiParticle {
  id: number;
  x: number;
  tx: number;
  ty: number;
  rot: number;
  color: string;
  delay: number;
}

let _confettiId = 0;

export const FxLayer: React.FC = () => {
  const [items, setItems] = useState<FxItem[]>([]);
  const [flash, setFlash] = useState<null | 'levelup' | 'victory' | 'bankrupt'>(null);
  const [confetti, setConfetti] = useState<ConfettiParticle[]>([]);

  useEffect(() => {
    const unsub = fxBus.subscribe((fx) => {
      if (fx.kind === 'levelup') {
        setFlash('levelup');
        setTimeout(() => setFlash(null), 600);
      } else if (fx.kind === 'victory') {
        setFlash('victory');
        // 撒彩色纸屑
        const particles: ConfettiParticle[] = Array.from({ length: 50 }, () => ({
          id: _confettiId++,
          x: 30 + Math.random() * 40,
          tx: (Math.random() - 0.5) * 200,
          ty: -80 - Math.random() * 200,
          rot: (Math.random() - 0.5) * 720,
          color: ['#a855f7', '#f97316', '#10b981', '#06b6d4', '#f59e0b', '#f43f5e'][Math.floor(Math.random() * 6)],
          delay: Math.random() * 0.5,
        }));
        setConfetti(particles);
        setTimeout(() => setConfetti([]), 3000);
      } else if (fx.kind === 'bad' && fx.text.includes('💸')) {
        setFlash('bankrupt');
        setTimeout(() => setFlash(null), 2400);
      }
      setItems((prev) => [...prev, fx]);
      setTimeout(() => {
        setItems((prev) => prev.filter((i) => i.id !== fx.id));
      }, 1400);
    });
    return unsub;
  }, []);

  return (
    <>
      {/* 全屏闪光 */}
      {flash && (
        <div
          className={`pointer-events-none fixed inset-0 z-50 fx-flash ${
            flash === 'victory' ? 'bg-amber-400/10' : flash === 'bankrupt' ? 'bg-rose-500/15 fx-bankrupt' : 'bg-purple-500/20'
          }`}
        />
      )}

      {/* 胜利纸屑 */}
      {confetti.map(c => (
        <div
          key={c.id}
          className="pointer-events-none fixed z-50 w-3 h-3 rounded-sm"
          style={{
            left: `${c.x}%`, top: '40%',
            background: c.color,
            animation: `fx-confetti 2s ease-out ${c.delay}s forwards`,
            '--tx': `${c.tx}px`,
            '--ty': `${c.ty}px`,
            '--rot': `${c.rot}deg`,
          } as React.CSSProperties}
        />
      ))}

      {/* 浮动文字 */}
      <div className="pointer-events-none fixed top-16 left-0 right-0 z-50 flex flex-col items-center gap-1">
        {items.map((fx) => (
          <div
            key={fx.id}
            className={`fx-float text-xl font-extrabold drop-shadow-lg ${KIND_STYLE[fx.kind] ?? 'text-slate-200'}`}
            style={fx.kind === 'victory' ? { fontSize: '2rem' } : undefined}
          >
            {fx.text}
          </div>
        ))}
      </div>
    </>
  );
};
