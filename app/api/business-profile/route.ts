import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const slug = request.nextUrl.searchParams.get('slug');
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: 'Biznis nije dostupan.' }, { status: 503 });
  }
  if (!slug) return NextResponse.json({ error: 'Slug biznisa nije naveden.' }, { status: 400 });

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: business, error } = await admin
    .from('businesses')
    .select('id, name, category, city, address, phone, work_start, work_end, work_days, status, is_active')
    .eq('slug', slug)
    .maybeSingle();
  if (error) return NextResponse.json({ error: 'Profil biznisa nije moguće učitati.' }, { status: 500 });
  if (!business || business.status !== 'active' || business.is_active === false) {
    return NextResponse.json({ error: 'Biznis nije pronađen.' }, { status: 404 });
  }

  const { data: services, error: servicesError } = await admin
    .from('services')
    .select('id, name, description, duration, price')
    .eq('business_id', business.id)
    .order('created_at', { ascending: true });
  if (servicesError) return NextResponse.json({ error: 'Usluge nije moguće učitati.' }, { status: 500 });

  return NextResponse.json({ business, services: services || [] });
}