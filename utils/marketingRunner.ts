import type { SupabaseClient } from '@supabase/supabase-js';
import { DEFAULT_SEQUENCES, AUDIENCE_INFO, type SequenceAudience } from './marketingSequences';
import { renderEmail, type EmailContent, type EmailRecipient } from './marketingEmail';
import { planNext, recentlyMailed, startOfLocalDay } from './marketingPlan';
import { normalizeCategory, isSendable, normalizeEmail, isValidEmail } from './marketingContacts';
import { categoryOf } from './catalog';

// Marketing: sinhronizacija kontakata, upis u nizove i slanje. Odvojeno od rezervacija:
// čita businesses/profiles samo za čitanje, a piše isključivo u marketing_* tabele.

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://poslo.one').replace(/\/$/, '');
const FROM = 'POSLO ONE <info@poslo.one>';
const TRIAL_DAYS = 30;
const DAY = 86400000;
const MAX_PER_RUN = 20;

export type Settings = { sending_enabled: boolean; daily_limit: number; footer_address: string };

export async function loadSettings(admin: SupabaseClient): Promise<Settings> {
  const { data } = await admin.from('marketing_settings').select('key, value');
  const map = Object.fromEntries((data || []).map((r) => [r.key, r.value]));
  return {
    sending_enabled: map.sending_enabled === true,
    daily_limit: Math.max(0, Math.min(500, Number(map.daily_limit) || 40)),
    footer_address: typeof map.footer_address === 'string' && map.footer_address.trim() ? map.footer_address.trim() : 'Mostar, Bosna i Hercegovina',
  };
}

// Pravo slanje samo s pravim Resend ključem; na TEST grani ključ je namjerno neispravan -> simulacija.
export function sendMode(): 'live' | 'simulated' {
  const key = process.env.RESEND_API_KEY?.trim() || '';
  return key.startsWith('re_') && !key.startsWith('re_iskljuceno') && key.length > 20 ? 'live' : 'simulated';
}

export async function ensureSequences(admin: SupabaseClient) {
  const { data: existing } = await admin.from('marketing_sequences').select('key');
  const have = new Set((existing || []).map((r) => r.key));
  for (const seq of DEFAULT_SEQUENCES) {
    if (have.has(seq.key)) continue;
    const { data: created, error } = await admin
      .from('marketing_sequences')
      .insert({ key: seq.key, name: seq.name, description: seq.description, audience: seq.audience, status: 'draft' })
      .select('id')
      .single();
    if (error || !created) {
      if (error?.code !== '23505') console.error('Marketing: niz nije napravljen', seq.key, error?.message);
      continue;
    }
    await admin.from('marketing_sequence_steps').insert(seq.steps.map((s, i) => ({ ...s, sequence_id: created.id, position: i + 1 })));
  }
}

export const unsubscribeUrl = (token: string) => `${SITE_URL}/odjava?t=${token}`;

type SendInput = { to: string; content: EmailContent; recipient: EmailRecipient; audience: SequenceAudience; token: string | null; address: string; idempotencyKey: string };

