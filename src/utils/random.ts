// ============================================================
// 随机数工具
// ============================================================

/** 生成 [min, max] 范围的随机整数 */
export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** 生成 [min, max) 范围的随机浮点数 */
export function randFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/** 按概率返回 true */
export function chance(probability: number): boolean {
  return Math.random() < probability;
}

/** 从数组中随机选一个 */
export function pickRandom<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}

/** 洗牌 */
export function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** 生成唯一ID */
export function uid(prefix: string = ''): string {
  return `${prefix}${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
