import crypto from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

// Lemon Squeezy pretplate (kartica ili PayPal na njihovoj stranici, cijene u KM).
// Paketi se prave ručno u Lemon Squeezy panelu ("POSLO ONE Starter", "POSLO ONE Pro");
// prodavnica, varijante i webhook se pronađu/naprave automatski i pamte u billing_config.

export type LsPlan = 'starter' | 'pro';

const API = 'https://api.lemonsqueezy.com/v1';
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://poslo.one').replace(/\/$/, '');
const apiKey = () => process.env.LEMONSQUEEZY_API_KEY?.trim() || '';

export const lemonConfigured = () => apiKey().length > 0;

type JsonApi<T = Record<string, unknown>> = { data: T; meta?: Record<string, unknown> };

async function ls<T = unknown>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    method: init.method || 'GET',
    headers: {
      Accept: 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
      Authorization: `Bearer ${apiKey()}`,
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: 'no-store',
  });
  const text = await response.text();
  if (!response.ok) {
    console.error('Lemon Squeezy greška', init.method || 'GET', path, response.status, text.slice(0, 400));
    throw new Error(`Lemon Squeezy zahtjev nije uspio (${response.status}).`);
  }
  return (text ? JSON.parse(text) : {}) as T;
}

async function getConfig(admin: SupabaseClient, key: string) {
  const { data } = await admin.from('billing_config').select('value').eq('key', key).maybeSingle();
  return data?.value ? String(data.value) : null;
}
async function setConfig(admin: SupabaseClient, key: string, value: string) {
  const { error } = await admin.from('billing_config').upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) throw error;
}

type Item = { id: string; attributes: Record<string, unknown> };

export class LemonSetupError extends Error {}

export async function ensureLemonSetup(admin: SupabaseClient) {
  let storeId = await getConfig(admin, 'ls:store');
  if (!storeId) {
    const stores = await ls<JsonApi<Item[]>>('/stores');
    if (!stores.data?.length) throw new LemonSetupError('Lemon Squeezy prodavnica nije pronađena.');
    storeId = stores.data[0].id;
    await setConfig(admin, 'ls:store', storeId);
  }

  const variants: Record<LsPlan, string> = { starter: '', pro: '' };
  for (const plan of ['starter', 'pro'] as LsPlan[]) {
    variants[plan] = (await getConfig(admin, `ls:variant:${plan}`)) || '';
  }
  if (!variants.starter || !variants.pro) {
    const products = await ls<JsonApi<Item[]>>(`/products?filter[store_id]=${storeId}&page[size]=50`);
    for (const p of products.data || []) {
      const name = String(p.attributes.name || '').toLowerCase();
      const plan: LsPlan | null = name.includes('starter') ? 'starter' : name.includes('pro') ? 'pro' : null;
      if (!plan || variants[plan]) continue;
      const vs = await ls<JsonApi<Item[]>>(`/variants?filter[product_id]=${p.id}`);
      const variant = (vs.data || []).find((v) => v.attributes.is_subscription !== false) || vs.data?.[0];
      if (variant) {
        variants[plan] = variant.id;
        await setConfig(admin, `ls:variant:${plan}`, variant.id);
      }
    }
    if (!variants.starter || !variants.pro) {
      throw new LemonSetupError('U Lemon Squeezyju nedostaju paketi "POSLO ONE Starter" i/ili "POSLO ONE Pro".');
    }
  }

  if (!(await getConfig(admin, 'ls:webhook_secret'))) {
    const secret = crypto.randomBytes(24).toString('hex');
    await ls('/webhooks', {
      method: 'POST',
      body: {
        data: {
          type: 'webhooks',
          attributes: {
            url: `${SITE_URL}/api/billing/lemonsqueezy/webhook`,
            events: [
              'subscription_created',
              'subscription_updated',
              'subscription_cancelled',
              'subscription_resumed',
              'subscription_expired',
              'subscription_paused',
              'subscription_unpaused',
              'subscription_payment_success',
              'subscription_payment_failed',
            ],
            secret,
          },
          relationships: { store: { data: { type: 'stores', id: storeId } } },
        },
      },
    });
    await setConfig(admin, 'ls:webhook_secret', secret);
  }

  return { storeId, variants };
}

