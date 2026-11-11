import { NextRequest, NextResponse } from 'next/server';
import { requireMasterAdmin, logMarketing } from '../../../../../utils/masterAuth';
import { deliver, loadSettings, sendMode } from '../../../../../utils/marketingRunner';
import { checkRateLimit } from '../../../../../utils/rateLimit';
import type { SequenceAudience } from '../../../../../utils/marketingSequences';

export const dynamic = 'force-dynamic';

// Test mejl jednog koraka, samo na email prijavljenog admina.
export async function POST(request: NextRequest) {
  const auth = await requireMasterAdmin(request);
  if ('response' in auth) return auth.response;
  const { admin, email } = auth;
  const rl = checkRateLimit(`mkt-test:${email}`, 10, 3600000);
  if (!rl.allowed) return NextResponse.json({ error: 'Previše test mejlova. Pokušajte za sat vremena.' }, { status: 429 });

  const body = await request.json().catch(() => null);
  const stepId = typeof body?.stepId === 'string' ? body.stepId : '';
  if (!/^[0-9a-f-]{36}$/i.test(stepId)) return NextResponse.json({ error: 'Neispravan zahtjev.' }, { status: 400 });
  const { data: step } = await admin.from('marketing_sequence_steps').select('*, marketing_sequences!inner(id, audience)').eq('id', stepId).maybeSingle();
  if (!step) return NextResponse.json({ error: 'Korak nije pronađen.' }, { status: 404 });
  const seq = (Array.isArray(step.marketing_sequences) ? step.marketing_sequences[0] : step.marketing_sequences) as { id: string; audience: SequenceAudience };
  const settings = await loadSettings(admin);

  const out = await deliver({
    to: email,
    content: step,
    recipient: { owner_name: 'Harun', company_name: 'Test firma', city: 'Mostar' },
    audience: seq.audience,
    token: null,
    address: settings.footer_address,
    idempotencyKey: `mkt-test-${stepId}-${Date.now()}`,
  });
  await admin.from('marketing_sends').insert({
    kind: 'test', sequence_id: seq.id, step_id: stepId, to_email: email, subject: out.subject, status: out.status,
    provider_id: out.providerId || null, error: out.error || null, created_by: email, sent_at: out.status === 'failed' ? null : new Date().toISOString(),
  });
  await logMarketing(admin, email, 'test.send', 'step', stepId, { status: out.status });
  if (out.status === 'failed') return NextResponse.json({ error: `Test mejl nije poslan (${out.error}).` }, { status: 502 });
  return NextResponse.json({ status: out.status, mode: sendMode(), to: email });
}
