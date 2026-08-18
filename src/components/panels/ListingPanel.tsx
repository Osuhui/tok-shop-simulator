import React, { useState } from 'react';
import { Panel } from '../ui/Panel';
import { Button } from '../ui/Button';
import { useGameStore } from '../../stores/gameStore';
import { isShopOpen, getMissingCerts } from '../../game/systems/OpeningSystem';
import { CERT_DEFINITION_MAP } from '../../game/data/certificates';
import { getProduct } from '../../game/data/products';

interface Props { onClose: () => void }

export const ListingPanel: React.FC<Props> = ({ onClose }) => {
  const inventory = useGameStore(s => s.inventory);
  const certificates = useGameStore(s => s.certificates);
  const checkAndListProduct = useGameStore(s => s.checkAndListProduct);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [complianceResult, setComplianceResult] = useState<{
    passed: boolean;
    violations: string[];
    penaltyLevel: string;
  } | null>(null);

  const inStockItems = inventory.filter(i => (i.isListed ?? false) || i.quantity > 0 || i.inboundQuantity > 0);
  const unlistedInStock = inStockItems.filter(i => !(i.isListed ?? false) && i.quantity > 0);
  const latest = { ...useGameStore.getState(), certificates };
  const shopOpen = isShopOpen(latest);
  const missingCerts = getMissingCerts(latest);

  const handleListAll = () => {
    let ok = 0;
    unlistedInStock.forEach(item => {
      const name = getProduct(item.productId)?.name ?? item.productId;
      const r = checkAndListProduct(item.productId, name);
      if (r.passed) ok++;
    });
    if (ok > 0) setComplianceResult({ passed: true, violations: [], penaltyLevel: 'none' });
  };

  const handleCheck = () => {
    if (!selectedItem || !title.trim()) return;
    const result = checkAndListProduct(selectedItem, title.trim());
    setComplianceResult(result);
    if (result.passed) {
      setTitle('');
      setSelectedItem(null);
    }
  };

  return (
    <Panel title="📝 商品上架" onClose={onClose}>
      {/* 未开业横幅：办齐开业证件前不可上架 */}
      {!shopOpen && missingCerts.length > 0 && (
        <div className="rounded-lg border border-rose-700 bg-rose-500/10 p-4 mb-4">
          <p className="text-sm font-bold text-rose-400">🔒 店铺尚未开业</p>
          <p className="text-xs text-slate-400 mt-1">
            请先到「办证」办齐：{missingCerts.map(id => CERT_DEFINITION_MAP[id].name).join('、')}
            ，开业后方可上架商品。
          </p>
        </div>
      )}

      {shopOpen && unlistedInStock.length > 0 && (
        <div className="rounded-lg border border-purple-700 bg-purple-500/10 p-4 mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-purple-300">⏳ 有 {unlistedInStock.length} 件未上架商品</p>
            <p className="text-xs text-slate-400 mt-1">未上架的商品不会产生自然流量订单。</p>
          </div>
          <Button variant="primary" size="sm" onClick={handleListAll}>
            🚀 一键开张全部
          </Button>
        </div>
      )}

      {inStockItems.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-8">
          暂无库存商品。请先在"选品"中采购商品。
        </p>
      ) : (
        <div className="space-y-4">
          {/* 选择商品 */}
          <div>
            <h4 className="text-sm text-slate-400 mb-2">选择要上架的商品（库存充足）</h4>
            <div className="grid grid-cols-2 gap-2">
              {inStockItems.map(item => (
                <div
                  key={item.productId}
                  onClick={() => { if (!item.isListed) { setSelectedItem(item.productId); setComplianceResult(null); } }}
                  className={`p-3 rounded-lg border transition-all ${
                    item.isListed
                      ? 'border-emerald-800 bg-emerald-900/20 cursor-default'
                      : selectedItem === item.productId
                        ? 'border-purple-500 bg-purple-500/10 cursor-pointer'
                        : 'border-slate-700 bg-slate-800/50 hover:border-slate-600 cursor-pointer'
                  }`}
                >
                  <p className="text-sm text-slate-200">{item.productId}</p>
                  <p className="text-xs text-slate-500">
                    库存：{item.quantity} 件
                    {item.isListed
                      ? ' · ✅ 已上架'
                      : ' · ⏳ 未上架'}
                  </p>
                  {item.isListed && item.listedTitle && (
                    <p className="text-[11px] text-emerald-400/80 mt-0.5 truncate">“{item.listedTitle}”</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 编辑标题 */}
          {selectedItem && (
            <div>
              <h4 className="text-sm text-slate-400 mb-2">编辑商品标题</h4>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="输入商品标题（注意避免品牌词和违规词）..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <p className="text-xs text-slate-600 mt-1">
                ⚠️ 避免使用品牌名（Nike, Apple等）、绝对化用语（最好、100%）、医疗功效词
              </p>

              <div className="flex justify-end mt-3">
                <Button onClick={handleCheck} disabled={!title.trim()}>
                  🔍 检测并上架
                </Button>
              </div>
            </div>
          )}

          {/* 合规检测结果 */}
          {complianceResult && (
            <div className={`p-4 rounded-lg border ${
              complianceResult.passed
                ? 'border-emerald-600 bg-emerald-500/10'
                : complianceResult.penaltyLevel === 'heavy'
                  ? 'border-red-600 bg-red-500/10'
                  : 'border-amber-600 bg-amber-500/10'
            }`}>
              {complianceResult.passed ? (
                <p className="text-emerald-400 text-sm">✅ 合规检测通过！商品已成功上架。</p>
              ) : (
                <>
                  <p className="text-sm font-bold mb-2">
                    {complianceResult.penaltyLevel === 'heavy' ? '🔴 严重违规' :
                     complianceResult.penaltyLevel === 'medium' ? '🟡 中度违规' : '🟠 轻微违规'}
                  </p>
                  <ul className="text-xs space-y-1">
                    {complianceResult.violations.map((v, i) => (
                      <li key={i} className="text-red-400">• {v}</li>
                    ))}
                  </ul>
                  <p className="text-xs text-slate-400 mt-2">
                    请修改标题后重试。违规上架将导致罚款和店铺扣分！
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </Panel>
  );
};
