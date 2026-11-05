import type { SupabaseClient } from '@supabase/supabase-js';

// Mailovi koji firmi donose posao: molba za Google recenziju i poziv klijentu da ponovo zakaže.
// Nikad ne bacaju grešku prema pozivaocu; vraćaju true/false.

const FROM_ADDRESS = 'info@poslo.one';
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://poslo.one').replace(/\/$/, '');

type Row = {
  id?: unknown;
  business_id?: unknown;
  customer_name?: unknown;
  customer_email?: unknown;
  customer_phone?: unknown;
  service_name?: unknown;
  reservation_date?: unknown;
};

export const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// Dozvoljeni su samo http(s) linkovi; sve ostalo se odbacuje.
export function safeHttpUrl(value: unknown): string {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : '';
  } catch {
    return '';
  }
}

function layout(title: string, bodyHtml: string, buttonText: string, buttonUrl: string, partner: string) {
  return (
    '<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#1f2937;">' +
    '<tr><td style="padding:20px 0;">' +
    `<h2 style="color:#111827;margin:0 0 12px 0;font-size:20px;">${title}</h2>` +
    bodyHtml +
    `<p style="margin:22px 0;"><a href="${escapeHtml(buttonUrl)}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px;padding:12px 22px;border-radius:10px;">${buttonText}</a></p>` +
    `<p style="font-size:13px;color:#6b7280;margin:0;">S poštovanjem,<br>${escapeHtml(partner)}</p>` +
    '</td></tr></table>'
  );
}

export function buildReviewMessage(partnerName: string, row: Row, reviewUrl: string) {
  const name = escapeHtml(row.customer_name || '');
  const service = escapeHtml(row.service_name || 'usluga');
  const html = layout(
    'Kako ste zadovoljni?',
    `<p style="font-size:14px;margin:0 0 12px 0;">Pozdrav${name ? ' ' + name : ''},</p>` +
      `<p style="font-size:14px;margin:0 0 12px 0;">Hvala što ste bili kod nas (${service}). Ako ste zadovoljni, bili bismo jako zahvalni na kratkoj Google recenziji. Treba manje od minute, a nama puno znači.</p>`,
    'Ostavi recenziju',
    reviewUrl,
    partnerName
  );
  return { subject: `Hvala na posjeti - ${partnerName}`, html };
}

export function buildRebookMessage(partnerName: string, row: Row, bookingUrl: string) {
  const name = escapeHtml(row.customer_name || '');
  const service = escapeHtml(row.service_name || 'uslugu');
  const html = layout(
    'Vrijeme je za novi termin?',
    `<p style="font-size:14px;margin:0 0 12px 0;">Pozdrav${name ? ' ' + name : ''},</p>` +
      `<p style="font-size:14px;margin:0 0 12px 0;">Prošlo je neko vrijeme od vaše posljednje posjete (${service}). Ako želite ponovo, slobodne termine vidite i zakazujete za par sekundi.</p>`,
    'Zakaži termin',
    bookingUrl,
    partnerName
  );
  return { subject: `Vrijeme za novi termin? - ${partnerName}`, html };
}

async function send(to: string, partnerName: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !to.includes('@')) return false;
  const { Resend } = await import('resend');
  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from: `${partnerName.replace(/[<>"]/g, '')} <${FROM_ADDRESS}>`,
    to,
    subject,
    html,
  });
  if (result.error) {
    console.error('Resend greska:', JSON.stringify(result.error));
    return false;
  }
  return true;
}

