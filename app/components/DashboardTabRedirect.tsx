'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DEFAULT_TAB_URL } from '../lib/dashboard-tabs';

/** Ensure /dashboard always has ?tab= so BottomNav highlights correctly. */
export default function DashboardTabRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!searchParams.get('tab')) {
      router.replace(`/dashboard?tab=${DEFAULT_TAB_URL}`, { scroll: false });
    }
  }, [router, searchParams]);

  return null;
}
