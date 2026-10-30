import type { SupabaseClient } from '@supabase/supabase-js';

// Obavijest klijentu kad firma promijeni status rezervacije iz dashboarda.
// Greška pri slanju NIKAD ne smije poništiti promjenu statusa: funkcija ne baca, vraća true/false.

export type ClientNotifyKind = 'confirmed' | 'cancelled' | 'declined' | 'rescheduled';

type ReservationLike = {
  customer_name?: unknown;
  customer_email?: unknown;
  service_name?: unknown;
  reservation_date?: unknown;
  business_id?: unknown;
};

const FROM_ADDRESS = 'info@poslo.one';

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// '2026-10-28T10:00' -> '28.10.2026. u 10:00'
export function formatReservationDate(value: unknown): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(String(value ?? ''));
  return m ? `${m[3]}.${m[2]}.${m[1]}. u ${m[4]}:${m[5]}` : String(value ?? '');
}

export function buildClientMessage(kind: ClientNotifyKind, partnerName: string, row: ReservationLike) {
  const name = escapeHtml(row.customer_name || '');
  const partner = escapeHtml(partnerName);
  const service = escapeHtml(row.service_name || 'usluga');
  const when = escapeHtml(formatReservationDate(row.reservation_date));

  const copy: Record<ClientNotifyKind, { subject: string; title: string; text: string }> = {
    confirmed: {
      subject: `Termin potvrđen - ${partnerName}`,
      title: 'Vaš termin je potvrđen',
      text: 'Firma je potvrdila vaš termin. Vidimo se u dogovoreno vrijeme.',
    },
    cancelled: {
      subject: `Termin otkazan - ${partnerName}`,
      title: 'Vaš termin je otkazan',
      text: 'Firma je otkazala ovaj termin. Za novi termin ili dodatna pitanja kontaktirajte firmu ili zakažite ponovo preko platforme.',
    },
    declined: {
      subject: `Zahtjev za termin nije prihvaćen - ${partnerName}`,
      title: 'Zahtjev za termin nije prihvaćen',
      text: 'Nažalost, firma ne može prihvatiti ovaj termin. Molimo odaberite drugi termin ili kontaktirajte firmu.',
    },
    rescheduled: {
      subject: `Predložena promjena termina - ${partnerName}`,
      title: 'Firma predlaže novi termin',
      text: 'Firma je predložila novi termin (prikazan ispod). Ako vam ne odgovara, kontaktirajte firmu direktno.',
    },
  };
  const c = copy[kind];
  const html =
    '<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#1f2937;">' +
    '<tr><td style="padding:20px 0;">' +
    `<h2 style="color:#2563eb;margin:0 0 10px 0;font-size:20px;">${c.title}</h2>` +
    `<p style="font-size:14px;margin:0 0 16px 0;">Pozdrav ${name},</p>` +
    `<p style="font-size:14px;margin:0 0 16px 0;">${c.text}</p>` +
    `<p style="font-size:14px;margin:0 0 4px 0;"><b>Usluga:</b> ${service}</p>` +
    `<p style="font-size:14px;margin:0 0 16px 0;"><b>Termin:</b> ${when}</p>` +
    `<p style="font-size:13px;color:#6b7280;margin:0;">S poštovanjem,<br>${partner} &amp; POSLO ONE</p>` +
    '</td></tr></table>';
  return { subject: c.subject, html };
}

export async function notifyClientStatus(
  admin: SupabaseClient,
  kind: ClientNotifyKind,
  row: ReservationLike
): Promise<boolean> {
  try {
    const to = typeof row.customer_email === 'string' ? row.customer_email.trim() : '';
    if (!to.includes('@')) return false;
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('RESEND_API_KEY nije postavljen; mail klijentu nije poslan.');
      return false;
    }
    let partnerName = 'POSLO ONE';
    if (typeof row.business_id === 'string') {
      const { data } = await admin.from('businesses').select('name').eq('id', row.business_id).maybeSingle();
      if (data?.name) partnerName = String(data.name);
    }
    const { subject, html } = buildClientMessage(kind, partnerName, row);
    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from: `${partnerName.replace(/[<>"]/g, '')} <${FROM_ADDRESS}>`,
      to,
      subject,
      html,
    });
    if (result.error) {
      console.error('Resend greska (status klijentu):', JSON.stringify(result.error));
      return false;
    }
    return true;
  } catch (e) {
    console.error('Obavijest klijentu nije poslana:', e);
    return false;
  }
}
