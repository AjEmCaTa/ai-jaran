import { NextRequest, NextResponse } from 'next/server';
import { getOwnerContext } from '../../../../../utils/ownerAuth';
import { createPaypalSubscription, paypalConfigured, type PaidPlan } from '../../../../../utils/paypal';

// Vlasnik bira paket; vraća se PayPal link na kojem plaća.
export async function POST(request: NextRequest) {
  const result = await getOwnerContext(request);
  if (result.response) return result.response;
  const { admin, businessId } = result.context;
  if (!paypalConfigured()) return NextResponse.json({ error: 'PayPal plaćanje još nije uključeno.' }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  const plan = body?.plan === 'starter' || body?.plan === 'pro' ? (body.plan as PaidPlan) : null;
  if (!plan) return NextResponse.json({ error: 'Izaberite paket.' }, { status: 400 });
  try {
    const { data: business } = await admin.from('businesses').select('created_at, billing_status').eq('id', businessId).maybeSingle();
    const { subscriptionId, approveUrl } = await createPaypalSubscription(admin, businessId, plan, business?.created_at ?? null);
    // Broj pretplate se pamti odmah, da se uplata može potvrditi i ako PayPal ne vrati korisnika nazad.
    if (business?.billing_status !== 'active') {
      await admin.from('businesses').update({ paypal_subscription_id: subscriptionId, billing_status: 'pending' }).eq('id', businessId);
    }
    return NextResponse.json({ url: approveUrl });
  } catch (error) {
    console.error('PayPal pretplata nije napravljena:', error);
    return NextResponse.json({ error: 'PayPal plaćanje trenutno nije dostupno. Pokušajte ponovo.' }, { status: 502 });
  }
}
