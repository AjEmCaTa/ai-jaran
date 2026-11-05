import { NextRequest, NextResponse } from 'next/server';
import { getOwnerContext } from '../../../../../utils/ownerAuth';
import { syncPaypalSubscription } from '../../../../../utils/paypal';

// Povratak sa PayPala: provjera pretplate direktno kod PayPala i uključivanje paketa.
export async function POST(request: NextRequest) {
  const result = await getOwnerContext(request);
  if (result.response) return result.response;
  const { admin, businessId } = result.context;
  const body = await request.json().catch(() => ({}));
  const subscriptionId = typeof body?.subscriptionId === 'string' ? body.subscriptionId.trim() : '';
  try {
    const synced = await syncPaypalSubscription(admin, subscriptionId, businessId);
    return NextResponse.json({ success: true, plan: synced.plan, status: synced.status });
  } catch (error) {
    console.error('PayPal potvrda nije uspjela:', error);
    return NextResponse.json({ error: 'Uplatu nije moguće potvrditi. Ako ste platili, javite nam se.' }, { status: 400 });
  }
}
