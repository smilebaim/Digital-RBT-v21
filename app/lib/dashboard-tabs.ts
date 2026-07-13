/** URL tab slug (?tab=) → internal legacy tab id */
export const TAB_URL_TO_INTERNAL: Record<string, string> = {
  profil: 'dampak',
  peta: 'peta-operasi',
  pembangunan: 'pengungsi',
  'dana-desa': 'pengungsi',
  indeks: 'bantuan',
};

export const DEFAULT_TAB_URL = 'profil';

export function getInternalTabFromUrl(tabParam: string | null | undefined): string {
  if (tabParam && TAB_URL_TO_INTERNAL[tabParam]) {
    return TAB_URL_TO_INTERNAL[tabParam];
  }
  return TAB_URL_TO_INTERNAL[DEFAULT_TAB_URL];
}
