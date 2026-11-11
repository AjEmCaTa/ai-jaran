// Marketing mejl: personalizacija i HTML u POSLO ONE stilu. Čiste funkcije (koristi ih i pregled u panelu).

export type EmailContent = {
  subject: string;
  preheader?: string | null;
  heading?: string | null;
  body: string;
  cta_label?: string | null;
  cta_url?: string | null;
};

export type EmailRecipient = {
  owner_name?: string | null;
  company_name?: string | null;
  city?: string | null;
};

export type EmailContext = {
  siteUrl: string;
  unsubscribeUrl: string;
  reason: string; // "ste registrovali firmu na POSLO ONE"
  address: string; // "Mostar, Bosna i Hercegovina"
};

export const TOKENS = [
  { token: '{{ime}}', label: 'Ime vlasnika (samo ime)' },
  { token: '{{firma}}', label: 'Naziv firme' },
  { token: '{{grad}}', label: 'Grad' },
];

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Prazno ime -> token nestaje zajedno s razmakom ispred ("Pozdrav {{ime}}," -> "Pozdrav,").
export function personalize(text: string, r: EmailRecipient): string {
  const first = (r.owner_name || '').trim().split(/\s+/)[0] || '';
  const values: Record<string, string> = {
    ime: first,
    firma: (r.company_name || '').trim() || 'vaša firma',
    grad: (r.city || '').trim(),
  };
  return text.replace(/ ?\{\{\s*(ime|firma|grad)\s*\}\}/g, (match, key: string) => {
    const v = values[key];
    if (!v) return '';
    return match.startsWith(' ') ? ` ${v}` : v;
  });
}

