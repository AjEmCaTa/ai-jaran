import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { statusKind } from '../../../../utils/reservationFlow';
import { retryFetch } from '../../../../utils/supabaseRetryFetch';

// Moj profil: statistika termina (GET) i brisanje vlastitog računa (DELETE).
// Brisanje NE briše rezervacije kod firmi: one ostaju firmi, samo se odvoje od računa.
// Vlasnik firme ne može ovdje obrisati račun (firma bi ostala bez panela).

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'missing-service-role-key';
const admin = createClient(supabaseUrl, serviceKey, { global: { fetch: retryFetch } });
const authClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');

async function getUser(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

async function isOwner(userId: string) {
  const { data } = await admin.from('profiles').select('business_id').eq('id', userId).maybeSingle();
  return !!data?.business_id;
}

export async function GET(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ success: false, error: 'Prijavite se.' }, { status: 401 });
  const { data, error } = await admin.from('reservations').select('status').eq('user_id', user.id);
  if (error) return NextResponse.json({ success: false, error: 'Statistika trenutno nije dostupna.' }, { status: 500 });
  const kinds = (data || []).map((r) => statusKind(r.status));
  return NextResponse.json({
    success: true,
    data: {
      total: kinds.length,
      completed: kinds.filter((k) => k === 'completed').length,
      cancelled: kinds.filter((k) => k === 'cancelled').length,
      owner: await isOwner(user.id),
    },
  });
}

export async function DELETE(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ success: false, error: 'Prijavite se.' }, { status: 401 });
  if (await isOwner(user.id)) {
    return NextResponse.json({ success: false, error: 'Račun vlasnika firme se ne briše ovdje. Pišite nam na info@poslo.one i pomoći ćemo.' }, { status: 409 });
  }
  const detach = await admin.from('reservations').update({ user_id: null }).eq('user_id', user.id);
  if (detach.error) return NextResponse.json({ success: false, error: 'Brisanje nije uspjelo. Pokušajte ponovo.' }, { status: 500 });
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return NextResponse.json({ success: false, error: 'Brisanje nije uspjelo. Pokušajte ponovo.' }, { status: 500 });
  return NextResponse.json({ success: true });
}
