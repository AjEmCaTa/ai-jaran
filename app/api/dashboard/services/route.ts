import { NextRequest, NextResponse } from 'next/server';
import { getOwnerContext } from '../../../../utils/ownerAuth';

function serviceFields(body: Record<string, unknown>) {
  if (typeof body.name !== 'string' || !body.name.trim()) return null;
  const price = Number(body.price);
  if (!Number.isFinite(price) || price < 0) return null;
  if (body.duration != null && typeof body.duration !== 'string' && typeof body.duration !== 'number') return null;
  if (body.description != null && typeof body.description !== 'string') return null;
  return {
    name: body.name.trim(),
    description: typeof body.description === 'string' ? body.description.trim() || null : null,
    duration: body.duration == null ? null : String(body.duration),
    price,
  };
}

export async function GET(request: NextRequest) {
  const result = await getOwnerContext(request);
  if (result.response) return result.response;
  const { data, error } = await result.context.admin
    .from('services')
    .select('id, name, description, duration, price, created_at')
    .eq('business_id', result.context.businessId)
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'Usluge nije moguće učitati.' }, { status: 500 });
  return NextResponse.json({ services: data || [] });
}

export async function POST(request: NextRequest) {
  const result = await getOwnerContext(request);
  if (result.response) return result.response;
  try {
    const body = await request.json();
    const fields = serviceFields(body);
    if (!fields) return NextResponse.json({ error: 'Provjerite naziv, trajanje i cijenu usluge.' }, { status: 400 });
    const { error } = await result.context.admin.from('services').insert({
      ...fields,
      business_id: result.context.businessId,
      user_id: result.context.user.id,
    });
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Usluga nije kreirana:', error);
    return NextResponse.json({ error: 'Uslugu nije moguće sačuvati.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const result = await getOwnerContext(request);
  if (result.response) return result.response;
  try {
    const body = await request.json();
    const fields = serviceFields(body);
    if (typeof body.id !== 'string' || !fields) {
      return NextResponse.json({ error: 'Provjerite podatke usluge.' }, { status: 400 });
    }
    const { data, error } = await result.context.admin.from('services')
      .update(fields)
      .eq('id', body.id)
      .eq('business_id', result.context.businessId)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Usluga nije pronađena.' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Usluga nije ažurirana:', error);
    return NextResponse.json({ error: 'Uslugu nije moguće sačuvati.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const result = await getOwnerContext(request);
  if (result.response) return result.response;
  try {
    const body = await request.json();
    if (typeof body.id !== 'string') return NextResponse.json({ error: 'ID usluge nije važeći.' }, { status: 400 });
    const { data, error } = await result.context.admin.from('services')
      .delete()
      .eq('id', body.id)
      .eq('business_id', result.context.businessId)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Usluga nije pronađena.' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Usluga nije obrisana:', error);
    return NextResponse.json({ error: 'Uslugu nije moguće obrisati.' }, { status: 500 });
  }
}