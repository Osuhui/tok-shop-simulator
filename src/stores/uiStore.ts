// ============================================================
// UI 状态 Store
// ============================================================
import { create } from 'zustand';

interface UIState {
  /** 是否显示通知面板 */
  showNotifications: boolean;
  /** 是否显示设置面板 */
  showSettings: boolean;
  /** 3D场景是否加载完成 */
  sceneLoaded: boolean;
  /** Toast消息队列 */
  toasts: Toast[];
  /** 首次进入新手引导是否已看过（本机 localStorage 持久化，跨存档只弹一次） */
  onboardingSeen: boolean;

  // Actions
  toggleNotifications: () => void;
  toggleSettings: () => void;
  setSceneLoaded: (loaded: boolean) => void;
  addToast: (message: string, type: Toast['type']) => void;
  removeToast: (id: string) => void;
  setOnboardingSeen: () => void;
}

export interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'danger';
}

export const useUIStore = create<UIState>((set) => ({
  showNotifications: false,
  showSettings: false,
  sceneLoaded: false,
  toasts: [],
  onboardingSeen: typeof localStorage !== 'undefined' && localStorage.getItem('tokshop.onboardingSeen') === '1',

  toggleNotifications: () => set(s => ({ showNotifications: !s.showNotifications })),
  toggleSettings: () => set(s => ({ showSettings: !s.showSettings })),
  setSceneLoaded: (loaded: boolean) => set({ sceneLoaded: loaded }),

  addToast: (message: string, type: Toast['type']) => {
    const toast: Toast = {
      id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      message,
      type,
    };
    set(s => ({ toasts: [...s.toasts, toast] }));
    // 自动消失
    setTimeout(() => {
      set(s => ({ toasts: s.toasts.filter(t => t.id !== toast.id) }));
    }, 3000);
  },

  removeToast: (id: string) => {
    set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }));
  },

  setOnboardingSeen: () => {
    try { localStorage.setItem('tokshop.onboardingSeen', '1'); } catch { /* ignore */ }
    set({ onboardingSeen: true });
  },
}));
