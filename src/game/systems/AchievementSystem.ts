// ============================================================
// 成就系统：纯观测的进度追踪
// - createInitialAchievements：初始全部未解锁
// - evaluateAchievements：把满足条件的"未解锁"项翻为已解锁（不改动任何经济字段）
// - achievementProcessor：可注册为 DayProcessor，每日评估（对 sim 经济零影响）
// ============================================================
import type { AchievementProgress, GameState } from '../types';
import type { DayContext, DayProcessor } from '../engine/DayProcessor';
import { ACHIEVEMENTS, ACHIEVEMENT_MAP } from '../data/achievements';

export function createInitialAchievements(): AchievementProgress[] {
  return ACHIEVEMENTS.map((a) => ({ id: a.id, unlocked: false }));
}

/** 纯函数：评估所有成就。仅翻转"已满足条件"的未解锁项，绝不改写经济状态。 */
export function evaluateAchievements(state: GameState): GameState {
  const current = state.achievements ?? [];
  if (current.length === 0) return state;

  const updated = current.map((p) => {
    if (p.unlocked) return p;
    const def = ACHIEVEMENT_MAP[p.id];
    if (def && def.condition(state)) {
      return { ...p, unlocked: true, unlockedDay: state.player.day };
    }
    return p;
  });

  const changed = updated.some(
    (u, i) => u.unlocked !== current[i].unlocked || u.unlockedDay !== current[i].unlockedDay,
  );
  if (!changed) return state;

  return { ...state, achievements: updated };
}

/** 每日处理器：评估成就解锁（纯观测，对 sim 经济零影响） */
export const achievementProcessor: DayProcessor = (ctx: DayContext) => {
  const next = evaluateAchievements(ctx.state);
  if (next === ctx.state) return ctx;
  return { ...ctx, state: next };
};
