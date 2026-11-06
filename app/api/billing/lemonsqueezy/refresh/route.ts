import { NextRequest, NextResponse } from 'next/server';
import { getOwnerContext } from '../../../../../utils/ownerAuth';
import { refreshLemonSubscription } from '../../../../../utils/lemonsqueezy';

// "Provjeri uplatu": stanje pretplate se čita direktno sa Lemon Squeezyja.
export async function POST(request: NextRequest) {
  const result = await getOwnerContext(request);
  if (result.response) return result.response;
  const { admin, businessId } = result.context;
  try {
    const r = await refreshLemonSubscription(admin, businessId);
    const { data } = await admin.from('businesses').select('plan, billing_status').eq('id', businessId).maybeSingle();
    return NextResponse.json({ success: true, found: Boolean(r), plan: data?.plan, status: data?.billing_status });
  } catch (error) {
    console.error('Provjera uplate nije uspjela:', error);
    return NextResponse.json({ error: 'Provjera trenutno nije moguća.' }, { status: 502 });
  }
}
