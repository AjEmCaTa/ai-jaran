import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { applyDodoSubscription, verifyDodoSignature, type DodoSubscription } from '../../../../../utils/dodo';
import { retryFetch } from '../../../../../utils/supabaseRetryFetch';

// Dodo javlja početak pretplate, obnovu, neuspjelu naplatu i otkazivanje. Samo poruke s ispravnim potpisom.
export async function POST(request: NextRequest) {
  const raw = await request.text();
  const ok = verifyDodoSignature(raw, {
    id: request.headers.get('webhook-id'),
    timestamp: request.headers.get('webhook-timestamp'),
    signature: request.headers.get('webhook-signature'),
  });
  if (!ok) return NextResponse.json({ error: 'invalid signature' }, { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: 'not configured' }, { status: 503 });
  const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false }, global: { fetch: retryFetch } });

  let event: { type?: string; data?: Record<string, unknown> };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 });
  }
  const type = String(event.type || '');
  const data = event.data || {};
  const businessId = String((data.metadata as Record<string, unknown> | undefined)?.business_id || '');
  console.log('Dodo webhook', type, data.subscription_id || data.payment_id, 'firma', businessId);

  if (!type.startsWith('subscription.') || !data.subscription_id) return NextResponse.json({ ok: true, ignored: true });
  if (!/^[0-9a-f-]{36}$/i.test(businessId)) return NextResponse.json({ ok: true, ignored: true });

  try {
    await applyDodoSubscription(admin, businessId, data as unknown as DodoSubscription);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Dodo webhook nije obrađen:', error);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
