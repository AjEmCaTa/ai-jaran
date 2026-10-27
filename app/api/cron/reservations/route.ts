import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { timingSafeEqual } from 'crypto';
import { runReservationLifecycle } from '../../../../utils/reservationLifecycle';

export const dynamic = 'force-dynamic';

const FROM_EMAIL = 'POSLO ONE <info@poslo.one>';

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return 'missing' as const; // bez tajne ruta je ZATVORENA, nikad otvorena
  const given = request.headers.get('authorization') || '';
  const expected = 'Bearer ' + secret;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b) ? ('ok' as const) : ('denied' as const);
}

function formatDate(value: string) {
  const [date, time] = value.split('T');
  const p = (date || '').split('-');
  return (p.length === 3 ? p[2] + '.' + p[1] + '.' + p[0] + '.' : date) + (time ? ' u ' + time.slice(0, 5) : '');
}

// Poziva ga vanjski planer (GitHub Actions) svakih ~15 min: ističe zahtjeve i šalje podsjetnike 24 h prije termina.
export async function GET(request: NextRequest) {
  const auth = authorized(request);
  if (auth === 'missing') return NextResponse.json({ error: 'Cron nije konfigurisan.' }, { status: 503 });
  if (auth === 'denied') return NextResponse.json({ error: 'Nedozvoljeno.' }, { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: 'Nedostaje serverska Supabase konfiguracija.' }, { status: 503 });
  const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

  try {
    const businessNames = new Map<string, string>();
    const summary = await runReservationLifecycle(admin, Date.now(), async (row) => {
      const apiKey = process.env.RESEND_API_KEY;
      const to = typeof row.customer_email === 'string' ? row.customer_email : '';
      if (!apiKey || !to) return false; // bez email servisa ništa se ne šalje i oznaka se vraća
      let name = row.business_id ? businessNames.get(row.business_id) : undefined;
      if (!name && row.business_id) {
        const { data } = await admin.from('businesses').select('name').eq('id', row.business_id).maybeSingle();
        name = data?.name || '';
        businessNames.set(row.business_id, name || '');
      }
      const { Resend } = await import('resend');
      const resend = new Resend(apiKey);
      const when = formatDate(String(row.reservation_date || ''));
      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject: 'Podsjetnik na termin - ' + (name || 'POSLO ONE'),
        html:
          '<div style="font-family:Arial,sans-serif;max-width:600px;color:#1f2937">' +
          '<h2 style="color:#2563eb">Podsjetnik na termin</h2>' +
          '<p>Pozdrav' + (row.customer_name ? ' ' + String(row.customer_name) : '') + ', podsjećamo te da imaš termin kod <b>' + (name || 'firme') + '</b>.</p>' +
          '<p><b>Usluga:</b> ' + String(row.service_name || '') + '<br><b>Termin:</b> ' + when + '</p>' +
          '<p>Termin možeš otkazati putem platforme najkasnije 2 sata prije početka.</p></div>',
      });
      return !result.error;
    });
    return NextResponse.json({ success: true, ...summary });
  } catch (error) {
    console.error('Cron rezervacija nije uspio:', error);
    return NextResponse.json({ error: 'Obrada nije uspjela.' }, { status: 500 });
  }
}
