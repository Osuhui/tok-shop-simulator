// ============================================================
// 游戏主循环引擎
// ============================================================
import type { GameSpeed } from '../types';
import { SPEED_DAY_DURATION_MS } from '../types';

export class GameLoop {
  private elapsed: number = 0;
  private dayDurationMs: number;
  private _isPaused: boolean;

  constructor(speed: GameSpeed = '1x') {
    this._isPaused = speed === 'pause';
    this.dayDurationMs = speed === 'pause' ? Infinity : SPEED_DAY_DURATION_MS[speed];
  }

  get isPaused(): boolean {
    return this._isPaused;
  }

  get currentSpeed(): GameSpeed {
    if (this._isPaused) return 'pause';
    const entries = Object.entries(SPEED_DAY_DURATION_MS) as [GameSpeed, number][];
    for (const [speed, duration] of entries) {
      if (this.dayDurationMs === duration) return speed;
    }
    return '1x';
  }

  /** 每帧调用，deltaMs = 距上一帧的毫秒数。返回本帧触发了几次"新的一天"。 */
  tick(deltaMs: number): number {
    if (this._isPaused || this.dayDurationMs === Infinity) return 0;

    this.elapsed += deltaMs;
    let newDays = 0;

    while (this.elapsed >= this.dayDurationMs) {
      this.elapsed -= this.dayDurationMs;
      newDays++;
    }

    return newDays;
  }

  setSpeed(speed: GameSpeed): void {
    if (speed === 'pause') {
      this._isPaused = true;
    } else {
      this._isPaused = false;
      this.dayDurationMs = SPEED_DAY_DURATION_MS[speed];
    }
    this.elapsed = 0;
  }

  /** 获取当天已流逝的比例 (0-1)，用于UI进度条 */
  getDayProgress(): number {
    if (this._isPaused || this.dayDurationMs === Infinity) return 0;
    return Math.min(this.elapsed / this.dayDurationMs, 1);
  }

  /** 每游戏日对应的真实秒数 */
  getDayDurationSeconds(): number {
    if (this.dayDurationMs === Infinity) return Infinity;
    return this.dayDurationMs / 1000;
  }
}
