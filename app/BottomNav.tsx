'use client';

import { usePathname, useSearchParams, useRouter } from 'next/navigation';

const TABS = [
  { id: 'profil',       internalId: 'dampak',        label: 'Profil',       icon: 'fa-id-card'      },
  { id: 'peta',         internalId: 'peta-operasi',  label: 'Peta',         icon: 'fa-map-marked-alt' },
  { id: 'pembangunan',  internalId: 'pengungsi',     label: 'Pembangunan',  icon: 'fa-hammer'       },
  { id: 'indeks',       internalId: 'bantuan',       label: 'Indeks',       icon: 'fa-chart-line'   },
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
        const tabDef = TABS.find(t => t.id === tabId);
        if (tabDef) switchTab(tabDef.internalId);
      }
      router.push(`/dashboard?tab=${tabId}`, { scroll: false });
    } else {
      // Dari halaman lain → gunakan full reload agar script legacy di dashboard berjalan sempurna
      window.location.href = `/dashboard?tab=${tabId}`;
    }
  };

  return (
    <nav className="fixed bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-[99999] pointer-events-none w-[90%] sm:w-auto max-w-[400px] sm:max-w-[700px]">
      <div 
        className="bg-[#121212eb] border border-white/10 rounded-full p-1 sm:p-2 flex items-center justify-between shadow-2xl pointer-events-auto sm:gap-2"
        style={{
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {TABS.map((tab) => {
          const isActive = isDashboard && currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleClick(tab.id)}
              className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-3 px-2 py-1.5 sm:px-6 sm:py-2.5 rounded-full transition-all duration-200 outline-none flex-1 sm:flex-none ${
                isActive
                  ? 'bg-[#1a5c2e] text-white'
                  : 'bg-transparent text-white/50 hover:bg-white/10 hover:text-white/90'
              }`}
            >
              <i className={`fas ${tab.icon} text-[14px] sm:text-[16px]`}></i>
              <span className="text-[9px] sm:text-[13px] font-semibold whitespace-nowrap">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
