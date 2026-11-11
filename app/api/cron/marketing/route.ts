import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { timingSafeEqual } from 'crypto';
import { runMarketing } from '../../../../utils/marketingRunner';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return 'missing' as const;
  const a = Buffer.from(request.headers.get('authorization') || '');
  const b = Buffer.from('Bearer ' + secret);
  return a.length === b.length && timingSafeEqual(a, b) ? ('ok' as const) : ('denied' as const);
}

// Marketing planer (odvojen od planera rezervacija). Šalje samo odobrene nizove, uz dnevni limit.
export async function GET(request: NextRequest) {
  const auth = authorized(request);
  if (auth === 'missing') return NextResponse.json({ error: 'Cron nije konfigurisan.' }, { status: 503 });
  if (auth === 'denied') return NextResponse.json({ error: 'Nije dozvoljeno.' }, { status: 401 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: 'Nedostaje konfiguracija.' }, { status: 503 });
  const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  try {
    const result = await runMarketing(admin, { actor: 'planer' });
    if (result.sent || result.simulated || result.failed) {
      await admin.from('marketing_activity_log').insert({ actor: 'planer', action: 'run.auto', details: result });
    }
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error('Marketing planer greška', (e as Error).message);
    return NextResponse.json({ error: 'Marketing planer nije uspio.' }, { status: 500 });
  }
}
