import { NextRequest, NextResponse } from 'next/server';
import { getOwnerContext } from '../../../../../utils/ownerAuth';
import { createLemonCheckout, lemonConfigured, LemonSetupError, type LsPlan } from '../../../../../utils/lemonsqueezy';

// Link za plaćanje (kartica ili PayPal) za izabrani paket.
export async function POST(request: NextRequest) {
  const result = await getOwnerContext(request);
  if (result.response) return result.response;
  const { admin, businessId } = result.context;
  if (!lemonConfigured()) return NextResponse.json({ error: 'Online plaćanje još nije uključeno.' }, { status: 503 });
  const body = await request.json().catch(() => ({}));
  const plan = body?.plan === 'starter' || body?.plan === 'pro' ? (body.plan as LsPlan) : null;
  if (!plan) return NextResponse.json({ error: 'Izaberite paket.' }, { status: 400 });
  try {
    const { data: business } = await admin.from('businesses').select('owner_email, name').eq('id', businessId).maybeSingle();
    const url = await createLemonCheckout(admin, businessId, plan, business?.owner_email || null, business?.name || null);
    return NextResponse.json({ url });
  } catch (error) {
    console.error('Lemon Squeezy plaćanje nije otvoreno:', error);
    const msg = error instanceof LemonSetupError ? error.message : 'Plaćanje trenutno nije dostupno. Pokušajte ponovo.';
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
