import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { buildInquiryPayload, sendPushToBusiness, type PushStore } from '../../../utils/push';
import { isPushConfigured, sendWebPush } from '../../../utils/pushSender';

// Univerzalni upit za bilo koju firmu iz tabele `businesses`.
// Primalac se UVIJEK uzima iz baze (businesses.owner_email) po slug-u firme,
// klijent ga ne može odrediti. Koristi centralni RESEND_API_KEY.
// Pošiljalac: INQUIRY_FROM_EMAIL (domena mora biti verifikovana u Resendu);
// ako nije postavljen, koristi se ista adresa kao za potvrde rezervacija (info@poslo.one).
const DEFAULT_FROM_ADDRESS = 'info@poslo.one';

const LIMITS = { slug: 100, name: 100, phone: 40, email: 120, service: 150, message: 2000 };
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX_PER_IP = 5;
const RATE_MAX_PER_BUSINESS = 30;

// Best-effort zaštita u memoriji instance (na serverless okruženju nije globalna).
const hits = new Map<string, number[]>();

function rateLimited(key: string, max: number) {
  const now = Date.now();
  const recent = (hits.get(key) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= max) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (v.every((t) => now - t >= RATE_WINDOW_MS)) hits.delete(k);
    }
  }
  return false;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Uklanja kontrolne znakove i CR/LF (header injection) iz jednolinijskih polja.
function cleanLine(value: unknown, max: number) {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u001F\u007F]+/g, ' ').trim().slice(0, max);
}

function cleanText(value: unknown, max: number) {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max);
}

const EMAIL_RE = /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/;
const PHONE_RE = /^[+\d][\d\s()/.-]{5,}$/;
const SLUG_RE = /^[a-z0-9-]+$/;

function fail(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
}

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!supabaseUrl || !serviceRoleKey || !resendApiKey) {
    console.error('business-inquiry: nedostaje serverska konfiguracija (Supabase/Resend).');
    return fail('Slanje upita trenutno nije dostupno. Pokušajte kasnije ili nas nazovite.', 503);
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return fail('Neispravan zahtjev.', 400);

  // Honeypot: stvarni korisnici ovo polje ne popunjavaju. Tiho "uspjeh" za botove.
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return NextResponse.json({ success: true });
  }

  const slug = cleanLine(body.business_slug, LIMITS.slug).toLowerCase();
  const name = cleanLine(body.name, LIMITS.name);
  const phone = cleanLine(body.phone, LIMITS.phone);
  const email = cleanLine(body.email, LIMITS.email);
  const service = cleanLine(body.service, LIMITS.service);
  const message = cleanText(body.message, LIMITS.message);

  if (!slug || !SLUG_RE.test(slug)) return fail('Firma nije navedena.', 400);
  if (name.length < 2) return fail('Unesite ime i prezime.', 400);
  if (!PHONE_RE.test(phone)) return fail('Unesite ispravan broj telefona.', 400);
  if (email && !EMAIL_RE.test(email)) return fail('Unesite ispravnu e-mail adresu ili ostavite polje prazno.', 400);
  if (message.length < 5) return fail('Opišite kratko šta vam treba.', 400);

  const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
  if (rateLimited(`ip:${ip}`, RATE_MAX_PER_IP) || rateLimited(`biz:${slug}`, RATE_MAX_PER_BUSINESS)) {
    return fail('Previše upita u kratkom vremenu. Pokušajte ponovo kasnije.', 429);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: business, error: businessError } = await admin
    .from('businesses')
    .select('id, name, owner_email, status, is_active')
    .eq('slug', slug)
    .maybeSingle();

  if (businessError) {
    console.error('business-inquiry: greška pri čitanju firme:', businessError);
    return fail('Upit trenutno nije moguće poslati.', 500);
  }
  if (!business || business.status !== 'active' || business.is_active === false) {
    return fail('Firma nije pronađena ili trenutno ne prima upite.', 404);
  }
  const recipient = typeof business.owner_email === 'string' ? business.owner_email.trim() : '';
  if (!EMAIL_RE.test(recipient)) {
    console.error(`business-inquiry: firma ${slug} nema ispravan owner_email.`);
    return fail('Ova firma trenutno ne može primiti upit putem forme. Nazovite je direktno.', 503);
  }

  // Upit se čuva za dashboard (odvojeno od rezervacija/prihoda) i šalje push firmi.
  // Greška ovdje (npr. tabele još nisu kreirane) ne smije blokirati e-mail.
  try {
    const { data: saved, error: saveError } = await admin
      .from('business_inquiries')
      .insert({ business_id: business.id, name, phone, email: email || null, service: service || null, message })
      .select('id')
      .single();
    if (saveError || !saved) {
      console.error('business-inquiry: upit nije sačuvan:', saveError);
    } else if (isPushConfigured()) {
      const result = await sendPushToBusiness(
        admin as unknown as PushStore,
        business.id,
        buildInquiryPayload({ inquiryId: saved.id, service }),
        sendWebPush
      );
      if (result.failed) console.error(`business-inquiry: push neuspjeh za ${result.failed} uređaja.`);
    }
  } catch (error) {
    console.error('business-inquiry: push/spremanje izuzetak:', error);
  }

  const fromAddress = process.env.INQUIRY_FROM_EMAIL || DEFAULT_FROM_ADDRESS;
  const businessName = cleanLine(business.name, 150) || 'Firma';

  const row = (label: string, value: string) =>
    `<p style="font-size:14px;margin:0 0 6px 0;"><b>${label}:</b> ${escapeHtml(value || 'Nije navedeno')}</p>`;
  const html =
    '<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#111827;">' +
    `<h2 style="color:#d97706;margin:0 0 12px 0;font-size:20px;">Novi upit preko POSLO ONE</h2>` +
    row('Firma', businessName) +
    row('Ime i prezime', name) +
    row('Telefon', phone) +
    row('E-mail', email) +
    row('Usluga', service) +
    `<p style="font-size:14px;margin:12px 0 4px 0;"><b>Poruka:</b></p>` +
    `<p style="font-size:14px;margin:0;white-space:pre-wrap;">${escapeHtml(message)}</p>` +
    '<p style="font-size:12px;color:#6b7280;margin-top:20px;">Upit je poslan putem POSLO ONE kataloga.</p>' +
    '</div>';

  try {
    const resend = new Resend(resendApiKey);
    const result = await resend.emails.send({
      from: `POSLO ONE <${fromAddress}>`,
      to: recipient,
      replyTo: email || undefined,
      subject: `Novi upit: ${service || 'upit s kataloga'} - ${name}`.slice(0, 200),
      html,
    });
    if (result.error) {
      console.error('business-inquiry: Resend greška:', JSON.stringify(result.error));
      return fail('Upit nije poslan. Pokušajte ponovo ili nas nazovite.', 502);
    }
  } catch (error) {
    console.error('business-inquiry: izuzetak pri slanju:', error);
    return fail('Upit nije poslan. Pokušajte ponovo ili nas nazovite.', 502);
  }

  return NextResponse.json({ success: true });
}
