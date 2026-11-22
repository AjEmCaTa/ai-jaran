import { NextRequest, NextResponse } from 'next/server';
import { getOwnerContext } from '../../../../utils/ownerAuth';

// Firma bira plaćanje uplatnicom. Panel radi, a administrator potvrđuje uplatu u Master panelu.
export async function POST(request: NextRequest) {
  const result = await getOwnerContext(request);
  if (result.response) return result.response;
  const { admin, businessId } = result.context;
  const body = await request.json().catch(() => ({}));
  const plan = body?.plan === 'starter' || body?.plan === 'pro' ? body.plan : null;
  if (!plan) return NextResponse.json({ error: 'Izaberite paket.' }, { status: 400 });

  const { data: current } = await admin.from('businesses').select('billing_provider, billing_status, created_at, plan_until').eq('id', businessId).maybeSingle();
  if (current?.billing_status === 'active' && current.billing_provider && current.billing_provider !== 'bank') {
    return NextResponse.json({ error: 'Već imate aktivnu pretplatu karticom.' }, { status: 409 });
  }
  const update: Record<string, unknown> = { billing_provider: 'bank', plan };
  if (current?.billing_status !== 'active') {
    update.billing_status = 'bank_pending';
    // Do kraja besplatnog perioda (30 dana od registracije), pa čeka prvu uplatu.
    if (!current?.plan_until && current?.created_at) update.plan_until = new Date(Date.parse(current.created_at) + 30 * 86400000).toISOString();
  }
  const { error } = await admin.from('businesses').update(update).eq('id', businessId);
  if (error) return NextResponse.json({ error: 'Izbor nije sačuvan.' }, { status: 500 });
  return NextResponse.json({ success: true });
}
