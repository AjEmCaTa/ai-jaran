import { NextRequest, NextResponse } from 'next/server';
import { getOwnerContext } from '../../../../../utils/ownerAuth';
import { changeDodoPlan, type DodoPlan } from '../../../../../utils/dodo';

// Prelazak Starter <-> Pro na postojećoj pretplati (razlika se obračuna odmah).
export async function POST(request: NextRequest) {
  const result = await getOwnerContext(request);
  if (result.response) return result.response;
  const { admin, businessId } = result.context;
  const body = await request.json().catch(() => ({}));
  const plan = body?.plan === 'starter' || body?.plan === 'pro' ? (body.plan as DodoPlan) : null;
  if (!plan) return NextResponse.json({ error: 'Izaberite paket.' }, { status: 400 });
  try {
    const changed = await changeDodoPlan(admin, businessId, plan);
    if (!changed) return NextResponse.json({ error: 'Nemate aktivnu pretplatu karticom.' }, { status: 409 });
    const { data } = await admin.from('businesses').select('plan, billing_status').eq('id', businessId).maybeSingle();
    return NextResponse.json({ success: true, plan: data?.plan, status: data?.billing_status });
  } catch (error) {
    console.error('Dodo promjena paketa nije uspjela:', error);
    return NextResponse.json({ error: 'Promjena paketa trenutno nije moguća.' }, { status: 502 });
  }
}