// Dozvoljeni linkovi u dugmetu: samo https (ili naš sajt).
export function safeUrl(url: string | null | undefined, siteUrl: string): string | null {
  const u = (url || '').trim();
  if (!u) return null;
  if (u.startsWith('/')) return `${siteUrl.replace(/\/$/, '')}${u}`;
  return /^https:\/\/[^\s"'<>]+$/i.test(u) ? u : null;
}

// Jednostavan zapis teksta: prazni red = novi pasus, "- " = stavka liste, **riječ** = podebljano.
export function bodyToHtml(body: string): string {
  const inline = (s: string) => escapeHtml(s).replace(/\*\*(.+?)\*\*/g, '<strong style="color:#0b0f1a">$1</strong>');
  const blocks = body.replace(/\r\n/g, '\n').split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return blocks
    .map((block) => {
      const lines = block.split('\n');
      if (lines.every((l) => /^\s*[-•]\s+/.test(l))) {
        const items = lines
          .map((l) => `<tr><td style="padding:0 10px 8px 0;vertical-align:top;color:#2563eb;font-size:16px;line-height:24px">&#8226;</td><td style="padding:0 0 8px;font-size:16px;line-height:24px;color:#374151">${inline(l.replace(/^\s*[-•]\s+/, ''))}</td></tr>`)
          .join('');
        return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 18px">${items}</table>`;
      }
      return `<p style="margin:0 0 18px;font-size:16px;line-height:26px;color:#374151">${lines.map(inline).join('<br>')}</p>`;
    })
    .join('');
}

export function bodyToText(body: string): string {
  return body.replace(/\*\*(.+?)\*\*/g, '$1').replace(/^\s*[-•]\s+/gm, '• ');
}

export function renderEmail(content: EmailContent, recipient: EmailRecipient, ctx: EmailContext) {
  const p = (s: string | null | undefined) => personalize(s || '', recipient);
  const subject = p(content.subject).slice(0, 200);
  const preheader = p(content.preheader);
  const heading = p(content.heading);
  const body = p(content.body);
  const ctaUrl = safeUrl(content.cta_url, ctx.siteUrl);
  const ctaLabel = p(content.cta_label);
  const site = ctx.siteUrl.replace(/\/$/, '');

  const html = `<!doctype html>
<html lang="bs"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#f3f5f9;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preheader)}&#8203;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f5f9"><tr><td align="center" style="padding:28px 14px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
<tr><td style="padding:0 6px 18px"><a href="${site}" style="text-decoration:none"><img src="${site}/poslo.one.png" width="40" height="40" alt="POSLO ONE" style="display:inline-block;vertical-align:middle;border-radius:10px"><span style="display:inline-block;vertical-align:middle;margin-left:10px;font-size:15px;font-weight:800;letter-spacing:1.5px;color:#0b0f1a">POSLO ONE</span></a></td></tr>
<tr><td style="background:#ffffff;border-radius:18px;border:1px solid #e6e9f0;overflow:hidden">
<div style="height:5px;background:linear-gradient(90deg,#3b82f6,#8b5cf6)"></div>
<div style="padding:34px 32px 30px">
${heading ? `<h1 style="margin:0 0 20px;font-size:26px;line-height:32px;font-weight:800;color:#0b0f1a;letter-spacing:-0.4px">${escapeHtml(heading)}</h1>` : ''}
${bodyToHtml(body)}
${ctaUrl && ctaLabel ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 6px"><tr><td style="border-radius:12px;background:#2563eb"><a href="${escapeHtml(ctaUrl)}" style="display:inline-block;padding:14px 26px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:12px">${escapeHtml(ctaLabel)}</a></td></tr></table>` : ''}
<p style="margin:26px 0 0;font-size:15px;line-height:22px;color:#374151">Pozdrav,<br><strong style="color:#0b0f1a">POSLO ONE tim</strong></p>
</div></td></tr>
<tr><td style="padding:20px 10px 0;font-size:12px;line-height:19px;color:#8a93a6;text-align:center">
Ovaj mejl ste dobili jer ${escapeHtml(ctx.reason)}.<br>
POSLO ONE &middot; ${escapeHtml(ctx.address)} &middot; <a href="mailto:info@poslo.one" style="color:#8a93a6">info@poslo.one</a><br>
<a href="${escapeHtml(ctx.unsubscribeUrl)}" style="color:#6b7280;text-decoration:underline">Odjavi se od ovih mejlova</a>
</td></tr>
</table></td></tr></table>
</body></html>`;

  const text = [
    heading,
    '',
    bodyToText(body),
    '',
    ctaUrl && ctaLabel ? `${ctaLabel}: ${ctaUrl}` : '',
    '',
    'Pozdrav,',
    'POSLO ONE tim',
    '',
    `Ovaj mejl ste dobili jer ${ctx.reason}.`,
    `POSLO ONE · ${ctx.address} · info@poslo.one`,
    `Odjava: ${ctx.unsubscribeUrl}`,
  ]
    .filter((l, i, arr) => !(l === '' && arr[i - 1] === ''))
    .join('\n')
    .trim();

  return { subject, html, text };
}

// Poruka za "Piši lično" (otvara se u mejl programu admina, šalje je on sam).
export function personalPitch(r: EmailRecipient & { category?: string | null }): { subject: string; body: string } {
  const first = (r.owner_name || '').trim().split(/\s+/)[0];
  const firma = (r.company_name || '').trim();
  const subject = firma ? `Online zakazivanje za ${firma}` : 'Online zakazivanje termina';
  const body = [
    `Pozdrav${first ? ` ${first}` : ''},`,
    '',
    'javljam se iz POSLO ONE-a. Pravimo online zakazivanje termina za male firme u BiH.',
    '',
    `Ideja je jednostavna: ${firma || 'vaši klijenti'} ${firma ? 'dobije' : 'dobiju'} link (i QR kod za vrata) preko kojeg klijenti sami vide slobodne termine i zakažu, a vi dobijete obavijest. Manje poziva i poruka, nema zaboravljenih termina jer klijent dobije podsjetnik dan prije.`,
    '',
    'Prvih 30 dana je besplatno, a ako želite, postavim vam sve za 10 minuta preko telefona.',
    '',
    'Možete pogledati ovdje: https://poslo.one',
    '',
    'Ako vas ne zanima, samo mi odgovorite i više vam neću pisati.',
    '',
    'Pozdrav,',
    'Harun, POSLO ONE',
    '060 30 50 153',
  ].join('\n');
  return { subject, body };
}