// Jedan mejl preko Resend REST API-ja (ključ ostaje na serveru).
export async function deliver(input: SendInput): Promise<{ status: 'sent' | 'simulated' | 'failed'; providerId?: string; error?: string; subject: string; html: string }> {
  const unsub = input.token ? unsubscribeUrl(input.token) : `${SITE_URL}/odjava`;
  const { subject, html, text } = renderEmail(input.content, input.recipient, {
    siteUrl: SITE_URL,
    unsubscribeUrl: unsub,
    reason: AUDIENCE_INFO[input.audience].reason,
    address: input.address,
  });
  if (sendMode() === 'simulated') return { status: 'simulated', subject, html };
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY!.trim()}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': input.idempotencyKey,
      },
      body: JSON.stringify({
        from: FROM,
        to: [input.to],
        reply_to: 'info@poslo.one',
        subject,
        html,
        text,
        headers: input.token
          ? { 'List-Unsubscribe': `<${SITE_URL}/api/marketing/odjava?t=${input.token}>, <mailto:info@poslo.one?subject=Odjava>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' }
          : undefined,
        tags: [{ name: 'kind', value: 'marketing' }],
      }),
      cache: 'no-store',
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { status: 'failed', error: `${res.status} ${String(json.message || json.name || '').slice(0, 200)}`, subject, html };
    return { status: 'sent', providerId: json.id, subject, html };
  } catch (e) {
    return { status: 'failed', error: (e as Error).message.slice(0, 200), subject, html };
  }
}

// ---------- Sinhronizacija ----------

type Biz = { id: string; name: string | null; owner_email: string | null; city: string | null; phone: string | null; category: string | null; created_at: string; billing_status: string | null; status: string | null };

const mapCategory = (raw: string | null) => {
  const bySlug: Record<string, string> = { 'beauty-saloni': 'frizer', 'dubinsko-ciscenje': 'autopraonica' };
  return bySlug[categoryOf(raw || '')] || normalizeCategory(raw);
};

export async function syncContacts(admin: SupabaseClient) {
  const now = Date.now();
  const [{ data: businesses }, { data: profiles }, { data: sequences }] = await Promise.all([
    admin.from('businesses').select('id, name, owner_email, city, phone, category, created_at, billing_status, status'),
    admin.from('profiles').select('business_id, name'),
    admin.from('marketing_sequences').select('id, audience'),
  ]);
  const ownerName = new Map((profiles || []).filter((p) => p.business_id).map((p) => [p.business_id as string, p.name as string | null]));
  const seqByAudience = new Map((sequences || []).map((s) => [s.audience as SequenceAudience, s.id as string]));
  let linked = 0;
  let enrolled = 0;

  for (const b of (businesses || []) as Biz[]) {
    const email = normalizeEmail(b.owner_email);
    if (!isValidEmail(email)) continue;
    let { data: found } = await admin.from('marketing_contacts').select('id, business_id, legal_basis').eq('business_id', b.id).maybeSingle();
    if (!found) ({ data: found } = await admin.from('marketing_contacts').select('id, business_id, legal_basis').eq('email', email).maybeSingle());
    let contactId = found?.id as string | undefined;
    if (!found) {
      const { data: created } = await admin
        .from('marketing_contacts')
        .upsert(
          { email, business_id: b.id, company_name: b.name, owner_name: ownerName.get(b.id) || null, city: b.city, phone: b.phone, category: mapCategory(b.category), legal_basis: 'customer', created_by: 'sistem' },
          { onConflict: 'email', ignoreDuplicates: true }
        )
        .select('id')
        .maybeSingle();
      contactId = created?.id;
      if (contactId) linked++;
    } else if (!found.business_id || found.legal_basis === 'cold' || found.legal_basis === 'inquiry') {
      // Upit ili hladni kontakt koji je registrovao firmu postaje korisnik (status, npr. odjava, ostaje isti).
      await admin.from('marketing_contacts').update({ business_id: b.id, legal_basis: 'customer' }).eq('id', found.id);
      linked++;
    }
    if (!contactId) continue;

    const trialSeq = seqByAudience.get('trial');
    const paid = b.billing_status === 'active';
    const age = now - Date.parse(b.created_at);
    if (trialSeq && !paid && age < TRIAL_DAYS * DAY) {
      const { data: ins } = await admin
        .from('marketing_enrollments')
        .upsert({ contact_id: contactId, sequence_id: trialSeq, started_at: b.created_at }, { onConflict: 'contact_id,sequence_id', ignoreDuplicates: true })
        .select('id');
      enrolled += ins?.length || 0;
    }
    if (trialSeq && (paid || age >= (TRIAL_DAYS + 1) * DAY)) {
      await admin.from('marketing_enrollments').update({ status: paid ? 'stopped' : 'completed', stop_reason: paid ? 'platio paket' : 'kraj besplatnog perioda' })
        .eq('contact_id', contactId).eq('sequence_id', trialSeq).eq('status', 'active');
    }
    // Firma koja je bila upit prestaje dobijati mejlove za upite.
    const leadSeq = seqByAudience.get('lead');
    if (leadSeq) {
      await admin.from('marketing_enrollments').update({ status: 'stopped', stop_reason: 'registrovao firmu' })
        .eq('contact_id', contactId).eq('sequence_id', leadSeq).eq('status', 'active');
    }
  }

  // Upiti sa sajta (kontakt bez firme, osnov "inquiry", izvor forma) -> niz za upite.
  const leadSeq = seqByAudience.get('lead');
  if (leadSeq) {
    const since = new Date(now - 60 * DAY).toISOString();
    const { data: leads } = await admin
      .from('marketing_contacts')
      .select('id, created_at')
      .eq('legal_basis', 'inquiry')
      .eq('consent_source', 'Forma na sajtu')
      .is('business_id', null)
      .gte('created_at', since);
    for (const l of leads || []) {
      const { data: ins } = await admin
        .from('marketing_enrollments')
        .upsert({ contact_id: l.id, sequence_id: leadSeq, started_at: l.created_at }, { onConflict: 'contact_id,sequence_id', ignoreDuplicates: true })
        .select('id');
      enrolled += ins?.length || 0;
    }
    await admin.from('marketing_enrollments').update({ status: 'completed', stop_reason: 'kraj niza' })
      .eq('sequence_id', leadSeq).eq('status', 'active').lt('started_at', new Date(now - 45 * DAY).toISOString());
  }
  return { linked, enrolled };
}

// ---------- Slanje ----------

type StepRow = EmailContent & { id: string; sequence_id: string; position: number; delay_days: number; enabled: boolean };

export async function runMarketing(admin: SupabaseClient, opts: { actor: string }) {
  const now = Date.now();
  await ensureSequences(admin);
  const sync = await syncContacts(admin);
  const settings = await loadSettings(admin);
  const result = { ...sync, mode: sendMode(), sendingEnabled: settings.sending_enabled, sent: 0, simulated: 0, failed: 0, skipped: 0, limitLeft: 0, note: '' };

  const { count: today } = await admin
    .from('marketing_sends')
    .select('id', { count: 'exact', head: true })
    .eq('kind', 'sequence')
    .in('status', ['sent', 'sending', 'simulated'])
    .gte('created_at', startOfLocalDay(now));
  let left = Math.max(0, settings.daily_limit - (today || 0));
  result.limitLeft = left;
  if (!settings.sending_enabled) {
    result.note = 'Slanje je isključeno u postavkama.';
    return result;
  }
  if (left === 0) {
    result.note = 'Dnevni limit je potrošen.';
    return result;
  }

  const { data: seqs } = await admin.from('marketing_sequences').select('id, audience, status').eq('status', 'active');
  let budget = Math.min(left, MAX_PER_RUN);

  for (const seq of seqs || []) {
    if (budget <= 0) break;
    const { data: steps } = await admin.from('marketing_sequence_steps').select('*').eq('sequence_id', seq.id).order('position');
    const stepRows = (steps || []) as StepRow[];
    const { data: enrollments } = await admin
      .from('marketing_enrollments')
      .select('id, contact_id, started_at, marketing_contacts!inner(id, email, owner_name, company_name, city, status, legal_basis, unsubscribe_token)')
      .eq('sequence_id', seq.id)
      .eq('status', 'active')
      .limit(500);

    for (const e of enrollments || []) {
      if (budget <= 0) break;
      const c = (Array.isArray(e.marketing_contacts) ? e.marketing_contacts[0] : e.marketing_contacts) as {
        id: string; email: string; owner_name: string | null; company_name: string | null; city: string | null; status: string; legal_basis: string; unsubscribe_token: string;
      };
      if (!c) continue;
      if (!isSendable(c)) {
        await admin.from('marketing_enrollments').update({ status: 'stopped', stop_reason: c.legal_basis === 'cold' ? 'hladni kontakt' : `status: ${c.status}` }).eq('id', e.id);
        continue;
      }
      const { data: prior } = await admin.from('marketing_sends').select('step_id, status, sent_at, created_at').eq('contact_id', c.id).order('created_at', { ascending: false }).limit(50);
      const handled = new Set((prior || []).filter((p) => p.step_id).map((p) => p.step_id as string));
      const lastMail = (prior || []).find((p) => p.status === 'sent' || p.status === 'simulated');
      const plan = planNext(stepRows, e.started_at, handled, now);

      for (const s of plan.skip) {
        const { error } = await admin.from('marketing_sends').insert({ kind: 'sequence', contact_id: c.id, sequence_id: seq.id, step_id: s.id, to_email: c.email, subject: stepRows.find((x) => x.id === s.id)?.subject || '', status: 'skipped', error: 'zakasnio, poslan noviji korak' });
        if (!error) result.skipped++;
      }
      if (!plan.send) continue;
      if (recentlyMailed(lastMail?.sent_at || lastMail?.created_at, now)) continue;
      const step = stepRows.find((x) => x.id === plan.send!.id)!;

      // Zauzmi slanje: jedinstveni indeks (kontakt, korak) sprečava dupli mejl i kod istovremenih pokretanja.
      const { data: claim, error: claimErr } = await admin
        .from('marketing_sends')
        .insert({ kind: 'sequence', contact_id: c.id, sequence_id: seq.id, step_id: step.id, to_email: c.email, subject: step.subject, status: 'sending', created_by: opts.actor })
        .select('id')
        .single();
      if (claimErr || !claim) continue;

      const out = await deliver({ to: c.email, content: step, recipient: c, audience: seq.audience as SequenceAudience, token: c.unsubscribe_token, address: settings.footer_address, idempotencyKey: `mkt-${claim.id}` });
      await admin.from('marketing_sends').update({ status: out.status, subject: out.subject, provider_id: out.providerId || null, error: out.error || null, sent_at: out.status === 'failed' ? null : new Date().toISOString() }).eq('id', claim.id);
      if (out.status !== 'failed') await admin.from('marketing_contacts').update({ last_contacted_at: new Date().toISOString() }).eq('id', c.id);
      result[out.status === 'sent' ? 'sent' : out.status === 'simulated' ? 'simulated' : 'failed']++;
      budget--;
    }
  }
  result.limitLeft = Math.max(0, left - result.sent - result.simulated);
  return result;
}

// Upit sa sajta -> kontakt (ne ruši formu ako ne uspije).
export async function captureLead(admin: SupabaseClient, lead: { email?: unknown; name?: unknown; phone?: unknown; message?: unknown; pkg?: unknown }) {
  const email = normalizeEmail(typeof lead.email === 'string' ? lead.email : '');
  if (!isValidEmail(email)) return;
  const str = (v: unknown, n: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, n) : null);
  const { error } = await admin.from('marketing_contacts').upsert(
    {
      email,
      company_name: str(lead.name, 160),
      phone: str(lead.phone, 40),
      notes: [str(lead.pkg, 60) && `Paket: ${str(lead.pkg, 60)}`, str(lead.message, 800)].filter(Boolean).join('\n') || null,
      legal_basis: 'inquiry',
      consent_source: 'Forma na sajtu',
      created_by: 'sajt',
    },
    { onConflict: 'email', ignoreDuplicates: true }
  );
  if (error) console.error('Marketing: upit nije spremljen u kontakte', error.message);
}
