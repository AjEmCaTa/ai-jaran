// "Poslovi": upiti koje firma vodi kao posao (ponuda, avans, naplata, troškovi).
// Za firme koje rade po upitima (građevina i sl.). Čista logika, bez baze, da se može testirati.

export const JOB_STAGES = ['new', 'contacted', 'offer', 'agreed', 'done', 'lost'] as const;
export type JobStage = (typeof JOB_STAGES)[number];

export const STAGE_LABEL: Record<JobStage, string> = {
  new: 'Novi',
  contacted: 'Kontaktiran',
  offer: 'Ponuda poslana',
  agreed: 'Dogovoreno',
  done: 'Završeno',
  lost: 'Odbijeno',
};

// Sljedeći korak jednim dodirom.
export const NEXT_STAGE: Partial<Record<JobStage, JobStage>> = {
  new: 'contacted',
  contacted: 'offer',
  offer: 'agreed',
  agreed: 'done',
};

export type JobRow = {
  status?: string | null;
  stage?: string | null;
  quote?: number | string | null;
  deposit?: number | string | null;
  paid?: number | string | null;
  costs?: number | string | null;
  created_at?: string | null;
  finished_on?: string | null;
};

export const isStage = (v: unknown): v is JobStage => typeof v === 'string' && (JOB_STAGES as readonly string[]).includes(v);

// Stari upiti nemaju fazu: "Novi" ostaje novi, "Riješen" postaje "Kontaktiran".
export function stageOf(row: JobRow): JobStage {
  if (isStage(row.stage)) return row.stage;
  return row.status === 'handled' ? 'contacted' : 'new';
}

// Stara kolona status (Novi/Riješen) prati fazu, da obavijesti i brojač novih upita rade kao prije.
export const statusForStage = (stage: JobStage) => (stage === 'new' ? 'new' : 'handled');

export const num = (v: unknown) => {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

// Iznos iz forme: prazno = null, inače broj 0..100 000 000 s najviše 2 decimale.
export function parseMoney(v: unknown): number | null | undefined {
  if (v === null || v === undefined) return null;
  const raw = String(v).trim().replace(/\s/g, '').replace(',', '.');
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > 100_000_000) return undefined;
  return Math.round(n * 100) / 100;
}

export function parseDay(v: unknown): string | null | undefined {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return undefined;
  return Number.isNaN(Date.parse(`${v}T00:00:00Z`)) ? undefined : v;
}

// Koliko klijent još duguje: kod dogovorenog posla ponuda minus avans; kod završenog naplaćeno ide kao konačno.
export function owedOf(row: JobRow): number {
  const stage = stageOf(row);
  if (stage !== 'agreed') return 0;
  return Math.max(0, num(row.quote) - num(row.deposit));
}

export const profitOf = (row: JobRow) => num(row.paid) - num(row.costs);

// Završen posao se računa u mjesec završetka (ako nije upisan, u mjesec upita).
function doneDate(row: JobRow): Date | null {
  const raw = row.finished_on ? `${row.finished_on}T12:00:00` : row.created_at;
  const d = raw ? new Date(raw) : null;
  return d && !Number.isNaN(d.getTime()) ? d : null;
}

export function summarizeJobs(rows: JobRow[], now = new Date()) {
  const y = now.getFullYear();
  const m = now.getMonth();
  const out = {
    monthRevenue: 0,
    monthProfit: 0,
    monthDone: 0,
    yearRevenue: 0,
    yearProfit: 0,
    yearDone: 0,
    avgPerJob: 0,
    owed: 0,
    open: 0,
    won: 0,
    total: rows.length,
  };
  for (const r of rows) {
    const stage = stageOf(r);
    if (stage === 'agreed' || stage === 'done') out.won += 1;
    if (stage === 'new' || stage === 'contacted' || stage === 'offer' || stage === 'agreed') out.open += 1;
    out.owed += owedOf(r);
    if (stage !== 'done') continue;
    const d = doneDate(r);
    if (!d || d.getFullYear() !== y) continue;
    out.yearRevenue += num(r.paid);
    out.yearProfit += profitOf(r);
    out.yearDone += 1;
    if (d.getMonth() === m) {
      out.monthRevenue += num(r.paid);
      out.monthProfit += profitOf(r);
      out.monthDone += 1;
    }
  }
  out.avgPerJob = out.yearDone ? Math.round((out.yearRevenue / out.yearDone) * 100) / 100 : 0;
  return out;
}

// Ko vidi "Poslove": ručni izbor firme ima prednost; inače građevina ili firma kojoj su sve usluge "na upit".
export function jobsEnabled(
  business: { jobs_mode?: string | null; category?: string | null },
  services: { price_on_request?: boolean | null }[],
  categoryOf: (value: unknown) => string,
) {
  if (business.jobs_mode === 'on') return true;
  if (business.jobs_mode === 'off') return false;
  if (categoryOf(business.category) === 'gradjevina-i-radovi') return true;
  return services.length > 0 && services.every((s) => s.price_on_request === true);
}
