import { NextRequest, NextResponse } from 'next/server';
import { getOwnerContext } from '../../../../utils/ownerAuth';

// Postavke panela firme (boja, link, cilj, prikaz, zvonce). Firma vidi i mijenja samo svoje.
const ALLOWED = ['poslo-theme', 'poslo-booking-link:', 'poslo-monthly-goal:', 'poslo-last-seen:', 'poslo-reservations-view'];
const allowedKey = (key: string) => key.length <= 120 && ALLOWED.some((p) => key === p || key.startsWith(p));
const MAX_VALUE = 4000;
const MAX_KEYS = 40;

const missingColumn = (error: { code?: string; message?: string } | null) =>
  Boolean(error && (error.code === '42703' || error.code === 'PGRST204' || /dashboard_prefs/.test(error.message || '')));

export async function GET(request: NextRequest) {
  const result = await getOwnerContext(request);
  if (result.response) return result.response;
  const { admin, businessId } = result.context;
  const { data, error } = await admin.from('businesses').select('dashboard_prefs').eq('id', businessId).maybeSingle();
  if (missingColumn(error)) return NextResponse.json({ prefs: {}, unavailable: true });
  if (error) return NextResponse.json({ error: 'Postavke nije moguće učitati.' }, { status: 500 });
  return NextResponse.json({ prefs: (data?.dashboard_prefs as Record<string, string>) || {} });
}

export async function PATCH(request: NextRequest) {
  const result = await getOwnerContext(request);
  if (result.response) return result.response;
  const { admin, businessId } = result.context;
  const body = await request.json().catch(() => null);
  const incoming = body?.prefs;
  if (!incoming || typeof incoming !== 'object') return NextResponse.json({ error: 'Neispravan zahtjev.' }, { status: 400 });

  const clean: Record<string, string> = {};
  for (const [key, value] of Object.entries(incoming)) {
    if (allowedKey(key) && typeof value === 'string' && value.length <= MAX_VALUE) clean[key] = value;
  }
  if (Object.keys(clean).length === 0) return NextResponse.json({ success: true });

  const { data, error } = await admin.from('businesses').select('dashboard_prefs').eq('id', businessId).maybeSingle();
  if (missingColumn(error)) return NextResponse.json({ success: true, unavailable: true });
  if (error) return NextResponse.json({ error: 'Postavke nisu sačuvane.' }, { status: 500 });

  const merged = { ...((data?.dashboard_prefs as Record<string, string>) || {}), ...clean };
  if (Object.keys(merged).length > MAX_KEYS) return NextResponse.json({ error: 'Previše postavki.' }, { status: 400 });
  const update = await admin.from('businesses').update({ dashboard_prefs: merged }).eq('id', businessId);
  if (missingColumn(update.error)) return NextResponse.json({ success: true, unavailable: true });
  if (update.error) return NextResponse.json({ error: 'Postavke nisu sačuvane.' }, { status: 500 });
  return NextResponse.json({ success: true });
}
