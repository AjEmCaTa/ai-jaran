import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getOwnerContext } from '../../../utils/ownerAuth';

const RESERVATION_FIELDS = 'id, business_id, user_id, customer_name, customer_phone, customer_email, service_name, reservation_date, status, created_at, price, duration_minutes';

async function loadReservations(admin: SupabaseClient, businessId: string) {
  const reservations: Record<string, unknown>[] = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await admin
      .from('reservations')
      .select(RESERVATION_FIELDS)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);
    if (error) throw error;
    reservations.push(...(data || []));
    if (!data || data.length < pageSize) break;
  }
  return reservations;
}

export async function GET(request: NextRequest) {
  const result = await getOwnerContext(request);
  if (result.response) return result.response;

  try {
    const { admin, businessId } = result.context;
    const [businessResult, reservations, servicesResult] = await Promise.all([
      admin.from('businesses')
        .select('id, name, category, city, address, phone, owner_email, work_start, work_end, work_days')
        .eq('id', businessId)
        .single(),
      loadReservations(admin, businessId),
      admin.from('services').select('id', { count: 'exact', head: true }).eq('business_id', businessId),
    ]);

    if (businessResult.error) throw businessResult.error;
    if (servicesResult.error) throw servicesResult.error;

    return NextResponse.json({
      business: businessResult.data,
      reservations,
      serviceCount: servicesResult.count || 0,
    });
  } catch (error) {
    console.error('Dashboard podaci nisu učitani:', error);
    return NextResponse.json({ error: 'Podatke dashboarda nije moguće učitati.' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const result = await getOwnerContext(request);
  if (result.response) return result.response;

  try {
    const body = await request.json();
    const allowedFields = ['name', 'category', 'city', 'address', 'phone', 'owner_email', 'work_start', 'work_end', 'work_days'];
    const changes = Object.fromEntries(
      Object.entries(body).filter(([key]) => allowedFields.includes(key)),
    );

    if (typeof changes.name !== 'string' || !changes.name.trim() || Object.keys(changes).length === 0) {
      return NextResponse.json({ error: 'Unesite naziv biznisa.' }, { status: 400 });
    }
    if ('work_days' in changes && (!Array.isArray(changes.work_days) || changes.work_days.some((day) => typeof day !== 'string'))) {
      return NextResponse.json({ error: 'Odabrani radni dani nisu važeći.' }, { status: 400 });
    }
    for (const field of ['category', 'city', 'address', 'phone', 'owner_email', 'work_start', 'work_end'] as const) {
      if (field in changes && changes[field] !== null && typeof changes[field] !== 'string') {
        return NextResponse.json({ error: 'Podaci biznisa nisu važeći.' }, { status: 400 });
      }
    }

    const { data, error } = await result.context.admin
      .from('businesses')
      .update(Object.fromEntries(Object.entries(changes).map(([key, value]) => [key, typeof value === 'string' ? value.trim() || null : value])))
      .eq('id', result.context.businessId)
      .select('id')
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Biznis nije pronađen.' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Podaci biznisa nisu sačuvani:', error);
    return NextResponse.json({ error: 'Promjene nije moguće sačuvati.' }, { status: 500 });
  }
}