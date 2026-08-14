import React, { useState } from 'react';
import { Panel } from '../ui/Panel';
import { Button } from '../ui/Button';
import { useGameStore } from '../../stores/gameStore';
import { getInfluencersByRegion } from '../../game/data/influencers';
import { AffiliateSystem } from '../../game/systems/AffiliateSystem';
import { formatGold, formatNumber, formatPercent } from '../../utils/format';
import type { Product } from '../../game/types';
import { getProduct } from '../../game/data/products';

interface Props { onClose: () => void }

export const TalentHubPanel: React.FC<Props> = ({ onClose }) => {
  const player = useGameStore(s => s.player);
  const inventory = useGameStore(s => s.inventory);
  const initiateAffiliate = useGameStore(s => s.initiateAffiliate);
  const [selectedInfluencer, setSelectedInfluencer] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [commission, setCommission] = useState(0.20);
  const [result, setResult] = useState<{ success: boolean; message: string; ordersCount: number } | null>(null);

  const influencers = getInfluencersByRegion(player.currentRegion);
  const inStockProducts = inventory.filter(i => i.quantity > 0)
    .map(i => getProduct(i.productId))
    .filter((p): p is Product => p !== undefined);

  const influencer = influencers.find(i => i.id === selectedInfluencer);
  const product = selectedProduct ? getProduct(selectedProduct) : undefined;

  // 预估数据
  const estimation = influencer && product
    ? AffiliateSystem.getEstimation(influencer, product, commission, player)
    : null;

  const handleCooperate = () => {
    if (!selectedInfluencer || !selectedProduct) return;
    const res = initiateAffiliate(selectedInfluencer, selectedProduct, commission);
    setResult(res);
  };

  return (
    <Panel title="🌟 Talent Hub · 达人广场" onClose={onClose}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 达人列表 */}
        <div className="space-y-2 max-h-80 overflow-y-auto">
          <h4 className="text-xs text-slate-500 uppercase tracking-wider mb-2">可用达人</h4>
          {influencers.map(inf => (
            <div
              key={inf.id}
              onClick={() => setSelectedInfluencer(inf.id)}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                selectedInfluencer === inf.id
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">{inf.avatar}</span>
                <div>
                  <p className="text-sm text-slate-200 font-medium">{inf.name}</p>
                  <p className="text-xs text-slate-500">
                    {formatNumber(inf.followers)} 粉丝 · {inf.tier}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {inf.categoryTags.map(tag => (
                  <span key={tag} className="text-[10px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 合作配置 */}
        <div className="md:col-span-2 space-y-4">
          {influencer ? (
            <>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">{influencer.avatar}</span>
                  <div>
                    <h4 className="text-base font-bold text-white">{influencer.name}</h4>
                    <p className="text-xs text-slate-400">{influencer.bio}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div><span className="text-slate-500">粉丝：</span>{formatNumber(influencer.followers)}</div>
                  <div><span className="text-slate-500">层级：</span>{influencer.tier}</div>
                  <div><span className="text-slate-500">期望佣金：</span>{formatPercent(influencer.baseCommission)}</div>
                  <div><span className="text-slate-500">基础意愿：</span>{formatPercent(influencer.baseWillingness)}</div>
                  <div><span className="text-slate-500">最低评分：</span>{influencer.minHealthRequired}</div>
                  <div><span className="text-slate-500">基础出单量：</span>{influencer.baseOrderVolume}</div>
                </div>
              </div>

              {/* 选择商品 */}
              <div>
                <h4 className="text-sm text-slate-400 mb-2">选择推广商品</h4>
                <div className="grid grid-cols-2 gap-2">
                  {inStockProducts.map(p => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedProduct(p.id)}
                      className={`p-2 rounded-lg border cursor-pointer text-sm ${
                        selectedProduct === p.id
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                      }`}
                    >
                      <p className="text-slate-200">{p.name}</p>
                      <p className="text-xs text-slate-500">售价 {formatGold(p.basePrice)}</p>
                    </div>
                  ))}
                  {inStockProducts.length === 0 && (
                    <p className="text-xs text-slate-500 col-span-2">暂无库存商品</p>
                  )}
                </div>
              </div>

              {/* 佣金设置 */}
              <div>
                <h4 className="text-sm text-slate-400 mb-2">
                  佣金比例：{formatPercent(commission)}
                </h4>
                <input
                  type="range"
                  min={5}
                  max={40}
                  value={Math.round(commission * 100)}
                  onChange={e => setCommission(parseInt(e.target.value) / 100)}
                  className="w-full accent-purple-600"
                />
                <div className="flex justify-between text-xs text-slate-600">
                  <span>5%</span>
                  <span>期望 {formatPercent(influencer.baseCommission)}</span>
                  <span>40%</span>
                </div>
              </div>

              {/* 预估 */}
              {estimation && (
                <div className="bg-slate-800/50 rounded-lg p-4 text-sm space-y-1">
                  <h4 className="text-slate-400 font-bold mb-1">📈 预估</h4>
                  <p className="text-slate-300">成功率：<span className="text-purple-400 font-bold">{formatPercent(estimation.successRate)}</span></p>
                  <p className="text-slate-300">预计出单：<span className="text-cyan-400 font-bold">{formatNumber(estimation.estimatedOrders)} 单</span></p>
                  <p className="text-slate-300">预估营收：<span className="text-emerald-400 font-bold">{formatGold(estimation.estimatedRevenue)}</span></p>
                  <p className="text-slate-300">达人佣金：<span className="text-amber-400 font-bold">{formatGold(estimation.commissionCost)}</span></p>
                </div>
              )}

              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleCooperate}
                disabled={!selectedProduct}
              >
                🤝 发起合作邀约
              </Button>

              {/* 结果 */}
              {result && (
                <div className={`p-4 rounded-lg border ${
                  result.success ? 'border-emerald-600 bg-emerald-500/10' : 'border-red-600 bg-red-500/10'
                }`}>
                  <p className="text-sm">{result.message}</p>
                  {result.success && (
                    <p className="text-xs text-slate-400 mt-1">生成了 {result.ordersCount} 个待处理订单！</p>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="text-slate-500 text-sm text-center py-16">👈 请从左侧选择一位达人</p>
          )}
        </div>
      </div>
    </Panel>
  );
};
