// Postavke panela (boja, link za rezervacije, mjesečni cilj, prikaz termina, zvonce)
// čuvaju se lokalno radi brzine, ali se sinhronizuju s nalogom firme na serveru,
// pa su iste u Safariju, aplikaciji na početnom ekranu i na računaru.

const SYNC_PREFIXES = ['poslo-theme', 'poslo-booking-link:', 'poslo-monthly-goal:', 'poslo-last-seen:', 'poslo-reservations-view'];
export const isSyncedKey = (key: string) => SYNC_PREFIXES.some((p) => key === p || key.startsWith(p));
const isSeenKey = (key: string) => key.startsWith('poslo-last-seen:');

type TokenGetter = () => Promise<string | null>;
let tokenGetter: TokenGetter | null = null;
let pending: Record<string, string> = {};
let timer: ReturnType<typeof setTimeout> | null = null;

export function registerPrefsSync(getToken: TokenGetter) {
  tokenGetter = getToken;
}

async function flush() {
  timer = null;
  const batch = pending;
  pending = {};
  if (!tokenGetter || Object.keys(batch).length === 0) return;
  try {
    const token = await tokenGetter();
    if (!token) return;
    await fetch('/api/dashboard/prefs', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ prefs: batch }),
      keepalive: true,
    });
  } catch {
    /* bez mreže: ostaje lokalno, pošalje se pri sljedećoj promjeni */
    pending = { ...batch, ...pending };
  }
}

function queue(key: string, value: string) {
  if (!isSyncedKey(key)) return;
  pending[key] = value;
  if (timer) clearTimeout(timer);
  timer = setTimeout(flush, 800);
}

// Zapiši postavku lokalno i pošalji je na nalog.
export function setPref(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* privatni mod */
  }
  queue(key, value);
}

// Povuci postavke s naloga. Vraća true ako se nešto lokalno promijenilo.
export async function pullPrefs(getToken: TokenGetter): Promise<boolean> {
  registerPrefsSync(getToken);
  try {
    const token = await getToken();
    if (!token) return false;
    const response = await fetch('/api/dashboard/prefs', { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
    if (!response.ok) return false;
    const result = await response.json().catch(() => ({}));
    if (result.unavailable) return false;
    const server: Record<string, string> = result.prefs && typeof result.prefs === 'object' ? result.prefs : {};

    let changed = false;
    const local: Record<string, string> = {};
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key && isSyncedKey(key)) local[key] = window.localStorage.getItem(key) ?? '';
    }

    for (const [key, value] of Object.entries(server)) {
      if (!isSyncedKey(key) || typeof value !== 'string') continue;
      if (isSeenKey(key) && Number(local[key] || 0) > Number(value || 0)) continue; // zvonce: noviji pregled pobjeđuje
      if (local[key] !== value) {
        window.localStorage.setItem(key, value);
        changed = true;
      }
    }
    // Što postoji samo na ovom uređaju (npr. prva sinhronizacija), pošalji na nalog.
    for (const [key, value] of Object.entries(local)) {
      if (!(key in server) || (isSeenKey(key) && Number(value || 0) > Number(server[key] || 0))) queue(key, value);
    }
    return changed;
  } catch {
    return false;
  }
}
