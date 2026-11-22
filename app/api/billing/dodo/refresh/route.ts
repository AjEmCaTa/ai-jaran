import { NextRequest, NextResponse } from 'next/server';
import { getOwnerContext } from '../../../../../utils/ownerAuth';
import { refreshDodoSubscription } from '../../../../../utils/dodo';

// "Provjeri uplatu": stanje pretplate direktno sa Dodoa.
export async function POST(request: NextRequest) {
  const result = await getOwnerContext(request);
  if (result.response) return result.response;
  const { admin, businessId } = result.context;
  try {
    const r = await refreshDodoSubscription(admin, businessId);
    const { data } = await admin.from('businesses').select('plan, billing_status').eq('id', businessId).maybeSingle();
    return NextResponse.json({ success: true, found: Boolean(r), plan: data?.plan, status: data?.billing_status });
  } catch (error) {
    console.error('Dodo provjera nije uspjela:', error);
    return NextResponse.json({ error: 'Provjera trenutno nije moguća.' }, { status: 502 });
  }
}
