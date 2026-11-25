import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { retryFetch } from '../../../../utils/supabaseRetryFetch';
import { isValidEmail, normalizeEmail } from '../../../../utils/marketingContacts';

export const dynamic = 'force-dynamic';

// Klijent je pri registraciji označio "Želim primati novosti i ponude": spremamo izričit pristanak.
// Ništa mu se ne šalje automatski; pristanak samo dozvoljava buduće kampanje koje odobri admin.
export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: 'Server nije podešen.' }, { status: 500 });
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ error: 'Prijavite se.' }, { status: 401 });

  const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false }, global: { fetch: retryFetch } });
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  const user = userData?.user;
  if (userError || !user) return NextResponse.json({ error: 'Prijavite se ponovo.' }, { status: 401 });

  const email = normalizeEmail(user.email || '');
  if (!isValidEmail(email)) return NextResponse.json({ error: 'Nalog nema ispravan e-mail.' }, { status: 400 });
  const meta = (user.user_metadata || {}) as Record<string, unknown>;
  const name = typeof meta.full_name === 'string' ? meta.full_name.trim().slice(0, 160) || null : null;
  const now = new Date().toISOString();

  const { data: existing } = await admin.from('marketing_contacts').select('id, legal_basis').eq('email', email).maybeSingle();
  if (existing) {
    // Vlasnik firme ostaje "korisnik"; ostali (hladni, upit) dobijaju izričit pristanak.
    const update: Record<string, unknown> = { status: 'active', consent_source: 'Registracija na poslo.one (kvačica)', consent_at: now, updated_at: now };
    if (existing.legal_basis !== 'customer') update.legal_basis = 'consent';
    const { error } = await admin.from('marketing_contacts').update(update).eq('id', existing.id);
    if (error) return NextResponse.json({ error: 'Pristanak nije sačuvan.' }, { status: 500 });
  } else {
    const { error } = await admin.from('marketing_contacts').insert({
      email,
      owner_name: name,
      legal_basis: 'consent',
      consent_source: 'Registracija na poslo.one (kvačica)',
      consent_at: now,
      tags: ['klijent'],
      created_by: 'sajt',
    });
    if (error) return NextResponse.json({ error: 'Pristanak nije sačuvan.' }, { status: 500 });
  }
  await admin.auth.admin.updateUserById(user.id, { user_metadata: { ...meta, news_opt_in: true, news_opt_in_saved: true } });
  return NextResponse.json({ success: true });
}
