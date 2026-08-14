// ============================================================
// 区域解锁系统
// ============================================================
import type { PlayerState, RegionId } from '../types';
import { REGIONS } from '../data/regions';

export const RegionSystem = {
  /** 检查可解锁区域 */
  checkUnlockable(player: PlayerState): RegionId[] {
    const unlockable: RegionId[] = [];
    const allRegions: RegionId[] = ['SEA', 'UK', 'US'];

    for (const regionId of allRegions) {
      if (player.unlockedRegions.includes(regionId)) continue;
      const config = REGIONS[regionId];
      if (!config) continue;

      if (
        player.shopLevel >= config.unlockRequirement.shopLevel &&
        player.totalRevenue >= config.unlockRequirement.totalRevenue
      ) {
        unlockable.push(regionId);
      }
    }

    return unlockable;
  },

  /** 解锁区域 */
  unlock(player: PlayerState, regionId: RegionId): { success: boolean; message: string } {
    if (player.unlockedRegions.includes(regionId)) {
      return { success: false, message: '该区域已解锁' };
    }

    const config = REGIONS[regionId];
    if (!config) {
      return { success: false, message: '未知区域' };
    }

    if (
      player.shopLevel < config.unlockRequirement.shopLevel ||
      player.totalRevenue < config.unlockRequirement.totalRevenue
    ) {
      return {
        success: false,
        message: `解锁条件不足：需要店铺Lv.${config.unlockRequirement.shopLevel} + 累计营收$${config.unlockRequirement.totalRevenue.toLocaleString()}`,
      };
    }

    return { success: true, message: `成功解锁${config.nameCN}！` };
  },

  /** 切换区域 */
  switchRegion(player: PlayerState, regionId: RegionId): { success: boolean; message: string } {
    if (!player.unlockedRegions.includes(regionId)) {
      return { success: false, message: '该区域尚未解锁' };
    }

    return { success: true, message: `已切换到${REGIONS[regionId]?.nameCN || regionId}` };
  },
};
