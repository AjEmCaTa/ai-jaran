// Javni profil firme se učitava jednom i čuva kratko: /katalog/[slug] ga koristi da odluči je li riječ
// o firmi, a stranica za zakazivanje odmah dobije isti odgovor (bez drugog čekanja).
// Dodir na firmu (prije nego se prst digne) već pokrene učitavanje, pa je stranica brža.
import { readQuick, writeQuick } from './quickCache';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Profile = any;

const cache = new Map<string, { at: number; promise: Promise<Profile | null> }>();
const TTL = 120_000;

export function loadBusinessProfile(slug: string): Promise<Profile | null> {
  const hit = cache.get(slug);
  if (hit && Date.now() - hit.at < TTL) return hit.promise;
  const promise = fetch(`/api/business-profile?slug=${encodeURIComponent(slug)}`, { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
  cache.set(slug, { at: Date.now(), promise });
  promise.then((v) => {
    if (v === null) cache.delete(slug);
    else writeQuick(`isfirm:${slug}`, Boolean(v?.business));
  });
  return promise;
}

export const prefetchBusinessProfile = (slug: string) => {
  void loadBusinessProfile(slug);
};

// Je li ova adresa firma (true), djelatnost (false) ili još ne znamo (null), bez čekanja na mrežu.
export function knownIsFirm(slug: string): boolean | null {
  return readQuick<boolean>(`isfirm:${slug}`, 24 * 60 * 60_000);
}
