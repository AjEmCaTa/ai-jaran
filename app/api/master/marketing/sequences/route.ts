import { NextRequest, NextResponse } from 'next/server';
import { requireMasterAdmin, logMarketing } from '../../../../../utils/masterAuth';
import { ensureSequences, loadSettings, sendMode } from '../../../../../utils/marketingRunner';
import { startOfLocalDay } from '../../../../../utils/marketingPlan';
import { safeUrl } from '../../../../../utils/marketingEmail';

export const dynamic = 'force-dynamic';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://poslo.one').replace(/\/$/, '');
const isId = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v);

export async function GET(request: NextRequest) {
  const auth = await requireMasterAdmin(request);
  if ('response' in auth) return auth.response;
  const { admin } = auth;
  await ensureSequences(admin);

  const [seqs, steps, enrollments, sends, recent, settings, today] = await Promise.all([
    admin.from('marketing_sequences').select('*').order('created_at'),
    admin.from('marketing_sequence_steps').select('*').order('position'),
    admin.from('marketing_enrollments').select('sequence_id, status'),
    admin.from('marketing_sends').select('step_id, status').eq('kind', 'sequence'),
    admin.from('marketing_sends').select('id, kind, to_email, subject, status, error, created_at, sent_at').order('created_at', { ascending: false }).limit(25),
    loadSettings(admin),
    admin.from('marketing_sends').select('id', { count: 'exact', head: true }).eq('kind', 'sequence').in('status', ['sent', 'sending', 'simulated']).gte('created_at', startOfLocalDay(Date.now())),
  ]);
  if (seqs.error || steps.error) return NextResponse.json({ error: 'Nizove nije moguće učitati.' }, { status: 500 });

  const enrollCount: Record<string, { active: number; total: number }> = {};
  for (const e of enrollments.data || []) {
    const c = (enrollCount[e.sequence_id] ||= { active: 0, total: 0 });
    c.total++;
    if (e.status === 'active') c.active++;
  }
  const stepStats: Record<string, Record<string, number>> = {};
  for (const s of sends.data || []) {
    if (!s.step_id) continue;
    const m = (stepStats[s.step_id] ||= {});
    m[s.status] = (m[s.status] || 0) + 1;
  }

  return NextResponse.json({
    sequences: (seqs.data || []).map((s) => ({
      ...s,
      enrolled: enrollCount[s.id] || { active: 0, total: 0 },
      steps: (steps.data || []).filter((st) => st.sequence_id === s.id).map((st) => ({ ...st, stats: stepStats[st.id] || {} })),
    })),
    settings,
    mode: sendMode(),
    sentToday: today.count || 0,
    recent: recent.data || [],
    siteUrl: SITE_URL,
  });
}

const STEP_FIELDS: Record<string, number> = { subject: 200, preheader: 200, heading: 160, body: 6000, cta_label: 60, cta_url: 300 };

