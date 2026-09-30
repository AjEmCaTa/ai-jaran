import { NextRequest, NextResponse } from 'next/server';
import { getOwnerContext } from '../../../../utils/ownerAuth';

const allowedStatuses = new Set(['Na čekanju', 'Na cekanju', 'Aktivno', 'Potvrđeno', 'Završeno', 'Otkazano']);

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