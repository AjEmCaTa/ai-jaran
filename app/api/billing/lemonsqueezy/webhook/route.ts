import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { applyLemonSubscription, verifyLemonSignature } from '../../../../../utils/lemonsqueezy';

// Lemon Squeezy javlja kupovinu, obnovu i otkazivanje. Prihvataju se samo poruke s ispravnim potpisom.
export async function POST(request: NextRequest) {
  const raw = await request.text();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: 'not configured' }, { status: 503 });
  const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

  if (!(await verifyLemonSignature(admin, raw, request.headers.get('x-signature')))) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
  }
  let event: { meta?: { event_name?: string; custom_data?: Record<string, unknown> }; data?: { id: string; type?: string; attributes: Record<string, unknown> } };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 });
  }
  const name = event.meta?.event_name || '';
  const businessId = String(event.meta?.custom_data?.business_id || '');
  console.log('Lemon Squeezy webhook', name, event.data?.type, event.data?.id, 'firma', businessId);
  if (!businessId || !/^[0-9a-f-]{36}$/i.test(businessId) || !event.data) return NextResponse.json({ ok: true, ignored: true });

  try {
    if (event.data.type === 'subscriptions') {
      await applyLemonSubscription(admin, businessId, event.data);
    } else if (event.data.type === 'subscription-invoices') {
      // Uplata/neuspjela uplata: pretplata se osvježi kroz subscription_updated koji LS šalje uz to.
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Lemon Squeezy webhook nije obrađen:', error);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
