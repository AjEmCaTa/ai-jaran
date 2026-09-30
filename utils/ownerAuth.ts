import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export type OwnerContext = {
  admin: SupabaseClient;
  user: User;
  businessId: string;
};

export type OwnerContextResult =
  | { context: OwnerContext; response?: never }
  | { context?: never; response: NextResponse };

export async function getOwnerContext(request: NextRequest): Promise<OwnerContextResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return { response: NextResponse.json({ error: 'Nedostaje serverska Supabase konfiguracija.' }, { status: 503 }) };
  }

  if (!token) {
    return { response: NextResponse.json({ error: 'Prijavite se za pristup panelu.' }, { status: 401 }) };
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: authData, error: authError } = await authClient.auth.getUser(token);
  if (authError || !authData.user) {
    return { response: NextResponse.json({ error: 'Sesija nije važeća.' }, { status: 401 }) };
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('business_id')
    .eq('id', authData.user.id)
    .maybeSingle();

  if (profileError) {
    return { response: NextResponse.json({ error: 'Profil vlasnika nije moguće provjeriti.' }, { status: 500 }) };
  }
  if (!profile?.business_id) {
    return { response: NextResponse.json({ error: 'Ovaj nalog nije povezan s biznisom.' }, { status: 403 }) };
  }

  const { data: business, error: businessError } = await admin
    .from('businesses')
    .select('id, status')
    .eq('id', profile.business_id)
    .maybeSingle();

  if (businessError) {
    return { response: NextResponse.json({ error: 'Vlasnički biznis nije moguće provjeriti.' }, { status: 500 }) };
  }
  if (!business) {
    return { response: NextResponse.json({ error: 'Povezani biznis ne postoji.' }, { status: 403 }) };
  }
  if (business.status !== 'active') {
    return { response: NextResponse.json({ error: 'Pristup ovom biznisu nije aktivan.' }, { status: 403 }) };
  }

  return { context: { admin, user: authData.user, businessId: business.id } };
}