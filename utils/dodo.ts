import crypto from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

// Dodo Payments: mjesečna pretplata karticom, Apple Pay ili Google Pay (cijene u KM).
// Dodo je zvanični prodavac (merchant of record): naplaćuje, izdaje račun i obračunava porez.
// Ključevi su samo na serveru (Vercel varijable), nikad u pregledniku.

export type DodoPlan = 'starter' | 'pro';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://poslo.one').replace(/\/$/, '');
export const TRIAL_DAYS = 30;

const env = (name: string) => process.env[name]?.trim() || '';
const apiKey = () => env('DODO_PAYMENTS_API_KEY');
const baseUrl = () => (env('DODO_PAYMENTS_ENVIRONMENT') === 'live_mode' ? 'https://live.dodopayments.com' : 'https://test.dodopayments.com');
export const dodoTestMode = () => env('DODO_PAYMENTS_ENVIRONMENT') !== 'live_mode';

export const productFor = (plan: DodoPlan) => env(plan === 'pro' ? 'DODO_PRODUCT_PRO' : 'DODO_PRODUCT_STARTER');
export const planForProduct = (productId: unknown): DodoPlan | null => {
  const id = String(productId || '');
  if (id && id === productFor('pro')) return 'pro';
  if (id && id === productFor('starter')) return 'starter';
  return null;
};

export const dodoConfigured = () => Boolean(apiKey() && productFor('starter') && productFor('pro'));

async function dodo<T = unknown>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const response = await fetch(`${baseUrl()}${path}`, {
    method: init.method || 'GET',
    headers: { Authorization: `Bearer ${apiKey()}`, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: 'no-store',
  });
  const text = await response.text();
  if (!response.ok) {
    console.error('Dodo greška', init.method || 'GET', path, response.status, text.slice(0, 400));
    throw new Error(`Dodo zahtjev nije uspio (${response.status}).`);
  }
  return (text ? JSON.parse(text) : {}) as T;
}

// Dodo kupca firme pamtimo u billing_config (bez nove kolone u bazi).
const customerKey = (businessId: string) => `dodo:customer:${businessId}`;
async function getConfig(admin: SupabaseClient, key: string) {
  const { data } = await admin.from('billing_config').select('value').eq('key', key).maybeSingle();
  return data?.value ? String(data.value) : null;
}
async function setConfig(admin: SupabaseClient, key: string, value: string) {
  const { error } = await admin.from('billing_config').upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) throw error;
}

// Preostali besplatni dani: 30 od registracije firme; ko je već imao pretplatu, nema novu probu.
export function trialDaysLeft(createdAt: string | null | undefined, hadSubscription: boolean, now = Date.now()) {
  if (hadSubscription || !createdAt) return hadSubscription ? 0 : TRIAL_DAYS;
  const used = Math.floor((now - Date.parse(createdAt)) / 86400000);
  return Math.max(0, Math.min(TRIAL_DAYS, TRIAL_DAYS - used));
}

export async function createDodoCheckout(
  admin: SupabaseClient,
  business: { id: string; name: string | null; owner_email: string | null; created_at: string | null; billing_subscription_id: string | null },
  plan: DodoPlan,
) {
  const hadSubscription = Boolean(business.billing_subscription_id) || Boolean(await getConfig(admin, customerKey(business.id)));
  const trial = trialDaysLeft(business.created_at, hadSubscription);
  const customerId = await getConfig(admin, customerKey(business.id));
  const res = await dodo<{ session_id: string; checkout_url: string | null }>('/checkouts', {
    method: 'POST',
    body: {
      product_cart: [{ product_id: productFor(plan), quantity: 1 }],
      customer: customerId
        ? { customer_id: customerId }
        : { email: business.owner_email || undefined, name: business.name || undefined },
      billing_address: { country: 'BA' },
      billing_currency: 'BAM',
      subscription_data: { trial_period_days: trial },
      metadata: { business_id: business.id, plan },
      return_url: `${SITE_URL}/dashboard/paket?placanje=povratak`,
      cancel_url: `${SITE_URL}/dashboard/paket?placanje=odustao`,
      customization: { force_language: 'bs' },
    },
  });
  if (!res.checkout_url) throw new Error('Dodo nije vratio link za plaćanje.');
  return { url: res.checkout_url, trialDays: trial };
}

