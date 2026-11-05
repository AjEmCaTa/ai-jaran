import { NextRequest, NextResponse } from 'next/server';
import { getOwnerContext } from '../../../../../utils/ownerAuth';
import { cancelPaypalSubscription, syncPaypalSubscription } from '../../../../../utils/paypal';

// Vlasnik otkazuje pretplatu; paket vrijedi do kraja plaćenog perioda.
export async function POST(request: NextRequest) {
  const result = await getOwnerContext(request);
  if (result.response) return result.response;
  const { admin, businessId } = result.context;
  const { data: business } = await admin.from('businesses').select('paypal_subscription_id').eq('id', businessId).maybeSingle();
  const subId = business?.paypal_subscription_id;
  if (!subId) return NextResponse.json({ error: 'Nema aktivne pretplate.' }, { status: 400 });
  try {
    await cancelPaypalSubscription(subId);
    const synced = await syncPaypalSubscription(admin, subId, businessId);
    return NextResponse.json({ success: true, status: synced.status });
  } catch (error) {
    console.error('Otkazivanje nije uspjelo:', error);
    return NextResponse.json({ error: 'Otkazivanje nije uspjelo. Pokušajte ponovo ili nam se javite.' }, { status: 502 });
  }
}
