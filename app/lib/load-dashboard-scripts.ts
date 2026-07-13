const DASHBOARD_MAIN_SRC = '/js/dashboard-main.js';

const scriptLoadCache = new Map<string, Promise<void>>();
let dashboardScriptsPromise: Promise<void> | null = null;

function isDashboardMainReady(src: string): boolean {
  return (
    src === DASHBOARD_MAIN_SRC &&
    typeof window.__dashboardMainReady === 'boolean' &&
    window.__dashboardMainReady === true
  );
}

function loadScript(src: string): Promise<void> {
  const cached = scriptLoadCache.get(src);
  if (cached) return cached;

  const promise = new Promise<void>((resolve, reject) => {
    let existing = document.querySelector(
      `script[src="${src}"]`
    ) as HTMLScriptElement | null;

    if (existing?.dataset.loaded === 'true' && isDashboardMainReady(src)) {
      resolve();
      return;
    }

    if (existing?.dataset.loaded === 'true' && !isDashboardMainReady(src)) {
      existing.remove();
      scriptLoadCache.delete(src);
      existing = null;
    }

    if (existing?.isConnected) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener(
        'error',
        () => reject(new Error(`Failed to load script: ${src}`)),
        { once: true }
      );
      return;
    }

    const s = document.createElement('script');
    s.src = src;
    s.async = false;
    s.onload = () => {
      s.dataset.loaded = 'true';
      resolve();
    };
    s.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(s);
  });

  scriptLoadCache.set(src, promise);
  return promise;
}

async function loadDashboardScriptsOnce(): Promise<void> {
  await loadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js');
  await loadScript('https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js');
  await loadScript('https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js');
  await loadScript(
    'https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0/dist/chartjs-plugin-datalabels.min.js'
  );
  await loadScript('/js/dashboard-data.js');
  await loadScript(DASHBOARD_MAIN_SRC);

  if (!isDashboardMainReady(DASHBOARD_MAIN_SRC)) {
    throw new Error('dashboard-main.js did not initialize');
  }
}

/** Load legacy dashboard scripts once; safe to call multiple times. */
export function ensureDashboardScripts(): Promise<void> {
  if (!dashboardScriptsPromise) {
    dashboardScriptsPromise = loadDashboardScriptsOnce().catch((e) => {
      dashboardScriptsPromise = null;
      throw e;
    });
  }
  return dashboardScriptsPromise;
}

/** Stubs for inline onclick handlers before dashboard-main.js attaches real handlers. */
export function installDashboardStubs(): void {
  const noop = () => {};
  const stubs = [
    'refreshData', 'switchTab', 'focusMapOnCategory', 'changeSektorPage',
    'applyFilter', 'resetFilters', 'toggleLayer', 'toggleFaskesLayer',
    'togglePolygonLayer', 'applyCluster6Filter', 'changePolygonLevel',
    'searchPolygon', 'onBantuanFilterChange', 'renderBantuanTable',
    'slideOrangHilang', 'toggleMobileMenu', 'switchTabMobile', 'toggleLayerControl',
    'switchInstitutionTab',
  ];
  stubs.forEach((fn) => {
    if (typeof (window as unknown as Record<string, unknown>)[fn] !== 'function') {
      (window as unknown as Record<string, () => void>)[fn] = noop;
    }
  });
}
