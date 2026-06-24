'use client';

import { usePathname, useSearchParams, useRouter } from 'next/navigation';

const TABS = [
  { id: 'dampak',        label: 'Profil',       icon: 'fa-id-card'      },
  { id: 'peta-operasi',  label: 'Peta',         icon: 'fa-map-marked-alt' },
  { id: 'pengungsi',     label: 'Pembangunan',  icon: 'fa-hammer'       },
  { id: 'bantuan',       label: 'Indeks',       icon: 'fa-chart-line'   },
];

export default function BottomNav() {
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const router       = useRouter();

  const currentTab  = searchParams?.get('tab') ?? '';
  const isDashboard = pathname === '/dashboard';

  const handleClick = (tabId: string) => {
    if (isDashboard) {
      // Sudah di halaman dashboard — switch tab langsung + update URL
      const switchTab = (window as any).switchTab;
      if (typeof switchTab === 'function') {
        switchTab(tabId);
      }
      // Ganti URL query tanpa full-reload (Next.js shallow push)
      router.push(`/dashboard?tab=${tabId}`, { scroll: false });
    } else {
      // Dari halaman lain → navigasi ke dashboard dengan tab yang dipilih
      router.push(`/dashboard?tab=${tabId}`);
    }
  };

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 99999,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          background: 'rgba(18, 18, 18, 0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 50,
          padding: '7px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.3)',
          pointerEvents: 'all',
        }}
      >
        {TABS.map((tab) => {
          const isActive = isDashboard && currentTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`global-nav-${tab.id}`}
              onClick={() => handleClick(tab.id)}
              title={tab.label}
              style={{
                background: isActive ? '#1a5c2e' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                borderRadius: 40,
                padding: '9px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                color: isActive ? '#fff' : 'rgba(255,255,255,0.52)',
                transition: 'background 0.18s, color 0.18s, transform 0.12s',
                fontFamily: 'Inter, sans-serif',
                outline: 'none',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.10)';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.52)';
                }
              }}
            >
              <i className={`fas ${tab.icon}`} style={{ fontSize: 15, lineHeight: 1 }} />
              <span style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