// Nakon "Završi": jedna molba po rezervaciji, samo ako firma ima Google link i klijent email.
export async function sendReviewRequest(admin: SupabaseClient, row: Row): Promise<boolean> {
  try {
    const to = typeof row.customer_email === 'string' ? row.customer_email.trim() : '';
    if (!to.includes('@') || typeof row.business_id !== 'string' || typeof row.id !== 'string') return false;
    const { data: business } = await admin
      .from('businesses')
      .select('name, google_review_url')
      .eq('id', row.business_id)
      .maybeSingle();
    const reviewUrl = safeHttpUrl(business?.google_review_url);
    if (!reviewUrl) return false;
    // Oznaka se postavlja prije slanja i samo ako još nije postavljena: nema duplih mailova.
    const { data: claimed } = await admin
      .from('reservations')
      .update({ review_requested_at: new Date().toISOString() })
      .eq('id', row.id)
      .is('review_requested_at', null)
      .select('id')
      .maybeSingle();
    if (!claimed) return false;
    const partner = String(business?.name || 'POSLO ONE');
    const { subject, html } = buildReviewMessage(partner, row, reviewUrl);
    const ok = await send(to, partner, subject, html);
    if (!ok) await admin.from('reservations').update({ review_requested_at: null }).eq('id', row.id);
    return ok;
  } catch (e) {
    console.error('Molba za recenziju nije poslana:', e);
    return false;
  }
}

const customerKey = (r: Row) =>
  String(r.customer_email || r.customer_phone || r.customer_name || '').trim().toLocaleLowerCase('bs');

// '2026-10-28T10:00' -> ms (lokalno vrijeme nije bitno za razmak od nekoliko sedmica)
const whenMs = (value: unknown) => {
  const t = Date.parse(String(value ?? '').slice(0, 16));
  return Number.isFinite(t) ? t : null;
};

// Poziva cron: za firme s uključenim pozivom šalje mail klijentima čiji je zadnji završeni termin
// stariji od N sedmica i koji od tada nisu ništa zakazali. Najviše `limit` mailova po pozivu.
type Sender = (to: string, partnerName: string, subject: string, html: string) => Promise<boolean>;

export async function processRebookReminders(admin: SupabaseClient, now = Date.now(), limit = 20, sender: Sender = send) {
  let sent = 0;
  const { data: businesses, error } = await admin
    .from('businesses')
    .select('id, name, slug, rebook_weeks')
    .not('rebook_weeks', 'is', null)
    .eq('is_active', true);
  if (error) throw error;

  for (const b of businesses || []) {
    if (sent >= limit) break;
    const weeks = Number(b.rebook_weeks);
    if (!Number.isFinite(weeks) || weeks < 1 || !b.slug) continue;
    const { data: rows, error: rowsError } = await admin
      .from('reservations')
      .select('id, business_id, customer_name, customer_email, customer_phone, service_name, reservation_date, status, rebook_sent_at')
      .eq('business_id', b.id);
    if (rowsError) throw rowsError;
    const all = rows || [];
    const latestByCustomer = new Map<string, number>();
    for (const r of all) {
      if (String(r.status || '').toLowerCase().startsWith('otkaz')) continue;
      const t = whenMs(r.reservation_date);
      const k = customerKey(r);
      if (t === null || !k) continue;
      latestByCustomer.set(k, Math.max(latestByCustomer.get(k) || 0, t));
    }
    const cutoff = now - weeks * 7 * 86400000;
    const already = new Set(all.filter((r) => r.rebook_sent_at).map(customerKey));
    for (const r of all) {
      if (sent >= limit) break;
      if (r.rebook_sent_at || !String(r.status || '').toLowerCase().startsWith('zavr')) continue;
      const k = customerKey(r);
      const t = whenMs(r.reservation_date);
      if (!k || t === null || already.has(k)) continue;
      if (t > cutoff || (latestByCustomer.get(k) || 0) > t) continue; // prerano ili već ima noviji termin
      const to = typeof r.customer_email === 'string' ? r.customer_email.trim() : '';
      if (!to.includes('@')) continue;
      const { data: claimed } = await admin
        .from('reservations')
        .update({ rebook_sent_at: new Date(now).toISOString() })
        .eq('id', r.id)
        .is('rebook_sent_at', null)
        .select('id')
        .maybeSingle();
      if (!claimed) continue;
      const partner = String(b.name || 'POSLO ONE');
      const { subject, html } = buildRebookMessage(partner, r, `${SITE_URL}/katalog/${b.slug}`);
      const ok = await sender(to, partner, subject, html).catch(() => false);
      if (ok) {
        sent += 1;
        already.add(k);
      } else {
        await admin.from('reservations').update({ rebook_sent_at: null }).eq('id', r.id);
      }
    }
  }
  return { rebookSent: sent };
}
