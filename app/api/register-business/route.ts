import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, clientIp } from '../../../utils/rateLimit';
import { NextRequest, NextResponse } from 'next/server';
import { buildSlug, parseRegistration } from '../../../utils/registration';

// Serverska registracija biznisa. Zamjenjuje direktan upis iz browsera:
// - status je UVIJEK 'pending' (aktivira ga administrator),
// - profil se veže samo za biznis koji je upravo kreiran ovdje (klijent business_id ne šalje),
// - nalog koji već postoji nikad ne dobija novi profil/biznis.
export async function POST(request: NextRequest) {

  {
    const rl = checkRateLimit('register-business:' + clientIp(request), 5, 3600000);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Previše pokušaja registracije. Pokušajte kasnije.' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } });
    }
  }  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return NextResponse.json({ error: 'Registracija trenutno nije dostupna.' }, { status: 503 });
  }

  const parsed = parseRegistration(await request.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const input = parsed.value;

  const options = { auth: { autoRefreshToken: false, persistSession: false } };
  const authClient = createClient(supabaseUrl, anonKey, options);
  const admin = createClient(supabaseUrl, serviceRoleKey, options);

  // signUp (a ne admin.createUser) zadržava postojeće ponašanje potvrde emaila iz Supabase postavki.
  const signUp = await authClient.auth.signUp({ email: input.email, password: input.password });
  if (signUp.error) {
    return NextResponse.json({ error: 'Nalog nije moguće kreirati. Provjerite podatke ili pokušajte ponovo.' }, { status: 400 });
  }
  const user = signUp.data.user;
  // Prazan identities = email već postoji (Supabase vraća prikriveni korisnik): ne dira se ništa.
  if (!user || !user.identities || user.identities.length === 0) {
    return NextResponse.json({ error: 'Nalog s ovom email adresom već postoji. Prijavite se.' }, { status: 409 });
  }

  let businessId: string | null = null;
  try {
    for (let attempt = 0; attempt < 3 && !businessId; attempt += 1) {
      const { data, error } = await admin
        .from('businesses')
        .insert({
          name: input.businessName,
          slug: buildSlug(input.businessName),
          category: input.category,
          city: input.city,
          phone: input.phone,
          owner_email: input.email,
          status: 'pending',
        })
        .select('id')
        .single();
      if (!error && data) businessId = data.id;
      else if (error?.code !== '23505') throw error; // 23505 = slug zauzet, pokušaj ponovo
    }
    if (!businessId) throw new Error('slug');

    const { error: profileError } = await admin.from('profiles').insert({
      id: user.id,
      email: input.email,
      name: input.ownerName,
      business_id: businessId,
      must_change_password: false,
    });
    if (profileError) throw profileError;

    return NextResponse.json({ success: true, needsEmailConfirmation: !signUp.data.session });
  } catch (error) {
    console.error('Registracija biznisa nije uspjela:', error);
    // Čišćenje: bez siročadi (nalog bez profila / biznis bez vlasnika).
    if (businessId) await admin.from('businesses').delete().eq('id', businessId);
    await admin.auth.admin.deleteUser(user.id);
    return NextResponse.json({ error: 'Registracija nije uspjela. Pokušajte ponovo.' }, { status: 500 });
  }
}
