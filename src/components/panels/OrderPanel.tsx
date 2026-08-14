import React, { useState } from 'react';
import { Panel } from '../ui/Panel';
import { useGameStore } from '../../stores/gameStore';
import { formatGold, orderStatusLabel, orderStatusColor } from '../../utils/format';
import type { OrderStatus } from '../../game/types';

interface Props { onClose: () => void }

const statusFilters: ('all' | OrderStatus)[] = ['all', 'pending', 'processing', 'shipped', 'inTransit', 'delivered', 'cancelled'];

export const OrderPanel: React.FC<Props> = ({ onClose }) => {
  const orders = useGameStore(s => s.orders);
  const [filter, setFilter] = useState<'all' | OrderStatus>('all');

  const filtered = filter === 'all'
    ? orders
    : orders.filter(o => o.status === filter);

  const sorted = [...filtered].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <Panel title="📋 订单管理" onClose={onClose}>
      {/* 统计 */}
      <div className="flex flex-wrap gap-2 mb-4">
        {statusFilters.map(s => {
          const count = s === 'all' ? orders.length : orders.filter(o => o.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1 text-xs rounded-full cursor-pointer transition-colors ${
                filter === s
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {s === 'all' ? '全部' : orderStatusLabel(s)} ({count})
            </button>
          );
        })}
      </div>

      {/* 订单列表 */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {sorted.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">暂无匹配订单</p>
        ) : (
          sorted.map(order => (
            <div key={order.orderId} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">{order.orderId}</span>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-medium text-white"
                    style={{ backgroundColor: orderStatusColor(order.status) }}
                  >
                    {orderStatusLabel(order.status)}
                  </span>
                  {order.influencerId && <span className="text-[10px] bg-purple-600/30 text-purple-400 px-1.5 py-0.5 rounded">达人</span>}
                </div>
                <span className="text-sm font-bold text-amber-400">{formatGold(order.totalAmount)}</span>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-1 text-xs text-slate-500">
                <span>数量：{order.quantity}</span>
                <span>单价：{formatGold(order.unitPrice)}</span>
                <span>物流：{order.shippingType === 'self' ? '自发货' : '海外仓'}</span>
                <span>运费：{formatGold(order.shippingCost)}</span>
                <span>截止：Day {order.deadline}</span>
              </div>
              {order.status === 'pending' && (
                <div className="text-[10px] text-amber-400 mt-1">⏰ 等待发货</div>
              )}
            </div>
          ))
        )}
      </div>
    </Panel>
  );
};
