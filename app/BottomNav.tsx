'use client';

import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { DASHBOARD_EVENTS, isDashboardInitComplete } from './lib/dashboard-bridge';
import { TAB_URL_TO_INTERNAL } from './lib/dashboard-tabs';

const TABS = [
  {
    id: 'profil',
    internalId: 'dampak',
    label: 'Profil',
    icon: 'fa-id-card',
    color: '#000000',
    bg: '#f0fdf4',
    border: '#bbf7d0',
  },
  {
    id: 'peta',
    internalId: 'peta-operasi',
    label: 'Peta',
    icon: 'fa-map-marked-alt',
    color: '#000000',
    bg: '#dbeafe',
    border: '#93c5fd',
  },
  {
    id: 'pembangunan',
    internalId: 'pengungsi',
    label: 'Program',
    icon: 'fa-hammer',
    color: '#000000',
    bg: '#f0f9ff',
    border: '#bae6fd',
  },
  {
    id: 'dana-desa',
    internalId: 'pengungsi',
    label: 'Dana Desa',
    icon: 'fa-wallet',
    color: '#000000',
    bg: '#ecfdf5',
    border: '#a7f3d0',
  },
  {
    id: 'indeks',
    internalId: 'bantuan',
    label: 'Indeks',
    icon: 'fa-chart-line',
    color: '#000000',
    bg: '#f5f3ff',
    border: '#ddd6fe',
  },
];

const DRAWER_MENU = [
  {
    label: 'Literasi',
    sub: 'Data Indeks Desa Membangun',
    href: '/dashboard?tab=indeks',
    icon: 'fa-chart-line',
    color: '#000000',
    bg: '#f5f3ff',
    border: '#ddd6fe',
  },
  {
    label: 'Ekonomi',
    sub: 'Program & Anggaran',
    href: '/dashboard?tab=pembangunan',
    icon: 'fa-hammer',
    color: '#000000',
    bg: '#f0f9ff',
    border: '#bae6fd',
  },
  {
    label: 'Dana Desa',
    sub: 'Realisasi Anggaran & APBDes',
    href: '/dashboard?tab=dana-desa',
    icon: 'fa-wallet',
    color: '#000000',
    bg: '#ecfdf5',
    border: '#a7f3d0',
  },
  {
    label: 'Layanan',
    sub: 'Profil & Layanan Desa',
    href: '/dashboard?tab=profil',
    icon: 'fa-id-card',
    color: '#000000',
    bg: '#f0fdf4',
    border: '#bbf7d0',
  },
];

