import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';

// Provjera administratora POSLO ONE-a za /api/master/* rute (ista pravila kao /api/master/businesses).
// MASTER_ADMIN_EMAILS (zarezom odvojeno) ima prednost; bez nje ostaje postojeći admin.
const FALLBACK_ADMINS = ['caticharun126@gmail.com'];

export function masterAdminEmails() {
  const fromEnv = (process.env.MASTER_ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return fromEnv.length > 0 ? fromEnv : FALLBACK_ADMINS;
}

export type MasterAuth = { admin: SupabaseClient; email: string } | { response: NextResponse };

export async function requireMasterAdmin(request: NextRequest): Promise<MasterAuth> {
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
  if (!masterAdminEmails().includes(email)) {
    return { response: NextResponse.json({ error: 'Nemate pristup.' }, { status: 403 }) };
  }
  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  return { admin, email };
}

// Evidencija aktivnosti marketinga. Greška u evidenciji ne smije srušiti radnju, ali se zapiše u log servera.
export async function logMarketing(
  admin: SupabaseClient,
  actor: string,
  action: string,
  entity: string | null,
  entityId: string | null,
  details: Record<string, unknown> = {}
) {
  const { error } = await admin.from('marketing_activity_log').insert({ actor, action, entity, entity_id: entityId, details });
  if (error) console.error('Marketing evidencija nije upisana:', action, error.message);
}
