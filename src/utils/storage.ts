// ============================================================
// 本地存储封装（localStorage 备用，主力是 idb-keyval）
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
