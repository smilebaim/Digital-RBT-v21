export const DASHBOARD_EVENTS = {
  LOADING: 'dashboard:loading',
  LOADING_ITEMS: 'dashboard:loading-items',
  LOADING_ITEM: 'dashboard:loading-item',
  INIT_COMPLETE: 'dashboard:init-complete',
} as const;

export type LoadingItemStatus = 'pending' | 'loading' | 'done' | 'error';

export interface DashboardLoadingItem {
  label: string;
  status: LoadingItemStatus;
}

declare global {
  interface Window {
    __dashboardMainReady?: boolean;
    __dashboardInitComplete?: boolean;
    __dashboardInitialTab?: string;
    switchTab?: (tabId: string) => void | Promise<void>;
    refreshData?: () => void | Promise<void>;
    __openGlobalDrawer?: () => void;
  }
}

export function isDashboardInitComplete(): boolean {
  return typeof window !== 'undefined' && window.__dashboardInitComplete === true;
}

export function waitForDashboardInit(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (isDashboardInitComplete()) return Promise.resolve();
  return new Promise((resolve) => {
    window.addEventListener(DASHBOARD_EVENTS.INIT_COMPLETE, () => resolve(), { once: true });
  });
}
