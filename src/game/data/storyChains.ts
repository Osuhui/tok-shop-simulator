// ============================================================
// 剧情链定义（Sprint 0 骨架：示例一条"合规收紧"链，后续内容 Sprint 逐步补全）
// 事件本身通过 GameEvent.chainId / chainStage 挂到链上，
// StoryEngine.getNextChainEvent 按 stage 升序、冷却闸门推进。
// ============================================================
import type { GameEvent } from '../types';
import { EVENTS } from './events';

export interface StoryChain {
  id: string;
  title: string;
  description: string;
  /** 该链包含的事件 id（按剧情顺序排列，便于查阅） */
  eventIds: string[];
}

export const STORY_CHAINS: StoryChain[] = [
  {
    id: 'COMPLIANCE_CHAIN',
    title: '合规收紧风波',
    description:
      '你的英国货物因缺少 CE 认证被海关扣留，紧接着平台针对类目合规收紧政策——跨境生意的"证件关"正式登场。',
    eventIds: ['evt_customs_seizure', 'evt_platform_policy'],
  },
  {
    id: 'TAX_CHAIN',
    title: '税务稽查连环',
    description: '从申报提醒到稽查上门，税务合规是跨境店铺长期经营绕不开的一道坎。',
    eventIds: ['evt_tax_filing_reminder', 'evt_tax_audit'],
  },
  {
    id: 'chain_supply_chain',
    title: '创业者·供应链历险',
    description: '初创店铺最脆弱的就是货源与物流：工厂毁约、物流抛橄榄枝，每一步都在考验你的应变。',
    eventIds: ['evt_ent_supplier_breach', 'evt_ent_logistics_partner'],
  },
  {
    id: 'chain_business_growth',
    title: '老手卖家·规模化增长',
    description: '经验是把双刃剑：规模上来后，团队管理与品牌化才是下一关。',
    eventIds: ['evt_vet_scale_bottleneck', 'evt_vet_brand_deal'],
  },
  {
    id: 'CHAIN_CAMPUS',
    title: '学生党·校园创业',
    description: '从校园市集到同学入伙，边上学边开店，小本生意也能长出故事。',
    eventIds: ['evt_stu_campus_fair', 'evt_stu_classmate_partner'],
  },
];

/** 取某剧情链的全部事件（按链上 stage 升序），供 StoryEngine 使用 */
export function getChainEvents(chainId: string, pool: GameEvent[] = EVENTS): GameEvent[] {
  return pool
    .filter((e) => e.chainId === chainId)
    .sort((a, b) => (a.chainStage ?? 0) - (b.chainStage ?? 0));
}
