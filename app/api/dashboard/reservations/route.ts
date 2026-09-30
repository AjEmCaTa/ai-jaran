import { NextRequest, NextResponse } from 'next/server';
import { getOwnerContext } from '../../../../utils/ownerAuth';

const allowedStatuses = new Set(['Na čekanju', 'Na cekanju', 'Aktivno', 'Potvrđeno', 'Završeno', 'Otkazano']);
const reservationFields = 'id, business_id, user_id, customer_name, customer_phone, customer_email, service_name, reservation_date, status, created_at, price, duration_minutes';

export async function GET(request: NextRequest) {
  const result = await getOwnerContext(request);
  if (result.response) return result.response;

  try {
    const reservations: Record<string, unknown>[] = [];
    const pageSize = 1000;
    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await result.context.admin
        .from('reservations')
        .select(reservationFields)
        .eq('business_id', result.context.businessId)
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);
      if (error) throw error;
      reservations.push(...(data || []));
      if (!data || data.length < pageSize) break;
    }
    return NextResponse.json({ reservations });
  } catch (error) {
    console.error('Rezervacije biznisa nisu učitane:', error);
    return NextResponse.json({ error: 'Rezervacije nije moguće učitati.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const result = await getOwnerContext(request);
  if (result.response) return result.response;

  try {
    const body = await request.json();
    if (typeof body.id !== 'string' || !allowedStatuses.has(body.status)) {
      return NextResponse.json({ error: 'Status rezervacije nije važeći.' }, { status: 400 });
    }

    const { data, error } = await result.context.admin
      .from('reservations')
      .update({ status: body.status })
      .eq('id', body.id)
      .eq('business_id', result.context.businessId)
      .select('id')
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Rezervacija nije pronađena.' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Status rezervacije nije promijenjen:', error);
    return NextResponse.json({ error: 'Status rezervacije nije moguće promijeniti.' }, { status: 500 });
  }
}