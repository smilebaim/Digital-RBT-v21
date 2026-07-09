'use client';

import type { DashboardLoadingItem } from '../lib/dashboard-bridge';

interface DashboardLoadingProps {
  visible: boolean;
  phase: 'scripts' | 'data';
  items: DashboardLoadingItem[];
}

const STATUS_ICON: Record<DashboardLoadingItem['status'], string> = {
  pending: 'fa-circle',
  loading: 'fa-spinner fa-spin',
  done: 'fa-check',
  error: 'fa-times',
};

const STATUS_COLOR: Record<DashboardLoadingItem['status'], string> = {
  pending: 'text-gray-400',
  loading: 'text-blue-600',
  done: 'text-green-600',
  error: 'text-red-600',
};

export default function DashboardLoading({ visible, phase, items }: DashboardLoadingProps) {
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50"
      role="status"
      aria-live="polite"
      aria-label="Memuat dashboard"
    >
      <div className="mx-4 flex min-w-[280px] max-w-sm flex-col items-center gap-4 rounded-xl bg-white p-8 shadow-xl">
        <div
          className="h-10 w-10 rounded-full border-4 border-primary-600 border-t-transparent"
          style={{ animation: 'spin 0.8s linear infinite' }}
        />
        <p className="font-medium text-gray-700">
          {phase === 'scripts' ? 'Memuat Dashboard...' : 'Memuat Data'}
        </p>
        {items.length > 0 && (
          <ul className="w-full space-y-2 text-sm">
            {items.map((item, index) => (
              <li key={index} className={`flex items-center gap-2 ${STATUS_COLOR[item.status]}`}>
                <i className={`fas ${STATUS_ICON[item.status]} text-[10px]`} />
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
