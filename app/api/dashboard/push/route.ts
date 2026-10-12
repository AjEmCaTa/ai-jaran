import { NextRequest, NextResponse } from 'next/server';
import { getOwnerContext } from '../../../../utils/ownerAuth';
import { parseSubscription } from '../../../../utils/push';
import { getVapidPublicKey, isPushConfigured } from '../../../../utils/pushSender';

// Pretplate se vežu za business_id iz provjerenog tokena; klijent ga nikad ne šalje.

export async function GET(request: NextRequest) {
  const owner = await getOwnerContext(request);
  if (owner.response) return owner.response;
  const { admin, businessId, user } = owner.context;

  const configured = isPushConfigured();
  const { count } = await admin
    .from('push_subscriptions')
    .select('id', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .eq('user_id', user.id);

  return NextResponse.json({
    configured,
    publicKey: configured ? getVapidPublicKey() : '',
    subscriptions: count ?? 0,
  });
}

export async function POST(request: NextRequest) {
  const owner = await getOwnerContext(request);
  if (owner.response) return owner.response;
  const { admin, businessId, user } = owner.context;

  if (!isPushConfigured()) {
    return NextResponse.json({ error: 'Push obavijesti nisu podešene na serveru.' }, { status: 503 });
  }
  const body = await request.json().catch(() => null);
  const subscription = parseSubscription(body?.subscription);
  if (!subscription) return NextResponse.json({ error: 'Neispravna pretplata.' }, { status: 400 });

  // Isti uređaj (endpoint) pripada jednoj firmi/korisniku: nova prijava ga preuzima.
  const { error } = await admin.from('push_subscriptions').upsert(
    {
      business_id: businessId,
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      user_agent: (request.headers.get('user-agent') || '').slice(0, 300),
    },
    { onConflict: 'endpoint' }
  );
  if (error) {
    console.error('push subscribe:', error);
    return NextResponse.json({ error: 'Pretplatu nije moguće sačuvati.' }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const owner = await getOwnerContext(request);
  if (owner.response) return owner.response;
  const { admin, businessId } = owner.context;

  const body = await request.json().catch(() => null);
  const endpoint = typeof body?.endpoint === 'string' ? body.endpoint : '';
  if (!endpoint) return NextResponse.json({ error: 'Nedostaje endpoint.' }, { status: 400 });

  const { error } = await admin
    .from('push_subscriptions')
    .delete()
    .eq('business_id', businessId)
    .eq('endpoint', endpoint);
  if (error) return NextResponse.json({ error: 'Pretplatu nije moguće ukloniti.' }, { status: 500 });
  return NextResponse.json({ success: true });
}
