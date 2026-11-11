// Planiranje sljedećeg mejla u nizu. Čista funkcija, bez baze.

export type PlanStep = { id: string; position: number; delay_days: number; enabled: boolean };

const DAY = 86400000;
export const STALE_DAYS = 14; // korak zakasnio više od ovoga se preskače
export const MIN_GAP_HOURS = 20; // najviše jedan marketing mejl istom kontaktu u ovom razmaku

// Od dospjelih, a još neobrađenih koraka šalje se samo najnoviji; stariji se preskaču
// (da kontakt koji kasnije uđe u niz ne dobije pet mejlova zaredom).
export function planNext(steps: PlanStep[], startedAt: string, handled: Set<string>, now: number) {
  const start = Date.parse(startedAt);
  const due = steps
    .filter((s) => s.enabled && !handled.has(s.id) && start + s.delay_days * DAY <= now)
    .sort((a, b) => a.position - b.position);
  if (due.length === 0) return { send: null as PlanStep | null, skip: [] as PlanStep[] };
  const last = due[due.length - 1];
  const stale = now - (start + last.delay_days * DAY) > STALE_DAYS * DAY;
  return { send: stale ? null : last, skip: stale ? due : due.slice(0, -1) };
}

export function recentlyMailed(lastSentAt: string | null | undefined, now: number) {
  return !!lastSentAt && now - Date.parse(lastSentAt) < MIN_GAP_HOURS * 3600000;
}

// Početak dana po bosanskom vremenu (za dnevni limit).
export function startOfLocalDay(now: number, timeZone = 'Europe/Sarajevo'): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false }).formatToParts(new Date(now));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  // Razlika lokalnog i UTC vremena u satima (CET +1 / CEST +2).
  const localHour = get('hour') % 24;
  const utcHour = new Date(now).getUTCHours();
  let offset = localHour - utcHour;
  if (offset > 12) offset -= 24;
  if (offset < -12) offset += 24;
  const midnightUtc = Date.UTC(get('year'), get('month') - 1, get('day')) - offset * 3600000;
  return new Date(midnightUtc).toISOString();
}
