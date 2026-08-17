// ============================================================
// 设置项存储封装 —— 仅用于小量配置（GameSettings），存到 localStorage。
// 注意：游戏进度存档（完整 GameState）不在这里，而是由
// src/game/systems/SaveSystem.ts 通过 idb-keyval 写入 IndexedDB。
// 两者分工不同：设置用 localStorage，存档用 IndexedDB。
// ============================================================

const PREFIX = 'tokshop_';

export const storage = {
  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch (err) {
      console.error('localStorage set failed:', err);
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(PREFIX + key);
    } catch {
      // ignore
    }
  },

  /** 获取设置 */
  getSettings(): GameSettings {
    return this.get<GameSettings>('settings') || DEFAULT_SETTINGS;
  },

  setSettings(settings: GameSettings): void {
    this.set('settings', settings);
  },
};

export interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
  sfxEnabled: boolean;
  musicEnabled: boolean;
  language: 'zh' | 'en';
  defaultSpeed: '1x' | '2x';
}

const DEFAULT_SETTINGS: GameSettings = {
  musicVolume: 0.5,
  sfxVolume: 0.7,
  sfxEnabled: true,
  musicEnabled: false,
  language: 'zh',
  defaultSpeed: '1x',
};
