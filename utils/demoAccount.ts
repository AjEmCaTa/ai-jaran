// Demo nalog za Google Play pregled smije zakazivati i slati upite samo demo firmi,
// da pregled (ljudi ili roboti) nikad ne napravi lažan termin kod prave firme.
export const DEMO_USER_IDS = new Set(['7d743066-b5d6-4b64-b891-d449eea89644']);
export const DEMO_BUSINESS_SLUG = 'demo-google-pregled';
export const DEMO_BLOCK_MESSAGE =
  'Demo nalog može zakazivati samo u demo salonu (poslo.one/katalog/demo-google-pregled). / The demo account can only book at the demo salon.';

export function isDemoBlocked(userId: string | null | undefined, slug: string | null | undefined): boolean {
  return !!userId && DEMO_USER_IDS.has(userId) && slug !== DEMO_BUSINESS_SLUG;
}

// Klijent: token prijavljenog korisnika iz Supabase sesije (bez novog klijenta).
export function storedAccessToken(): string | null {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i) || '';
      if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
        const token = JSON.parse(localStorage.getItem(key) || 'null')?.access_token;
        if (typeof token === 'string') return token;
      }
    }
  } catch {
    /* privatni mod */
  }
  return null;
}
