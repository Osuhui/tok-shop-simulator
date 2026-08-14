// ============================================================
// 存档系统
// ============================================================
import type { GameState, SaveData } from '../types';
import { get as idbGet, set as idbSet, del as idbDel, keys as idbKeys } from 'idb-keyval';

const SAVE_PREFIX = 'tokshop-save-slot-';
const CURRENT_VERSION = '2.0.0';

export const SaveSystem = {
  /** 保存游戏 */
  async save(slot: number, state: GameState, slotName?: string): Promise<boolean> {
    try {
      const data: SaveData = {
        version: CURRENT_VERSION,
        timestamp: Date.now(),
        slotName: slotName || `存档 ${slot}`,
        state,
      };
      await idbSet(`${SAVE_PREFIX}${slot}`, data);
      return true;
    } catch (err) {
      console.error('Save failed:', err);
      return false;
    }
  },

  /** 读取存档 */
  async load(slot: number): Promise<SaveData | null> {
    try {
      const data = await idbGet(`${SAVE_PREFIX}${slot}`);
      if (!data) return null;

      // 版本迁移
      if (data.version !== CURRENT_VERSION) {
        console.warn(`Save version ${data.version} differs from current ${CURRENT_VERSION}, attempting migration`);
        // 未来在此处理版本迁移逻辑
      }

      return data as SaveData;
    } catch (err) {
      console.error('Load failed:', err);
      return null;
    }
  },

  /** 删除存档 */
  async delete(slot: number): Promise<boolean> {
    try {
      await idbDel(`${SAVE_PREFIX}${slot}`);
      return true;
    } catch (err) {
      console.error('Delete save failed:', err);
      return false;
    }
  },

  /** 获取所有存档信息 */
  async listSaves(): Promise<{ slot: number; slotName: string; timestamp: number; day: number }[]> {
    try {
      const allKeys = await idbKeys();
      const saveKeys = allKeys.filter(k => String(k).startsWith(SAVE_PREFIX));
      const saves: { slot: number; slotName: string; timestamp: number; day: number }[] = [];

      for (const key of saveKeys) {
        const data = await idbGet(key);
        if (data) {
          const slot = parseInt(String(key).replace(SAVE_PREFIX, ''));
          saves.push({
            slot,
            slotName: data.slotName || `存档 ${slot}`,
            timestamp: data.timestamp,
            day: data.state?.player?.day || 1,
          });
        }
      }

      return saves.sort((a, b) => b.timestamp - a.timestamp);
    } catch (err) {
      console.error('List saves failed:', err);
      return [];
    }
  },

  /** 自动保存（每日结算后） */
  async autoSave(state: GameState): Promise<void> {
    await this.save(0, state, '自动存档');
  },
};
