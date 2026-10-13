// Čista logika za web push (bez vanjskih importa, da je testabilna s `node --test`).

export type PushSubscriptionInput = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export type PushPayload = {
  title: string;
  body: string;
  url: string;
  tag: string;
};

export type StoredSubscription = { endpoint: string; p256dh: string; auth: string };

const BASE64URL_RE = /^[A-Za-z0-9_-]+={0,2}$/;

// Validira pretplatu iz browsera. Endpoint mora biti https (push servisi: FCM, Mozilla, Apple, WNS).
export function parseSubscription(value: unknown): PushSubscriptionInput | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
  if (typeof v.endpoint !== 'string' || v.endpoint.length > 2000) return null;
  let url: URL;
  try {
    url = new URL(v.endpoint);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:') return null;
  const p256dh = v.keys?.p256dh;
  const auth = v.keys?.auth;
  if (typeof p256dh !== 'string' || typeof auth !== 'string') return null;
  if (p256dh.length < 20 || p256dh.length > 200 || !BASE64URL_RE.test(p256dh)) return null;
  if (auth.length < 8 || auth.length > 100 || !BASE64URL_RE.test(auth)) return null;
  return { endpoint: v.endpoint, keys: { p256dh, auth } };
}

export function inquiryDashboardUrl(inquiryId: string) {
  return `/dashboard/inquiries?id=${encodeURIComponent(inquiryId)}`;
}

// Notifikacija ne nosi telefon/e-mail/poruku klijenta (vidi se na zaključanom ekranu).
export function buildInquiryPayload(input: { inquiryId: string; service?: string }): PushPayload {
  const service = (input.service || '').replace(/[\u0000-\u001F\u007F]+/g, ' ').trim().slice(0, 80);
  return {
    title: 'Novi upit',
    body: service ? `Novi upit: ${service}` : 'Primili ste novi upit preko POSLO ONE kataloga.',
    url: inquiryDashboardUrl(input.inquiryId),
    tag: `inquiry-${input.inquiryId}`,
  };
}

// Dozvoljeni su samo relativni linkovi unutar dashboarda (sprječava open redirect iz payload-a).
export function safeDashboardPath(url: unknown, origin = 'https://poslo.one') {
  if (typeof url !== 'string') return '/dashboard/inquiries';
  try {
    const parsed = new URL(url, origin);
    if (parsed.origin !== new URL(origin).origin) return '/dashboard/inquiries';
    if (!parsed.pathname.startsWith('/dashboard')) return '/dashboard/inquiries';
    return parsed.pathname + parsed.search;
  } catch {
    return '/dashboard/inquiries';
  }
}

type Row = { endpoint: string; p256dh: string; auth: string };
type Query = {
  select(columns: string): Query;
  eq(column: string, value: string): Query;
  delete(): Query;
  in(column: string, values: string[]): Query;
  then: PromiseLike<{ data: Row[] | null; error: unknown }>['then'];
};
export type PushStore = { from(table: string): Query };
export type PushSender = (
  subscription: PushSubscriptionInput,
  payload: string
) => Promise<void>;

// Šalje push ISKLJUČIVO pretplatama zadane firme. Mrtve pretplate (404/410) se brišu.
export async function sendPushToBusiness(
  store: PushStore,
  businessId: string,
  payload: PushPayload,
  send: PushSender
): Promise<{ sent: number; failed: number; removed: number }> {
  const { data, error } = await store
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('business_id', businessId);
  if (error || !data) return { sent: 0, failed: 0, removed: 0 };

  const dead: string[] = [];
  let sent = 0;
  let failed = 0;
  await Promise.all(
    data.map(async (row) => {
      try {
        await send({ endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } }, JSON.stringify(payload));
        sent += 1;
      } catch (err) {
        const status = (err as { statusCode?: number })?.statusCode;
        if (status === 404 || status === 410) dead.push(row.endpoint);
        else failed += 1;
      }
    })
  );

  if (dead.length) {
    await store.from('push_subscriptions').delete().eq('business_id', businessId).in('endpoint', dead);
  }
  return { sent, failed, removed: dead.length };
}
