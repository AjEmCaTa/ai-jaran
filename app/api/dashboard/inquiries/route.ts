import { NextRequest, NextResponse } from 'next/server';
import { getOwnerContext } from '../../../../utils/ownerAuth';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const COLUMNS = 'id, name, phone, email, service, message, status, created_at';

export async function GET(request: NextRequest) {
  const owner = await getOwnerContext(request);
  if (owner.response) return owner.response;
  const { admin, businessId } = owner.context;

  const { data, error } = await admin
    .from('business_inquiries')
    .select(COLUMNS)
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('inquiries list:', error);
    return NextResponse.json({ error: 'Upite nije moguće učitati.', inquiries: [] }, { status: 500 });
  }
  return NextResponse.json({ inquiries: data || [] });
}

export async function PATCH(request: NextRequest) {
  const owner = await getOwnerContext(request);
  if (owner.response) return owner.response;
  const { admin, businessId } = owner.context;

  const body = await request.json().catch(() => null);
  const id = typeof body?.id === 'string' ? body.id : '';
  const status = body?.status;
  if (!UUID_RE.test(id) || (status !== 'new' && status !== 'handled')) {
    return NextResponse.json({ error: 'Neispravan zahtjev.' }, { status: 400 });
  }

  const { data, error } = await admin
    .from('business_inquiries')
    .update({ status })
    .eq('id', id)
    .eq('business_id', businessId)
    .select(COLUMNS)
    .maybeSingle();

  if (error) return NextResponse.json({ error: 'Upit nije moguće izmijeniti.' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Upit nije pronađen.' }, { status: 404 });
  return NextResponse.json({ inquiry: data });
}
