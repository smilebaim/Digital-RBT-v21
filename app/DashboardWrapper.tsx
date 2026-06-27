'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import DashboardTabRedirect from './components/DashboardTabRedirect';

const DashboardClient = dynamic(() => import('./DashboardClient'), {
  ssr: false,
});

export default function DashboardWrapper() {
  return (
    <Suspense fallback={null}>
      <DashboardTabRedirect />
      <DashboardClient />
    </Suspense>
  );
}