// Standard Webhooks potpis: base64(HMAC-SHA256(secret, "id.timestamp.body")), zaglavlje "v1,<potpis> ...".
export function verifyDodoSignature(rawBody: string, headers: { id: string | null; timestamp: string | null; signature: string | null }, now = Date.now()) {
  const secret = env('DODO_PAYMENTS_WEBHOOK_KEY');
  const { id, timestamp, signature } = headers;
  if (!secret || !id || !timestamp || !signature) return false;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(now / 1000 - ts) > 5 * 60) return false;
  const key = Buffer.from(secret.startsWith('whsec_') ? secret.slice(6) : secret, 'base64');
  const expected = crypto.createHmac('sha256', key).update(`${id}.${timestamp}.${rawBody}`).digest('base64');
  const want = Buffer.from(expected);
  return signature.split(' ').some((part) => {
    const [version, sig] = part.split(',');
    if (version !== 'v1' || !sig) return false;
    const got = Buffer.from(sig);
    return got.length === want.length && crypto.timingSafeEqual(got, want);
  });
}

export type DodoSubscription = {
  subscription_id: string;
  status: string;
  product_id?: string;
  customer?: { customer_id?: string; email?: string };
  metadata?: Record<string, unknown>;
  next_billing_date?: string;
  cancel_at_next_billing_date?: boolean;
  expires_at?: string | null;
};

const STATUS: Record<string, string> = {
  active: 'active',
  pending: 'pending',
  on_hold: 'suspended',
  past_due: 'suspended',
  paused: 'suspended',
  cancelled: 'cancelled',
  failed: 'expired',
  expired: 'expired',
};
export const mapDodoStatus = (status: string) => STATUS[status] || status || 'unknown';

// Primjena pretplate (iz potpisanog webhooka ili svježe pročitane) na firmu.
export async function applyDodoSubscription(admin: SupabaseClient, businessId: string, sub: DodoSubscription) {
  const status = sub.cancel_at_next_billing_date && sub.status === 'active' ? 'cancelled' : mapDodoStatus(sub.status);
  const plan = planForProduct(sub.product_id);

  const { data: current } = await admin.from('businesses').select('billing_subscription_id, billing_status').eq('id', businessId).maybeSingle();
  // Stara pretplata ne smije ugasiti novu, aktivnu.
  if (current?.billing_status === 'active' && current.billing_subscription_id && current.billing_subscription_id !== sub.subscription_id && status !== 'active') {
    return { ignored: true, status };
  }

  const until = sub.next_billing_date || sub.expires_at || null;
  const update: Record<string, unknown> = {
    billing_provider: 'dodo',
    billing_subscription_id: sub.subscription_id,
    billing_status: status,
    billing_portal_url: null,
  };
  if (until) update.plan_until = new Date(Date.parse(until) + 2 * 86400000).toISOString();
  if ((status === 'active' || status === 'cancelled') && plan) update.plan = plan;
  const { error } = await admin.from('businesses').update(update).eq('id', businessId);
  if (error) throw error;
  if (sub.customer?.customer_id) await setConfig(admin, customerKey(businessId), sub.customer.customer_id);
  return { ignored: false, status, plan };
}

export async function refreshDodoSubscription(admin: SupabaseClient, businessId: string) {
  const { data } = await admin.from('businesses').select('billing_subscription_id, billing_provider').eq('id', businessId).maybeSingle();
  const id = data?.billing_subscription_id;
  if (!id || data?.billing_provider !== 'dodo' || !/^[A-Za-z0-9_-]{4,64}$/.test(String(id))) return null;
  const sub = await dodo<DodoSubscription>(`/subscriptions/${encodeURIComponent(id)}`);
  return applyDodoSubscription(admin, businessId, sub);
}

// Portal kupca: kartica, računi, otkazivanje (link važi 24 sata).
export async function dodoPortalLink(admin: SupabaseClient, businessId: string) {
  const customerId = await getConfig(admin, customerKey(businessId));
  if (!customerId) return null;
  const res = await dodo<{ link: string }>(`/customers/${encodeURIComponent(customerId)}/customer-portal/session?return_url=${encodeURIComponent(`${SITE_URL}/dashboard/paket`)}`, { method: 'POST' });
  return res.link || null;
}

// Promjena paketa (Starter <-> Pro) na postojećoj pretplati, s obračunom razlike odmah.
export async function changeDodoPlan(admin: SupabaseClient, businessId: string, plan: DodoPlan) {
  const { data } = await admin.from('businesses').select('billing_subscription_id, billing_provider').eq('id', businessId).maybeSingle();
  const id = data?.billing_subscription_id;
  if (!id || data?.billing_provider !== 'dodo') return false;
  await dodo(`/subscriptions/${encodeURIComponent(id)}/change-plan`, {
    method: 'POST',
    body: { product_id: productFor(plan), quantity: 1, proration_billing_mode: 'prorated_immediately' },
  });
  await refreshDodoSubscription(admin, businessId);
  return true;
}
