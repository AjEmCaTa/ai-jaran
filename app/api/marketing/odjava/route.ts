import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, clientIp } from '../../../../utils/rateLimit';

export const dynamic = 'force-dynamic';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://poslo.one').replace(/\/$/, '');
const isToken = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v);

// Link iz mejla otvara stranicu s potvrdom (da skeneri linkova ne odjave nikoga slučajno).
export async function GET(request: NextRequest) {
  const t = request.nextUrl.searchParams.get('t') || '';
  return NextResponse.redirect(`${SITE_URL}/odjava${isToken(t) ? `?t=${t}` : ''}`, 303);
}

// Odjava: sa stranice /odjava ili "jednim klikom" iz Gmaila (List-Unsubscribe-Post).
// Odjava važi samo za marketing; mejlovi o rezervacijama i nalogu se šalju i dalje.
export async function POST(request: NextRequest) {
  const rl = checkRateLimit(`odjava:${clientIp(request)}`, 20, 600000);
  if (!rl.allowed) return NextResponse.json({ error: 'Previše pokušaja.' }, { status: 429 });

  let token = request.nextUrl.searchParams.get('t') || '';
  if (!isToken(token)) {
    const json = await request.json().catch(() => null);
    token = typeof json?.t === 'string' ? json.t : '';
  }
  if (!isToken(token)) return NextResponse.json({ error: 'Link za odjavu nije ispravan.' }, { status: 400 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: 'Odjava trenutno nije dostupna.' }, { status: 503 });
  const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

  const { data: contact } = await admin.from('marketing_contacts').select('id, status').eq('unsubscribe_token', token).maybeSingle();
  // Isti odgovor i za nepoznat link, da se tokeni ne mogu pogađati.
  if (!contact) return NextResponse.json({ success: true });
  if (contact.status === 'active') {
    await admin.from('marketing_contacts').update({ status: 'unsubscribed' }).eq('id', contact.id);
    await admin.from('marketing_enrollments').update({ status: 'stopped', stop_reason: 'odjavio se' }).eq('contact_id', contact.id).eq('status', 'active');
    await admin.from('marketing_activity_log').insert({ actor: 'primalac', action: 'contact.unsubscribe', entity: 'contact', entity_id: contact.id, details: {} });
  }
  return NextResponse.json({ success: true });
}