export async function createLemonCheckout(admin: SupabaseClient, businessId: string, plan: LsPlan, email: string | null, name: string | null) {
  const { storeId, variants } = await ensureLemonSetup(admin);
  const res = await ls<JsonApi<Item>>('/checkouts', {
    method: 'POST',
    body: {
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: {
            ...(email ? { email } : {}),
            ...(name ? { name } : {}),
            custom: { business_id: businessId },
          },
          product_options: { redirect_url: `${SITE_URL}/dashboard/paket?placanje=povratak` },
          checkout_options: { embed: false },
        },
        relationships: {
          store: { data: { type: 'stores', id: storeId } },
          variant: { data: { type: 'variants', id: variants[plan] } },
        },
      },
    },
  });
  const url = String(res.data?.attributes?.url || '');
  if (!url) throw new Error('Lemon Squeezy nije vratio link za plaćanje.');
  return url;
}

export async function verifyLemonSignature(admin: SupabaseClient, rawBody: string, signature: string | null) {
  const secret = await getConfig(admin, 'ls:webhook_secret');
  if (!secret || !signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(signature, 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const STATUS: Record<string, string> = {
  on_trial: 'active',
  active: 'active',
  cancelled: 'cancelled',
  past_due: 'suspended',
  unpaid: 'suspended',
  paused: 'suspended',
  expired: 'expired',
};

export async function planForVariant(admin: SupabaseClient, variantId: string): Promise<LsPlan | null> {
  for (const plan of ['starter', 'pro'] as LsPlan[]) {
    if ((await getConfig(admin, `ls:variant:${plan}`)) === String(variantId)) return plan;
  }
  return null;
}

// Primjena potpisanog webhooka (ili svježe pročitane pretplate) na firmu.
export async function applyLemonSubscription(
  admin: SupabaseClient,
  businessId: string,
  sub: { id: string; attributes: Record<string, unknown> }
) {
  const a = sub.attributes;
  const plan = await planForVariant(admin, String(a.variant_id ?? ''));
  const status = STATUS[String(a.status)] || String(a.status || 'unknown');
  const until = (a.renews_at || a.ends_at || null) as string | null;
  const portal = (a.urls as Record<string, unknown> | undefined)?.customer_portal;

  const { data: current } = await admin.from('businesses').select('billing_subscription_id, billing_status').eq('id', businessId).maybeSingle();
  // Stara pretplata ne smije ugasiti novu, aktivnu.
  if (current?.billing_status === 'active' && current.billing_subscription_id && current.billing_subscription_id !== sub.id && status !== 'active') {
    return { ignored: true, status };
  }

  const update: Record<string, unknown> = {
    billing_provider: 'lemonsqueezy',
    billing_subscription_id: sub.id,
    billing_status: status,
    billing_portal_url: typeof portal === 'string' ? portal : null,
  };
  if (until) update.plan_until = new Date(Date.parse(until) + 2 * 86400000).toISOString();
  if (status === 'active' && plan) update.plan = plan;
  const { error } = await admin.from('businesses').update(update).eq('id', businessId);
  if (error) throw error;
  return { ignored: false, status, plan };
}

// "Provjeri uplatu": svježe stanje zadnje poznate pretplate.
export async function refreshLemonSubscription(admin: SupabaseClient, businessId: string) {
  const { data } = await admin.from('businesses').select('billing_subscription_id').eq('id', businessId).maybeSingle();
  const id = data?.billing_subscription_id;
  if (!id || !/^\d{1,15}$/.test(String(id))) return null;
  const sub = await ls<JsonApi<Item>>(`/subscriptions/${id}`);
  return applyLemonSubscription(admin, businessId, sub.data);
}
