// 轻量特效总线：在关键爽点（回款 / 升级 / 通关 / 受挫）触发浮动反馈
export type FxKind = 'gold' | 'bad' | 'levelup' | 'victory' | 'ship' | 'order';

export interface FxItem {
  id: number;
  kind: FxKind;
  text: string;
}

type Listener = (fx: FxItem) => void;

const listeners = new Set<Listener>();
let seq = 0;

export const fxBus = {
  emit(kind: FxKind, text: string) {
    const item: FxItem = { id: ++seq, kind, text };
    listeners.forEach((l) => l(item));
  },
  subscribe(l: Listener) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};
