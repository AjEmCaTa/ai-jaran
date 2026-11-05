import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { syncPaypalSubscription } from '../../../../../utils/paypal';

// PayPal javlja promjene pretplate (obnova, otkazivanje, neuspjela naplata).
// Sadržaju poruke se ne vjeruje: uzima se samo broj pretplate, a stanje se čita sa PayPala.
export async function POST(request: NextRequest) {
  const event = await request.json().catch(() => null);
  const resource = event?.resource || {};
  const id: string =
    (typeof resource.billing_agreement_id === 'string' && resource.billing_agreement_id) ||
    (typeof resource.id === 'string' && resource.id.startsWith('I-') ? resource.id : '');
  if (!id) return NextResponse.json({ ok: true, ignored: true });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: 'not configured' }, { status: 503 });
  const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  try {
    await syncPaypalSubscription(admin, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('PayPal webhook nije obrađen:', error);
    // 200 da PayPal ne ponavlja beskonačno nešto što ne možemo obraditi (npr. nepoznata pretplata).
    return NextResponse.json({ ok: false });
  }
}
