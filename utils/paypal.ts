import type { SupabaseClient } from '@supabase/supabase-js';

// PayPal pretplate za pakete Starter i Pro.
// Način rada: PAYPAL_MODE=live koristi PAYPAL_CLIENT_ID/SECRET; inače sandbox (PAYPAL_SANDBOX_*).
// Proizvod, planovi i webhook se prave jednom, automatski, i pamte u tabeli billing_config.

export type PaidPlan = 'starter' | 'pro';
export type PaypalMode = 'sandbox' | 'live';

export const PLAN_PRICES: Record<PaidPlan, { eur: string; km: number; name: string }> = {
  starter: { eur: '7.90', km: 15, name: 'POSLO ONE Starter' },
  pro: { eur: '25.90', km: 50, name: 'POSLO ONE Pro' },
};

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://poslo.one').replace(/\/$/, '');
const TRIAL_DAYS = 30;

export function paypalMode(): PaypalMode {
  return process.env.PAYPAL_MODE === 'live' ? 'live' : 'sandbox';
}

function credentials(mode: PaypalMode) {
  const id = mode === 'live' ? process.env.PAYPAL_CLIENT_ID : process.env.PAYPAL_SANDBOX_CLIENT_ID;
  const secret = mode === 'live' ? process.env.PAYPAL_CLIENT_SECRET : process.env.PAYPAL_SANDBOX_CLIENT_SECRET;
  return id && secret ? { id, secret } : null;
}

export const paypalConfigured = () => credentials(paypalMode()) !== null;

