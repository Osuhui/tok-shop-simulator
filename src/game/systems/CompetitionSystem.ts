// ============================================================
// 竞争对手 AI：份额演化、价格战压制自然流量、抢达人和恶意差评
// ============================================================
import type { GameState, Competitor, ProductCategory, RegionId } from '../types';
import type { DayProcessor } from '../engine/DayProcessor';

const COMPETITOR_NAMES = ['速卖通优选', '环球优品', '海淘严选', '潮玩工坊', '优价联盟'];

const HOT_BY_REGION: Record<RegionId, ProductCategory[]> = {
  UK: ['electronics', 'home', 'beauty'],
  US: ['toys', 'sports', 'electronics'],
  SEA: ['snacks', 'fashion', 'accessories'],
};

export function createInitialCompetitors(region: RegionId): Competitor[] {
  const hots = HOT_BY_REGION[region];
  const count = 2 + (region === 'US' ? 1 : 0);
  const tiers: Competitor['tier'][] = ['budget', 'mid', 'premium'];
  const competitors: Competitor[] = [];
  for (let i = 0; i < count; i++) {
    competitors.push({
      id: `comp-${i}`,
      name: COMPETITOR_NAMES[i % COMPETITOR_NAMES.length],
      tier: tiers[i % tiers.length],
      mainCategory: hots[i % hots.length],
      priceStrategy: (['low', 'mid', 'premium'] as const)[i % 3],
      marketShare: 0.1 + i * 0.05,
      aggressive: 0.3 + i * 0.15,
      poachedInfluencerIds: [],
    });
  }
  return competitors;
}

/** 玩家市场份额 = 1 - 竞品份额之和 */
export function playerMarketShare(state: GameState): number {
  const used = state.competitors.reduce((s, c) => s + c.marketShare, 0);
  return Math.max(0, 1 - used);
}

/** 价格战对自然流量的压制系数（越低越压制），存入 competitionPressure */
export function computePressure(state: GameState): number {
  const penalty = state.competitors.reduce((s, c) => s + c.marketShare * c.aggressive, 0);
  return Math.max(0.35, 1 - penalty);
}

/** 竞品偶发抢走中高阶达人 */
export function tryPoach(state: GameState, day: number): GameState {
  const aggressive = state.competitors.find((c) => c.aggressive > 0.5);
  if (!aggressive) return state;
  const target = state.influencers.find(
    (inf) => inf.status === 'available' && (inf.tier === 'mid' || inf.tier === 'macro' || inf.tier === 'mega'),
  );
  if (!target) return state;
  // 确定性概率
  const roll = Math.abs(Math.sin(day * 53.7 + aggressive.aggressive * 11.3));
  if (roll > 0.1) return state;
  return {
    ...state,
    influencers: state.influencers.map((inf) =>
      inf.id === target.id ? { ...inf, status: 'poached' as const } : inf,
    ),
    competitors: state.competitors.map((c) =>
      c.id === aggressive.id ? { ...c, poachedInfluencerIds: [...c.poachedInfluencerIds, target.id] } : c,
    ),
  };
}

export function competitionTick(state: GameState, day: number): GameState {
  // 份额演化：玩家表现好（健康分/声誉高）则竞品份额下降
  const playerStrength = state.player.healthScore / 5 + state.player.reputation / 100;
  const competitors = state.competitors.map((c) => {
    const drift = (playerStrength - 0.5) * 0.01 * (1 - c.aggressive);
    const marketShare = Math.max(0.02, Math.min(0.6, c.marketShare - drift));
    return { ...c, marketShare };
  });
  let next = { ...state, competitors };
  next = tryPoach(next, day);
  const pressure = computePressure(next);
  return { ...next, competitionPressure: pressure };
}

export const competitionProcessor: DayProcessor = (ctx) => ({
  ...ctx,
  state: competitionTick(ctx.state, ctx.day),
});
