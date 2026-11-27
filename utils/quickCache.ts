// Kratki keš u sessionStorage (samo ovaj tab): stranica se odmah prikaže sa zadnjim podacima,
// a svježi podaci stignu u pozadini. Nikad se ne koristi za plaćanja ni za slobodne termine.
const PREFIX = 'pq:';

export function readQuick<T>(key: string, maxAgeMs = 10 * 60_000): T | null {
  try {
    const raw = window.sessionStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at: number; v: T };
    if (!parsed || typeof parsed.at !== 'number' || Date.now() - parsed.at > maxAgeMs) return null;
    return parsed.v;
  } catch {
    return null;
  }
}

export function writeQuick(key: string, value: unknown) {
  try {
    window.sessionStorage.setItem(PREFIX + key, JSON.stringify({ at: Date.now(), v: value }));
  } catch {
    /* pun ili zabranjen storage: samo bez keša */
  }
}

// Trajni keš na ovom uređaju (localStorage): za podatke koji se trebaju pokazati odmah i nakon ponovnog
// otvaranja aplikacije (npr. kartica firme, brojevi na profilu), da ekran ne "poskoči" kad stignu svježi.
export function readKeep<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw ? ((JSON.parse(raw) as { v: T }).v ?? null) : null;
  } catch {
    return null;
  }
}

export function writeKeep(key: string, value: unknown) {
  try {
    if (value === null || value === undefined) window.localStorage.removeItem(PREFIX + key);
    else window.localStorage.setItem(PREFIX + key, JSON.stringify({ at: Date.now(), v: value }));
  } catch {
    /* bez keša */
  }
}
