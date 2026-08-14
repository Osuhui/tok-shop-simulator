// ============================================================
// 员工系统：招聘客服/运营/打包员，月度发薪，打包员自动发货
// ============================================================
import type { GameState, Employee, EmployeeRole, InventoryItem, Order } from '../types';
import { LogisticsSystem } from './LogisticsSystem';
import type { DayProcessor } from '../engine/DayProcessor';

export const EMPLOYEE_DEFS: Record<EmployeeRole, { name: string; salary: number; desc: string }> = {
  cs: { name: '客服专员', salary: 200, desc: '退货率降低 2~5%' },
  ops: { name: '运营专员', salary: 300, desc: '自然流量 +20~50%' },
  packer: { name: '打包员', salary: 150, desc: '自动发货（免手动）' },
};

export function createInitialEmployees(): Employee[] {
  return [];
}

export function hireEmployee(state: GameState, role: EmployeeRole, day: number): { state: GameState; error?: string } {
  const def = EMPLOYEE_DEFS[role];
  if (state.player.gold < def.salary) return { state, error: '资金不足以支付首月薪资' };
  const employee: Employee = {
    id: `emp-${day}-${state.employees.length}`,
    role,
    name: def.name,
    salary: def.salary,
    hiredDay: day,
  };
  return {
    state: {
      ...state,
      employees: [...state.employees, employee],
      player: { ...state.player, gold: state.player.gold - def.salary },
    },
  };
}

/** 客服降低退货率、运营提升流量（供 FinanceSystem 读取） */
export function employeeReturnRateMultiplier(state: GameState): number {
  const cs = state.employees.filter((e) => e.role === 'cs').length;
  return Math.max(0.8, 1 - 0.03 * cs);
}

export function employeeTrafficMultiplier(state: GameState): number {
  const ops = state.employees.filter((e) => e.role === 'ops').length;
  return 1 + 0.25 * ops;
}

/** 打包员自动发货：处理所有 pending 订单 */
function autoShip(state: GameState, day: number): { orders: Order[]; inventory: InventoryItem[] } {
  let inventory = state.inventory;
  let orders = state.orders;
  const hasPacker = state.employees.some((e) => e.role === 'packer');
  if (!hasPacker) return { orders, inventory };

  for (const order of orders) {
    if (order.status !== 'pending') continue;
    const { result, updatedInventory } = LogisticsSystem.shipOrder(order, inventory, day);
    if (result.success) {
      inventory = updatedInventory;
      orders = orders.map((o) =>
        o.orderId === order.orderId ? { ...o, status: 'shipped' as const, shippingCost: result.shippingCost } : o,
      );
    }
  }
  return { orders, inventory };
}

export const employeeProcessor: DayProcessor = (ctx) => {
  let state = ctx.state;

  // 打包员自动发货
  const shipped = autoShip(state, ctx.day);
  state = { ...state, orders: shipped.orders, inventory: shipped.inventory };

  // 月度发薪
  if (ctx.day % 30 === 0 && state.employees.length > 0) {
    let gold = state.player.gold;
    const remaining: Employee[] = [];
    const notifications = [...state.notifications];
    for (const emp of state.employees) {
      if (gold >= emp.salary) {
        gold -= emp.salary;
        remaining.push(emp);
      } else {
        notifications.push({
          id: `notif-leave-${emp.id}`,
          title: '员工离职',
          message: `${emp.name} 因发不出薪资离职了…`,
          type: 'warning',
          timestamp: ctx.day,
          read: false,
        });
      }
    }
    state = {
      ...state,
      employees: remaining,
      notifications,
      player: { ...state.player, gold: Math.round(gold * 100) / 100 },
    };
  }

  return { ...ctx, state };
};