export async function PATCH(request: NextRequest) {
  const auth = await requireMasterAdmin(request);
  if ('response' in auth) return auth.response;
  const { admin, email: actor } = auth;
  const body = await request.json().catch(() => null);
  if (!body || typeof body.action !== 'string') return NextResponse.json({ error: 'Neispravan zahtjev.' }, { status: 400 });

  if (body.action === 'approve' || body.action === 'pause') {
    if (!isId(body.id)) return NextResponse.json({ error: 'Neispravan zahtjev.' }, { status: 400 });
    if (body.action === 'approve') {
      const { count } = await admin.from('marketing_sequence_steps').select('id', { count: 'exact', head: true }).eq('sequence_id', body.id).eq('enabled', true);
      if (!count) return NextResponse.json({ error: 'Niz nema nijedan uključen mejl.' }, { status: 400 });
    }
    const update = body.action === 'approve'
      ? { status: 'active', approved_by: actor, approved_at: new Date().toISOString() }
      : { status: 'paused' };
    const { error } = await admin.from('marketing_sequences').update(update).eq('id', body.id);
    if (error) return NextResponse.json({ error: 'Izmjena nije sačuvana.' }, { status: 500 });
    await logMarketing(admin, actor, body.action === 'approve' ? 'sequence.approve' : 'sequence.pause', 'sequence', body.id);
    return NextResponse.json({ success: true });
  }

  if (body.action === 'updateStep') {
    if (!isId(body.stepId)) return NextResponse.json({ error: 'Neispravan zahtjev.' }, { status: 400 });
    const { data: step } = await admin.from('marketing_sequence_steps').select('id, sequence_id').eq('id', body.stepId).maybeSingle();
    if (!step) return NextResponse.json({ error: 'Mejl nije pronađen.' }, { status: 404 });
    const update: Record<string, unknown> = {};
    for (const [k, max] of Object.entries(STEP_FIELDS)) {
      if (!(k in body)) continue;
      const v = typeof body[k] === 'string' ? body[k].trim() : '';
      update[k] = v ? v.slice(0, max) : null;
    }
    if ('subject' in update && !update.subject) return NextResponse.json({ error: 'Naslov mejla ne može biti prazan.' }, { status: 400 });
    if ('body' in update && !update.body) return NextResponse.json({ error: 'Tekst mejla ne može biti prazan.' }, { status: 400 });
    if (update.cta_url && !safeUrl(update.cta_url as string, SITE_URL)) {
      return NextResponse.json({ error: 'Link dugmeta mora počinjati sa https:// ili /' }, { status: 400 });
    }
    if ('delay_days' in body) {
      const d = Number(body.delay_days);
      if (!Number.isInteger(d) || d < 0 || d > 365) return NextResponse.json({ error: 'Dan slanja mora biti između 0 i 365.' }, { status: 400 });
      update.delay_days = d;
    }
    if ('enabled' in body) update.enabled = body.enabled === true;
    if (Object.keys(update).length === 0) return NextResponse.json({ error: 'Nema izmjena.' }, { status: 400 });

    const { error } = await admin.from('marketing_sequence_steps').update(update).eq('id', body.stepId);
    if (error) return NextResponse.json({ error: 'Mejl nije sačuvan.' }, { status: 500 });
    // Izmijenjen sadržaj traži ponovno odobrenje prije nego što se ijedan mejl pošalje.
    const { data: seq } = await admin.from('marketing_sequences').select('status').eq('id', step.sequence_id).single();
    let needsApproval = false;
    if (seq?.status === 'active') {
      await admin.from('marketing_sequences').update({ status: 'paused' }).eq('id', step.sequence_id);
      needsApproval = true;
    }
    await logMarketing(admin, actor, 'step.update', 'step', body.stepId, { fields: Object.keys(update), paused: needsApproval });
    return NextResponse.json({ success: true, needsApproval });
  }

  if (body.action === 'settings') {
    const rows: { key: string; value: unknown; updated_by: string; updated_at: string }[] = [];
    const at = new Date().toISOString();
    if ('sending_enabled' in body) rows.push({ key: 'sending_enabled', value: body.sending_enabled === true, updated_by: actor, updated_at: at });
    if ('daily_limit' in body) {
      const n = Number(body.daily_limit);
      if (!Number.isInteger(n) || n < 1 || n > 500) return NextResponse.json({ error: 'Dnevni limit mora biti od 1 do 500.' }, { status: 400 });
      rows.push({ key: 'daily_limit', value: n, updated_by: actor, updated_at: at });
    }
    if ('footer_address' in body) {
      const a = typeof body.footer_address === 'string' ? body.footer_address.trim().slice(0, 120) : '';
      if (a.length < 3) return NextResponse.json({ error: 'Upišite adresu za podnožje mejla.' }, { status: 400 });
      rows.push({ key: 'footer_address', value: a, updated_by: actor, updated_at: at });
    }
    if (rows.length === 0) return NextResponse.json({ error: 'Nema izmjena.' }, { status: 400 });
    const { error } = await admin.from('marketing_settings').upsert(rows);
    if (error) return NextResponse.json({ error: 'Postavke nisu sačuvane.' }, { status: 500 });
    await logMarketing(admin, actor, 'settings.update', null, null, Object.fromEntries(rows.map((r) => [r.key, r.value])));
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Nepoznata radnja.' }, { status: 400 });
}
