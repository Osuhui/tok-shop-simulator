// ============================================================
// useGameLoop — 接入GameLoop到React生命周期
// ============================================================
import { useEffect, useRef } from 'react';
import { useGameStore } from '../stores/gameStore';

export function useGameLoop() {
  const gamePhase = useGameStore(s => s.gamePhase);
  const tick = useGameStore(s => s.tick);
  const lastTimeRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (gamePhase !== 'playing') {
      lastTimeRef.current = 0;
      return;
    }

    const loop = (time: number) => {
      if (lastTimeRef.current > 0) {
        const deltaMs = time - lastTimeRef.current;
        // 限制最大delta防止tab切换后时间跳跃
        const clampedDelta = Math.min(deltaMs, 200);
        tick(clampedDelta);
      }
      lastTimeRef.current = time;
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [gamePhase, tick]);
}
