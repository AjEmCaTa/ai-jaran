// Paketi: u prvih 30 dana svaka firma sama postavi usluge, cijene i radno vrijeme.
// Poslije toga ih mijenja samo Pro; Starter ih zadržava kako su postavljeni.

export type Plan = 'starter' | 'pro';

export const normalizePlan = (value: unknown): Plan => (value === 'starter' ? 'starter' : 'pro');

export const SETUP_DAYS = 30;

// Kraj perioda u kojem Starter može sam urediti usluge i radno vrijeme.
export const setupEndsAt = (createdAt: unknown) => {
  const t = typeof createdAt === 'string' ? Date.parse(createdAt) : NaN;
  return Number.isFinite(t) ? t + SETUP_DAYS * 86400000 : 0;
};

export const canEditCatalogData = (plan: unknown, createdAt?: unknown, now = Date.now()) =>
  normalizePlan(plan) === 'pro' || setupEndsAt(createdAt) > now;

// Polja podataka firme koja Starter ne smije mijenjati.
export const PRO_ONLY_BUSINESS_FIELDS = ['work_start', 'work_end', 'work_days', 'closed_dates'] as const;

export const PLAN_LOCK_MESSAGE = 'Na Starter paketu usluge, cijene i radno vrijeme su zaključani. Pređite na Pro da ih mijenjate.';
