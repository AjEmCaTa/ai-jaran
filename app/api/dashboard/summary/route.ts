import { NextRequest, NextResponse } from 'next/server';
import { getOwnerContext } from '../../../../utils/ownerAuth';
import { statusKind } from '../../../../utils/reservationFlow';

// Kratki pregled za karticu "Tvoj biznis" na Početnoj aplikacije: današnji termini i novi upiti.
// Samo za vlasnike (ostali dobiju 401/403 pa se kartica ne prikazuje).
export async function GET(request: NextRequest) {
  const owner = await getOwnerContext(request);
  if (owner.response) return owner.response;
  const { admin, businessId } = owner.context;

  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Sarajevo' }).format(new Date());

  const [biz, res, inq] = await Promise.all([
    admin.from('businesses').select('name, logo_url, slug').eq('id', businessId).maybeSingle(),
    admin
      .from('reservations')
      .select('status, reservation_date')
      .eq('business_id', businessId)
      .gte('reservation_date', `${today}T00:00`)
      .lte('reservation_date', `${today}T23:59:59`)
      .limit(200),
    admin.from('business_inquiries').select('id', { count: 'exact', head: true }).eq('business_id', businessId).eq('status', 'new'),
  ]);

  const todayCount = (res.data || []).filter((r) => {
    const k = statusKind(r.status);
    return k !== 'cancelled' && k !== 'expired';
  }).length;

  return NextResponse.json(
    {
      name: biz.data?.name || '',
      logo: biz.data?.logo_url || null,
      slug: biz.data?.slug || '',
      today: todayCount,
      newInquiries: inq.count || 0,
    },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
