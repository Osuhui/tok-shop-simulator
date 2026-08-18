// 新手引导 4 步 —— DashboardPanel 的进度清单与 OnboardingModal 的首次浮层共用同一份定义，
// 避免两处各自硬编码导致文案/顺序失同步（code-review: Duplicated Code）。
export interface OnboardingStepDef {
  id: 'stock' | 'order' | 'ship' | 'upgrade';
  icon: string;
  title: string;
  desc: string;
  panel: string;
}

// 注：第 2 步用「获得第一笔订单」而非 spec《PLAYTEST_REPORT》原文的「上架开张」。
// 原因：easy 难度初始库存默认 isListed=true（开局即可售），若把「上架」列为引导步骤会开局即完成、失去引导意义；
// 故以「获得首单」作为更关键且可检测的早期目标（发货/升级均依赖先有订单）。
// 2026-08-16 起 normal/hard 有开业证件要求（初始库存不上架），「办证开业」引导由 DashboardPanel 筹备卡 + CompliancePanel 承担。
export const ONBOARDING_STEPS: OnboardingStepDef[] = [
  { id: 'stock', icon: '🛒', title: '采购初始库存', desc: '去「选品」购买商品，仓库才有得卖。', panel: 'sourcing' },
  { id: 'list', icon: '📝', title: '上架开张', desc: '新到的商品默认未上架，去「上架」编辑标题并开张，顾客才能搜到。', panel: 'listing' },
  { id: 'order', icon: '📨', title: '获得第一笔订单', desc: '等待自然流量，或去「达人」谈合作引流。', panel: 'talentHub' },
  { id: 'ship', icon: '📦', title: '完成首单发货', desc: '去「物流」把待处理订单发出去，别超期被取消。', panel: 'logistics' },
  { id: 'upgrade', icon: '⬆️', title: '升级店铺至 Lv.2', desc: '攒够营收 / 订单 / 金币后升级，扩张经营。', panel: 'shop' },
];