function BottomNavInner() {
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const router       = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dashboardReady, setDashboardReady] = useState(false);

  const currentTab  = searchParams?.get('tab') ?? '';
  const isDashboard = pathname === '/dashboard';

  useEffect(() => {
    if (isDashboardInitComplete()) setDashboardReady(true);

    const onReady = () => setDashboardReady(true);
    window.addEventListener(DASHBOARD_EVENTS.INIT_COMPLETE, onReady);
    return () => window.removeEventListener(DASHBOARD_EVENTS.INIT_COMPLETE, onReady);
  }, []);

  /* Tutup drawer dengan Escape */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  /* Expose fungsi global agar header dashboard bisa memicu drawer ini */
  useEffect(() => {
    (window as any).__openGlobalDrawer = () => setDrawerOpen(true);
    return () => { delete (window as any).__openGlobalDrawer; };
  }, []);

  const handleClick = (tabId: string) => {
    if (isDashboard) {
      router.push(`/dashboard?tab=${tabId}`, { scroll: false });
      if (dashboardReady && typeof window.switchTab === 'function') {
        const internalId = TAB_URL_TO_INTERNAL[tabId];
        if (internalId) void window.switchTab(internalId);
      }
    } else {
      window.location.href = `/dashboard?tab=${tabId}`;
    }
  };

  return (
    <>
      {/* ══ BOTTOM NAV ══ */}
      <nav className="fixed bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-[99999] pointer-events-none w-[90%] sm:w-auto max-w-[500px] sm:max-w-[760px]">
        <div
          className="border border-white/50 bg-white/40 backdrop-blur-md rounded-full p-1.5 flex items-center justify-between shadow-[0_8px_32px_rgba(0,0,0,0.15)] pointer-events-auto sm:gap-1"
          style={{ animation: 'fadeInUpNav 0.5s ease forwards' }}
        >
          {TABS.map((tab, index) => {
            const isActive = isDashboard && currentTab === tab.id;
            const isDisabled = isDashboard && !dashboardReady;
            return (
              <button
                key={tab.id}
                onClick={() => handleClick(tab.id)}
                disabled={isDisabled}
                title={isDisabled ? 'Memuat dashboard...' : tab.label}
                style={{ 
                  ...(isActive ? { background: 'transparent', color: tab.color, borderColor: tab.border } : {}),
                  animation: `fadeInUpNav 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards`,
                  animationDelay: `${index * 0.1}s`,
                  opacity: 0
                }}
                className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2.5 py-1 sm:px-5 sm:py-2.5 rounded-full transition-all duration-300 outline-none flex-1 sm:flex-none border hover:scale-105 hover:-translate-y-0.5 active:scale-95 ${
                  isActive 
                    ? 'shadow-md border-gray-200 bg-white/50 hover:shadow-lg' 
                    : 'bg-transparent text-black hover:bg-black/5 border-transparent hover:shadow-sm'
                }${isDisabled ? ' opacity-50 cursor-wait pointer-events-none' : ''}`}
              >
                <i 
                  className={`fas ${tab.icon} text-[15px] sm:text-[17px] text-black`}
                  style={{ 
                    opacity: 1,
                    filter: 'none',
                    transition: 'transform 0.15s, opacity 0.15s' 
                  }}
                />
                <span 
                  className="text-[11.5px] sm:text-[13.5px] font-normal whitespace-nowrap" 
                  style={{ 
                    color: '#000000',
                    
                  }}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ══ DRAWER OVERLAY ══ */}
      <div
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          background: drawerOpen ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0)',
          backdropFilter: drawerOpen ? 'blur(2px)' : 'none',
          zIndex: 199999,
          pointerEvents: drawerOpen ? 'auto' : 'none',
          transition: 'background 0.3s',
        }}
      />

      {/* ══ DRAWER PANEL ══ */}
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: 'fixed',
          top: '72px',
          left: 0,
          height: 'calc(100% - 152px)',
          width: 300, maxWidth: 'calc(100vw - 24px)',
          borderRadius: '0 20px 20px 0',
          background: 'rgba(255, 255, 255, 0.4)',
          borderRight: '1px solid rgba(255, 255, 255, 0.5)',
          borderTop: '1px solid rgba(255, 255, 255, 0.5)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.5)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          boxShadow: '8px 0 32px rgba(0,0,0,0.1)',
          zIndex: 200000,
          transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.32s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Drawer header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px',
          background: 'transparent',
          color: '#000000', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 400, fontSize: 15 }}>
            <span>Menu</span>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            aria-label="Tutup menu"
            style={{
              background: 'transparent', border: 'none', color: '#000000',
              fontSize: 16, width: 30, height: 30, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              outline: 'none',
            }}
          >✕</button>
        </div>

        {/* Drawer body */}
        <div style={{ padding: '16px 14px', overflowY: 'auto', flex: 1 }}>
          <p style={{ fontSize: 10, fontWeight: 400, color: '#000000', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10, paddingLeft: 4,  }}>
            Layanan Desa
          </p>

          {DRAWER_MENU.map(item => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setDrawerOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', borderRadius: 12, textDecoration: 'none',
                background: 'transparent',
                marginBottom: 8, transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
              }}
              className="hover:bg-black/5 hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] active:translate-y-0"
            >
              <span style={{
                display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                color: item.color, width: 24,
                
              }}><i className={`fas ${item.icon}`} style={{ fontSize: 20 }} /></span>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 400, color: '#000000', minWidth: 0,  }}>
                {item.label}
              </span>
              <svg width="14" height="14" fill="none" stroke="#000000" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          ))}

          <hr style={{ border: 'none', borderTop: '1px solid rgba(0, 0, 0, 0.08)', margin: '12px 0' }} />

          <a
            href="/dashboard"
            onClick={() => setDrawerOpen(false)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 8, width: '100%', padding: '12px 16px', borderRadius: 12,
              background: 'transparent', color: '#000000',
              fontSize: 14, fontWeight: 400, textDecoration: 'none',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            className="hover:bg-black/5 hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] active:translate-y-0"
          >
            <span>🔐</span> Login Admin Dashboard
          </a>
        </div>

        {/* Drawer footer */}
        <div style={{
          padding: '12px 18px', fontSize: 10, color: '#000000',
          textAlign: 'center', borderTop: '1px solid rgba(0, 0, 0, 0.08)',
          background: 'transparent', flexShrink: 0,
          
        }}>
          Desa Remau Bako Tuo © {new Date().getFullYear()}
        </div>
      </div>
    </>
  );
}

import { Suspense as NavSuspense } from 'react';
export default function BottomNav() {
  return (
    <NavSuspense fallback={null}>
      <BottomNavInner />
    </NavSuspense>
  );
}
