// Ko mora izabrati paket prije korištenja panela.
// Firme registrovane prije uvođenja obaveznog plaćanja nastavljaju kao do sada.
export const BILLING_REQUIRED_FROM = process.env.BILLING_REQUIRED_FROM?.trim() || '2026-11-23T00:00:00Z';

export type BillingRow = {
  created_at?: string | null;
  billing_status?: string | null;
  billing_provider?: string | null;
  plan_until?: string | null;
};

export function hasPaidAccess(row: BillingRow, now = Date.now()) {
  if (row.billing_status === 'active') return true;
  if (row.billing_provider === 'bank') return true; // izabrao uplatnicu; potvrdu uplate radi administrator
  if (row.billing_status === 'cancelled' && row.plan_until && Date.parse(row.plan_until) > now) return true;
  return false;
}

export function requiresPaymentSetup(row: BillingRow, enabled: boolean, now = Date.now()) {
  if (!enabled) return false;
  if (!row.created_at || Date.parse(row.created_at) < Date.parse(BILLING_REQUIRED_FROM)) return false;
  return !hasPaidAccess(row, now);
}

// Poziv na broj za uplatnicu: kratak i jedinstven po firmi.
export const bankReference = (businessId: string) => `PO-${businessId.replace(/-/g, '').slice(0, 8).toUpperCase()}`;

export const BANK_KEYS = ['recipient', 'address', 'account', 'bank', 'iban', 'swift'] as const;
export type BankDetails = Partial<Record<(typeof BANK_KEYS)[number], string>>;
