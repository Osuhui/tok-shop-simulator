import React from 'react';
import { Panel } from '../ui/Panel';
import { Button } from '../ui/Button';
import { useGameStore } from '../../stores/gameStore';

interface Props { onClose: () => void }

export const LogisticsPanel: React.FC<Props> = ({ onClose }) => {
  const orders = useGameStore(s => s.orders);
  const inventory = useGameStore(s => s.inventory);
  const shipOrder = useGameStore(s => s.shipOrder);
  const player = useGameStore(s => s.player);

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const inTransitOrders = orders.filter(o => o.status === 'shipped' || o.status === 'inTransit');

  const handleShip = (orderId: string) => {
    const result = shipOrder(orderId);
    if (!result.success) {
      alert(result.error);
    }
  };

  const handleShipAll = () => {
    for (const order of pendingOrders) {
      shipOrder(order.orderId);
    }
  };

  return (
    <Panel
      title="📦 物流中心"
      onClose={onClose}
      headerRight={
        pendingOrders.length > 0 ? (
          <Button size="sm" variant="success" onClick={handleShipAll}>
            一键发货全部
          </Button>
        ) : undefined
      }
    >
      {/* 库存状态 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-800/50 rounded-lg p-3">
          <p className="text-xs text-slate-500">待发货订单</p>
          <p className="text-2xl font-bold text-amber-400">{pendingOrders.length}</p>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3">
          <p className="text-xs text-slate-500">运输中订单</p>
          <p className="text-2xl font-bold text-cyan-400">{inTransitOrders.length}</p>
        </div>
      </div>

      {/* 当前库存 */}
      <div className="mb-4">
        <h4 className="text-sm text-slate-400 mb-2">📋 当前库存</h4>
        <div className="grid grid-cols-2 gap-2">
          {inventory.filter(i => i.quantity > 0 || i.inboundQuantity > 0).map(item => (
            <div key={item.productId} className="bg-slate-800/50 rounded-lg p-2 text-xs">
              <p className="text-slate-300">{item.productId}</p>
              <p className="text-slate-500">
                可用：{item.quantity} | 在途：{item.inboundQuantity}
                {item.warehouseType === 'overseas' && ' | 🌍海外仓'}
              </p>
            </div>
          ))}
          {inventory.filter(i => i.quantity > 0 || i.inboundQuantity > 0).length === 0 && (
            <p className="text-xs text-slate-500 col-span-2">暂无库存</p>
          )}
        </div>
      </div>

      {/* 待发货列表 */}
      <div>
        <h4 className="text-sm text-slate-400 mb-2">📬 待发货订单（{pendingOrders.length}）</h4>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {pendingOrders.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-4">暂无待发货订单</p>
          ) : (
            pendingOrders.map(order => {
              const invItem = inventory.find(i => i.productId === order.productId);
              const canShip = invItem && invItem.quantity >= order.quantity;

              return (
                <div key={order.orderId} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-200">{order.orderId}</p>
                      <p className="text-xs text-slate-500">
                        {order.productName} × {order.quantity} · 截止 Day {order.deadline}
                        （剩余 {Math.max(0, order.deadline - player.day)} 天）
                      </p>
                      {!canShip && (
                        <p className="text-xs text-red-400 mt-0.5">⚠️ 库存不足（需要 {order.quantity}，现有 {invItem?.quantity || 0}）</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant={canShip ? 'primary' : 'secondary'}
                      onClick={() => handleShip(order.orderId)}
                      disabled={!canShip}
                    >
                      📦 打包发货
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Panel>
  );
};
