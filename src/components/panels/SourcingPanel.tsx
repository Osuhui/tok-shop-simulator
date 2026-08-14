import React, { useState } from 'react';
import { Panel } from '../ui/Panel';
import { Button } from '../ui/Button';
import { useGameStore } from '../../stores/gameStore';
import { getProductsByRegion, getProduct } from '../../game/data/products';
import { formatGold } from '../../utils/format';
import type { Product, WarehouseType } from '../../game/types';

interface Props { onClose: () => void }

export const SourcingPanel: React.FC<Props> = ({ onClose }) => {
  const player = useGameStore(s => s.player);
  const inventory = useGameStore(s => s.inventory);
  const purchaseProduct = useGameStore(s => s.purchaseProduct);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(50);
  const [warehouseType, setWarehouseType] = useState<WarehouseType>('self');

  const products = getProductsByRegion(player.currentRegion);

  const handlePurchase = () => {
    if (!selectedProduct) return;
    const result = purchaseProduct(selectedProduct.id, quantity, warehouseType);
    if (result.success) {
      setSelectedProduct(null);
      setQuantity(50);
    } else {
      alert(result.error);
    }
  };

  const getDiscount = (qty: number): string => {
    if (qty >= 500) return '8折';
    if (qty >= 100) return '9折';
    return '原价';
  };

  const calculateTotal = (): number => {
    if (!selectedProduct) return 0;
    let unitCost = selectedProduct.cost;
    if (quantity >= 500) unitCost *= 0.8;
    else if (quantity >= 100) unitCost *= 0.9;
    return Math.round(unitCost * quantity * 100) / 100;
  };

  return (
    <Panel title="🛒 供应链市场" onClose={onClose}>
      {/* 我的库存概览：现货 + 在途，避免盲目重复采购 */}
      <div className="mb-4 bg-slate-800/50 rounded-lg p-3">
        <h4 className="text-xs font-bold text-slate-400 mb-2">📦 我的库存</h4>
        {inventory.length === 0 ? (
          <p className="text-xs text-slate-500">暂无库存</p>
        ) : (
          <ul className="space-y-1">
            {inventory.map(item => {
              const product = getProduct(item.productId);
              return (
                <li key={item.productId + item.warehouseType} className="flex justify-between text-xs">
                  <span className="text-slate-300 truncate">
                    {product?.name ?? item.productId}
                    {item.warehouseType === 'overseas' ? '（海外仓）' : ''}
                  </span>
                  <span className="text-slate-400 shrink-0">
                    现货 {item.quantity}
                    {item.inboundQuantity > 0 && (
                      <span className="text-cyan-400"> · 在途 {item.inboundQuantity}（D{item.arrivalDay} 到）</span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {/* 商品列表 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4 max-h-64 overflow-y-auto">
        {products.map(product => (
          <div
            key={product.id}
            onClick={() => setSelectedProduct(product)}
            className={`p-3 rounded-lg border cursor-pointer transition-all ${
              selectedProduct?.id === product.id
                ? 'border-purple-500 bg-purple-500/10'
                : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
            }`}
          >
            <p className="text-sm text-slate-200 font-medium truncate">{product.name}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {product.category} · {product.riskLevel === 'counterfeit' ? '⚠️山寨' : product.riskLevel === 'whiteLabel' ? '白牌' : '正品'}
            </p>
            <p className="text-xs text-amber-400 mt-1">采购价 {formatGold(product.cost)}</p>
            <p className="text-xs text-slate-500">建议售价 {formatGold(product.basePrice)}</p>
          </div>
        ))}
      </div>

      {/* 采购配置 */}
      {selectedProduct && (
        <div className="bg-slate-800/50 rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-bold text-slate-300">
            采购：{selectedProduct.name}
          </h4>
          <p className="text-xs text-slate-500">{selectedProduct.description}</p>

          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">数量：</span>
            <div className="flex items-center gap-1">
              {[10, 50, 100, 200, 500].map(n => (
                <button
                  key={n}
                  onClick={() => setQuantity(n)}
                  className={`px-2 py-1 text-xs rounded cursor-pointer transition-colors ${
                    quantity === n ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {n}
                </button>
              ))}
              <input
                type="number"
                value={quantity}
                onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-white text-center"
                min={1}
              />
            </div>
            <span className="text-xs text-slate-500">({getDiscount(quantity)})</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">仓库：</span>
            <select
              value={warehouseType}
              onChange={e => setWarehouseType(e.target.value as WarehouseType)}
              className="bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm text-white"
            >
              <option value="self">自发货仓库</option>
              <option value="overseas">海外仓（需提前囤货）</option>
            </select>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-700">
            <div>
              <p className="text-xs text-slate-500">预计到货：Day {player.day + selectedProduct.sourcingLeadTime[player.currentRegion]}</p>
              <p className="text-lg font-bold text-amber-400">总价：{formatGold(calculateTotal())}</p>
            </div>
            <Button onClick={handlePurchase} disabled={calculateTotal() > player.gold}>
              确认采购
            </Button>
          </div>
        </div>
      )}
    </Panel>
  );
};
