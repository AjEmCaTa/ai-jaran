import { NextRequest, NextResponse } from 'next/server';
import { getOwnerContext } from '../../../../../utils/ownerAuth';
import { createDodoCheckout, dodoConfigured, type DodoPlan } from '../../../../../utils/dodo';

// Stranica za plaćanje (kartica, Apple Pay, Google Pay) za izabrani paket, uz preostale besplatne dane.
export async function POST(request: NextRequest) {
  const result = await getOwnerContext(request);
  if (result.response) return result.response;
  const { admin, businessId } = result.context;
  if (!dodoConfigured()) return NextResponse.json({ error: 'Online plaćanje još nije uključeno.' }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  const plan = body?.plan === 'starter' || body?.plan === 'pro' ? (body.plan as DodoPlan) : null;
  if (!plan) return NextResponse.json({ error: 'Izaberite paket.' }, { status: 400 });
  try {
    const { data: business } = await admin
      .from('businesses')
      .select('id, name, owner_email, created_at, billing_subscription_id, billing_provider, billing_status')
      .eq('id', businessId)
      .maybeSingle();
    if (!business) return NextResponse.json({ error: 'Firma nije pronađena.' }, { status: 404 });
    if (business.billing_provider === 'dodo' && business.billing_status === 'active') {
      return NextResponse.json({ error: 'Već imate aktivnu pretplatu. Paket promijenite dugmetom na kartici paketa.' }, { status: 409 });
    }
    const { url, trialDays } = await createDodoCheckout(
      admin,
      { ...business, billing_subscription_id: business.billing_provider === 'dodo' ? business.billing_subscription_id : null },
      plan,
    );
    return NextResponse.json({ url, trialDays });
  } catch (error) {
    console.error('Dodo plaćanje nije otvoreno:', error);
    return NextResponse.json({ error: 'Plaćanje trenutno nije dostupno. Pokušajte ponovo.' }, { status: 502 });
  }
}
