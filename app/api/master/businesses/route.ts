import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Administratori POSLO ONE-a. MASTER_ADMIN_EMAILS (zarezom odvojeno) ima prednost;
// bez nje ostaje postojeći admin iz master-panela da pristup ne bude izgubljen.
const FALLBACK_ADMINS = ['caticharun126@gmail.com'];

function adminEmails() {
  const fromEnv = (process.env.MASTER_ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return fromEnv.length > 0 ? fromEnv : FALLBACK_ADMINS;
}

async function requireAdmin(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon || !serviceKey) {
    return { response: NextResponse.json({ error: 'Nedostaje serverska konfiguracija.' }, { status: 503 }) };
  }
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return { response: NextResponse.json({ error: 'Prijavite se.' }, { status: 401 }) };

  const authClient = createClient(url, anon, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await authClient.auth.getUser(token);
  const email = data.user?.email?.toLowerCase();
  if (error || !email) return { response: NextResponse.json({ error: 'Sesija nije važeća.' }, { status: 401 }) };
  if (!adminEmails().includes(email)) {
    return { response: NextResponse.json({ error: 'Nemate pristup.' }, { status: 403 }) };
  }
  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  return { admin };
}

export async function GET(request: NextRequest) {
  const result = await requireAdmin(request);
  if (!result.admin) return result.response;
  const { data, error } = await result.admin
    .from('businesses')
    .select('id, name, slug, category, city, phone, owner_email, status, created_at')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'Biznise nije moguće učitati.' }, { status: 500 });
  return NextResponse.json({ businesses: data || [] });
}

export async function PATCH(request: NextRequest) {
  const result = await requireAdmin(request);
  if (!result.admin) return result.response;
  const body = await request.json().catch(() => null);
  if (!body || typeof body.id !== 'string' || !['active', 'pending'].includes(body.status)) {
    return NextResponse.json({ error: 'Neispravan zahtjev.' }, { status: 400 });
  }
  const { data, error } = await result.admin
    .from('businesses')
    .update({ status: body.status })
    .eq('id', body.id)
    .select('id')
    .maybeSingle();
  if (error) return NextResponse.json({ error: 'Status nije moguće promijeniti.' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Biznis nije pronađen.' }, { status: 404 });
  return NextResponse.json({ success: true });
}
