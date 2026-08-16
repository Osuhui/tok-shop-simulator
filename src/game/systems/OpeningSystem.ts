// ============================================================
// 开业系统：难度"开业封锁"的纯派生逻辑
// 设计依据 Content_Design 7.3 伪代码：
//   required = diff.blockOpening ? ALL_L0 : diff.requiredBeforeOpening
// 开业状态从 certificates + difficultyId 派生，不新增 GameState 字段（存档兼容）。
// ============================================================
import type { CertId, DifficultyId, GameState } from '../types';
import { ALL_L0, DIFFICULTIES } from '../data/difficulties';

/** 开业所需证件。difficultyId 缺失（旧存档 / 测试夹具）视为无要求——默认已开业 */
export function getRequiredCertIds(difficultyId?: DifficultyId): CertId[] {
  if (!difficultyId) return [];
  const diff = DIFFICULTIES[difficultyId];
  if (!diff) return [];
  return diff.blockOpening ? [...ALL_L0] : [...diff.requiredBeforeOpening];
}

/** 店铺是否已开业：所需证件全部 active */
export function isShopOpen(state: GameState): boolean {
  const required = getRequiredCertIds(state.difficultyId);
  return required.every((id) => state.certificates.some((c) => c.id === id && c.status === 'active'));
}

/** 尚未办齐的开业证件（供 UI 列出） */
export function getMissingCerts(state: GameState): CertId[] {
  const required = getRequiredCertIds(state.difficultyId);
  return required.filter((id) => !state.certificates.some((c) => c.id === id && c.status === 'active'));
}

/** 开业进度 X/Y（供进度条） */
export function getOpeningProgress(state: GameState): { done: number; total: number } {
  const required = getRequiredCertIds(state.difficultyId);
  const done = required.filter((id) =>
    state.certificates.some((c) => c.id === id && c.status === 'active'),
  ).length;
  return { done, total: required.length };
}

/** 贷款逾期宽限天数（difficultyId 缺失按 easy 最宽松兜底） */
export function gracePeriodDays(state: GameState): number {
  return DIFFICULTIES[state.difficultyId ?? 'easy'].gracePeriodDays;
}

/** 逾期罚息倍率（difficultyId 缺失按 easy 最宽松兜底） */
export function penaltyMultiplier(state: GameState): number {
  return DIFFICULTIES[state.difficultyId ?? 'easy'].penaltyMultiplier;
}