const apiBase = (mode: PaypalMode) => (mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com');

let cachedToken: { mode: PaypalMode; token: string; expires: number } | null = null;

async function accessToken(mode: PaypalMode): Promise<string> {
  if (cachedToken && cachedToken.mode === mode && cachedToken.expires > Date.now() + 60_000) return cachedToken.token;
  const creds = credentials(mode);
  if (!creds) throw new Error('PayPal nije podešen.');
  const response = await fetch(`${apiBase(mode)}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${creds.id}:${creds.secret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok || !json.access_token) throw new Error(`PayPal prijava nije uspjela (${response.status}).`);
  cachedToken = { mode, token: json.access_token, expires: Date.now() + Number(json.expires_in || 300) * 1000 };
  return json.access_token;
}

export async function paypalApi<T = Record<string, unknown>>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const mode = paypalMode();
  const token = await accessToken(mode);
  const response = await fetch(`${apiBase(mode)}${path}`, {
    method: init.method || 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: 'no-store',
  });
  const text = await response.text();
  const json = text ? JSON.parse(text) : {};
  if (!response.ok) {
    console.error('PayPal greška', path, response.status, text.slice(0, 500));
    throw new Error(`PayPal zahtjev nije uspio (${response.status}).`);
  }
  return json as T;
}

async function getConfig(admin: SupabaseClient, key: string) {
  const { data } = await admin.from('billing_config').select('value').eq('key', key).maybeSingle();
  return data?.value ? String(data.value) : null;
}

async function setConfig(admin: SupabaseClient, key: string, value: string) {
  const { error } = await admin.from('billing_config').upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) throw error;
}

// Proizvod + dva plana + webhook; svaki se pravi samo ako još ne postoji.
export async function ensurePaypalSetup(admin: SupabaseClient) {
  const mode = paypalMode();
  const k = (name: string) => `paypal:${mode}:${name}`;

  let productId = await getConfig(admin, k('product'));
  if (!productId) {
    const product = await paypalApi<{ id: string }>('/v1/catalogs/products', {
      method: 'POST',
      body: { name: 'POSLO ONE', description: 'Online zakazivanje termina za male firme', type: 'SERVICE', category: 'SOFTWARE', home_url: SITE_URL },
    });
    productId = product.id;
    await setConfig(admin, k('product'), productId);
  }

  const plans: Record<PaidPlan, string> = { starter: '', pro: '' };
  for (const plan of ['starter', 'pro'] as PaidPlan[]) {
    let planId = await getConfig(admin, k(`plan:${plan}`));
    if (!planId) {
      const created = await paypalApi<{ id: string }>('/v1/billing/plans', {
        method: 'POST',
        body: {
          product_id: productId,
          name: PLAN_PRICES[plan].name,
          description: `${PLAN_PRICES[plan].name} - mjesečna pretplata (${PLAN_PRICES[plan].km} KM)`,
          status: 'ACTIVE',
          billing_cycles: [
            {
              frequency: { interval_unit: 'MONTH', interval_count: 1 },
              tenure_type: 'REGULAR',
              sequence: 1,
              total_cycles: 0,
              pricing_scheme: { fixed_price: { value: PLAN_PRICES[plan].eur, currency_code: 'EUR' } },
            },
          ],
          payment_preferences: { auto_bill_outstanding: true, setup_fee_failure_action: 'CONTINUE', payment_failure_threshold: 1 },
        },
      });
      planId = created.id;
      await setConfig(admin, k(`plan:${plan}`), planId);
    }
    plans[plan] = planId;
  }

  if (!(await getConfig(admin, k('webhook')))) {
    try {
      const hook = await paypalApi<{ id: string }>('/v1/notifications/webhooks', {
        method: 'POST',
        body: {
          url: `${SITE_URL}/api/billing/paypal/webhook`,
          event_types: [
            'BILLING.SUBSCRIPTION.ACTIVATED',
            'BILLING.SUBSCRIPTION.UPDATED',
            'BILLING.SUBSCRIPTION.CANCELLED',
            'BILLING.SUBSCRIPTION.SUSPENDED',
            'BILLING.SUBSCRIPTION.EXPIRED',
            'BILLING.SUBSCRIPTION.PAYMENT.FAILED',
            'PAYMENT.SALE.COMPLETED',
          ].map((name) => ({ name })),
        },
      });
      await setConfig(admin, k('webhook'), hook.id);
    } catch (error) {
      // Webhook nije obavezan za prvu uplatu (potvrda ide i preko povratka sa PayPala).
      console.error('PayPal webhook nije napravljen:', error);
    }
  }

  return { productId, plans };
}

export async function planForPaypalPlanId(admin: SupabaseClient, planId: string): Promise<PaidPlan | null> {
  const mode = paypalMode();
  for (const plan of ['starter', 'pro'] as PaidPlan[]) {
    if ((await getConfig(admin, `paypal:${mode}:plan:${plan}`)) === planId) return plan;
  }
  return null;
}

// Nova pretplata: naplata počinje tek kad istekne 30 dana od registracije firme.
export async function createPaypalSubscription(admin: SupabaseClient, businessId: string, plan: PaidPlan, createdAt: string | null) {
  const { plans } = await ensurePaypalSetup(admin);
  const trialEnd = createdAt ? Date.parse(createdAt) + TRIAL_DAYS * 86400000 : 0;
  const startTime = trialEnd > Date.now() + 3600_000 ? new Date(trialEnd).toISOString() : undefined;
  const sub = await paypalApi<{ id: string; links?: { rel: string; href: string }[] }>('/v1/billing/subscriptions', {
    method: 'POST',
    body: {
      plan_id: plans[plan],
      custom_id: businessId,
      ...(startTime ? { start_time: startTime } : {}),
      application_context: {
        brand_name: 'POSLO ONE',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'SUBSCRIBE_NOW',
        return_url: `${SITE_URL}/dashboard/paket?paypal=povratak`,
        cancel_url: `${SITE_URL}/dashboard/paket?paypal=odustao`,
      },
    },
  });
  const approve = sub.links?.find((l) => l.rel === 'approve')?.href;
  if (!approve) throw new Error('PayPal nije vratio link za plaćanje.');
  return { subscriptionId: sub.id, approveUrl: approve };
}

type PaypalSubscription = {
  id: string;
  status: string;
  plan_id: string;
  custom_id?: string;
  start_time?: string;
  billing_info?: { next_billing_time?: string };
};

const STATUS_MAP: Record<string, string> = {
  APPROVAL_PENDING: 'pending',
  APPROVED: 'pending',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
};

// Stanje pretplate se uvijek čita direktno sa PayPala (izvor istine), pa ga lažni zahtjev ne može promijeniti.
export async function syncPaypalSubscription(admin: SupabaseClient, subscriptionId: string, expectedBusinessId?: string) {
  if (!/^I-[A-Z0-9]{6,40}$/.test(subscriptionId)) throw new Error('Neispravan broj pretplate.');
  const sub = await paypalApi<PaypalSubscription>(`/v1/billing/subscriptions/${subscriptionId}`);
  const businessId = sub.custom_id || '';
  if (!businessId || (expectedBusinessId && businessId !== expectedBusinessId)) throw new Error('Pretplata ne pripada ovoj firmi.');
  const plan = await planForPaypalPlanId(admin, sub.plan_id);
  if (!plan) throw new Error('Nepoznat plan.');
  const status = STATUS_MAP[sub.status] || sub.status.toLowerCase();

  const { data: current } = await admin.from('businesses').select('paypal_subscription_id').eq('id', businessId).maybeSingle();
  // Stara pretplata ne smije pregaziti noviju.
  if (current?.paypal_subscription_id && current.paypal_subscription_id !== sub.id && status !== 'active') {
    return { businessId, plan, status, ignored: true };
  }

  const next = sub.billing_info?.next_billing_time || sub.start_time;
  const update: Record<string, unknown> = { paypal_subscription_id: sub.id, billing_status: status };
  if (status === 'active') {
    update.plan = plan;
    if (next) update.plan_until = new Date(Date.parse(next) + 2 * 86400000).toISOString();
  }
  const { error } = await admin.from('businesses').update(update).eq('id', businessId);
  if (error) throw error;
  return { businessId, plan, status, ignored: false };
}

export async function cancelPaypalSubscription(subscriptionId: string) {
  await paypalApi(`/v1/billing/subscriptions/${subscriptionId}/cancel`, { method: 'POST', body: { reason: 'Otkazano iz POSLO ONE panela' } });
}
