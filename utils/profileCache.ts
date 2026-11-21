// Javni profil firme se učitava samo jednom po otvaranju stranice: /katalog/[slug] ga koristi da
// odluči je li riječ o firmi, a stranica za zakazivanje odmah dobije isti odgovor (bez drugog čekanja).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Profile = any;

const cache = new Map<string, { at: number; promise: Promise<Profile | null> }>();
const TTL = 30_000;

export function loadBusinessProfile(slug: string): Promise<Profile | null> {
  const hit = cache.get(slug);
  if (hit && Date.now() - hit.at < TTL) return hit.promise;
  const promise = fetch(`/api/business-profile?slug=${encodeURIComponent(slug)}`, { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
  cache.set(slug, { at: Date.now(), promise });
  promise.then((v) => { if (v === null) cache.delete(slug); });
  return promise;
}
