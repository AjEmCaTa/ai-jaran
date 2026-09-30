import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return NextResponse.json({ error: 'Nedostaje serverska Supabase konfiguracija.' }, { status: 503 });
  }
  if (!token) return NextResponse.json({ error: 'Prijavite se za pregled rezervacija.' }, { status: 401 });

  const authClient = createClient(supabaseUrl, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !authData.user) return NextResponse.json({ error: 'Sesija nije važeća.' }, { status: 401 });

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await admin
    .from('reservations')
    .select('id, business_id, customer_name, customer_phone, customer_email, service_name, price, reservation_date, duration_minutes, status')
    .eq('user_id', authData.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Rezervacije korisnika nisu učitane:', error);
    return NextResponse.json({ error: 'Rezervacije nije moguće učitati.' }, { status: 500 });
  }
  return NextResponse.json({ reservations: data || [] });
}