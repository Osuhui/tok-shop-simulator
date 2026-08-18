import { describe, it, expect } from 'vitest';
import { useGameStore } from './gameStore';
import type { CertId } from '../game/types';

const HARD_L0: CertId[] = ['SELLER_VERIFY', 'BUSINESS_LICENSE', 'RECEIVING_ACCOUNT', 'CUSTOMS_REG'];

describe('store.applyCertificate 与开业封锁', () => {
  it('hard 开局未开业：初始库存不上架、上架被拒、达人合作被拒', () => {
    useGameStore.getState().initNewGame({ identityId: 'student', difficultyId: 'hard', region: 'UK' });
    const st = useGameStore.getState();
    expect(st.inventory.length).toBeGreaterThan(0);
    expect(st.inventory.every((i) => i.isListed === false)).toBe(true); // 初始库存待开业后再上架
    expect(st.checkAndListProduct('prod_stanup_cup', '斯坦杯 便携').passed).toBe(false);
    const influencerId = st.influencers[0].id;
    expect(st.initiateAffiliate(influencerId, 'prod_stanup_cup', 0.2).success).toBe(false);
  });

  it('applyCertificate 扣办理费', () => {
    useGameStore.getState().initNewGame({ identityId: 'student', difficultyId: 'hard', region: 'UK' });
    const before = useGameStore.getState().player.gold;
    const r = useGameStore.getState().applyCertificate('BUSINESS_LICENSE');
    expect(r.success).toBe(true);
    expect(useGameStore.getState().player.gold).toBe(before - 200);
  });

  it('办齐四证后自动开业：上架通过、达人合作可用；重复申请被拒', () => {
    useGameStore.getState().initNewGame({ identityId: 'student', difficultyId: 'hard', region: 'UK' });
    for (const id of HARD_L0) {
      expect(useGameStore.getState().applyCertificate(id).success).toBe(true);
    }
    // 重复申请被拒
    expect(useGameStore.getState().applyCertificate('BUSINESS_LICENSE').success).toBe(false);
    // 证件到期待审自动转 active（advanceCertificatesProcessor 的流转由 DayProcessor.test 覆盖），此处直接激活模拟到期
    const st = useGameStore.getState();
    useGameStore.setState({
      certificates: st.certificates.map((c) => ({ ...c, status: 'active' as const })),
    });
    expect(useGameStore.getState().checkAndListProduct('prod_stanup_cup', '斯坦杯 便携').passed).toBe(true);
    const influencerId = useGameStore.getState().influencers[0].id;
    const aff = useGameStore.getState().initiateAffiliate(influencerId, 'prod_stanup_cup', 0.2);
    // 达人合作不再被"未开业"拒绝（可能因随机成功率失败，但 message 不含开业提示）
    expect(aff.message).not.toContain('尚未开业');
  });

  it('easy 开局直接开业：初始库存已上架，无需办证', () => {
    useGameStore.getState().initNewGame({ identityId: 'student', difficultyId: 'easy', region: 'UK' });
    const st = useGameStore.getState();
    expect(st.inventory.every((i) => i.isListed === true)).toBe(true);
    expect(st.checkAndListProduct('prod_stanup_cup', '斯坦杯 便携').passed).toBe(true);
  });

  it('P0-1 修复：normal/hard 开业那一刻自动上架初始库存（堵住"开业无订单"死胡同）', () => {
    useGameStore.getState().initNewGame({ identityId: 'student', difficultyId: 'hard', region: 'UK' });
    // 申请全部开业证件（状态 applying，到期待审）
    for (const id of HARD_L0) {
      expect(useGameStore.getState().applyCertificate(id).success).toBe(true);
    }
    // 让证件在下一步结束时即可转 active（模拟到期），从而触发"开业"这一刻
    const st = useGameStore.getState();
    useGameStore.setState({
      certificates: st.certificates.map((c) => ({ ...c, grantedDay: st.player.day })),
    });
    // 推进一步：advanceCertificatesProcessor 将证件转 active → isShopOpen 由 false 变 true → 自动上架
    useGameStore.getState().skipToNextDay();
    const after = useGameStore.getState();
    const inWarehouse = after.inventory.filter((i) => i.inboundQuantity === 0);
    expect(inWarehouse.length).toBeGreaterThan(0);
    expect(inWarehouse.every((i) => i.isListed === true)).toBe(true); // 已在仓库的初始库存被自动上架
  });
});
