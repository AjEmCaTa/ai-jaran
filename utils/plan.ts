// Paketi: Starter vidi i obrađuje termine i upite; Pro uz to sam uređuje usluge, cijene i radno vrijeme.
// Naplata (Lemon Squeezy) još nije povezana: istek paketa se zato još ne provodi.

export type Plan = 'starter' | 'pro';

export const normalizePlan = (value: unknown): Plan => (value === 'starter' ? 'starter' : 'pro');

export const canEditCatalogData = (plan: unknown) => normalizePlan(plan) === 'pro';

// Polja podataka firme koja Starter ne smije mijenjati.
export const PRO_ONLY_BUSINESS_FIELDS = ['work_start', 'work_end', 'work_days', 'closed_dates'] as const;

export const PLAN_LOCK_MESSAGE = 'Ovo je dostupno u Pro paketu. Za izmjenu nas kontaktirajte ili pređite na Pro.';
