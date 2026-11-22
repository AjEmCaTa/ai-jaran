import { NextRequest, NextResponse } from 'next/server';
import { requireMasterAdmin } from '../../../../utils/masterAuth';
import { BANK_KEYS, bankReference } from '../../../../utils/billingAccess';

// Master panel: podaci za uplatnicu i ručna potvrda uplata.
export async function GET(request: NextRequest) {
  const auth = await requireMasterAdmin(request);
  if ('response' in auth) return auth.response;
  const { admin } = auth;
  const [{ data: cfg }, { data: firms }] = await Promise.all([
    admin.from('billing_config').select('key, value').like('key', 'bank:%'),
    admin.from('businesses').select('id, name, owner_email, plan, plan_until, billing_status, billing_provider, created_at').order('created_at', { ascending: false }),
  ]);
  const bank: Record<string, string> = {};
  for (const row of cfg || []) bank[String(row.key).slice(5)] = String(row.value || '');
  return NextResponse.json({
    bank,
    firms: (firms || []).map((f) => ({ ...f, reference: bankReference(f.id) })),
  });
}

// Spremanje podataka za uplatnicu.
export async function PUT(request: NextRequest) {
  const auth = await requireMasterAdmin(request);
  if ('response' in auth) return auth.response;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Neispravan zahtjev.' }, { status: 400 });
  const rows = BANK_KEYS.map((k) => ({
    key: `bank:${k}`,
    value: typeof body[k] === 'string' ? body[k].trim().slice(0, 200) : '',
    updated_at: new Date().toISOString(),
  }));
  const { error } = await auth.admin.from('billing_config').upsert(rows);
  if (error) return NextResponse.json({ error: 'Podaci nisu sačuvani.' }, { status: 500 });
  return NextResponse.json({ success: true });
}

// Potvrda uplate uplatnicom: paket se produži za izabrani broj mjeseci.
export async function POST(request: NextRequest) {
  const auth = await requireMasterAdmin(request);
  if ('response' in auth) return auth.response;
  const body = await request.json().catch(() => null);
  const id = typeof body?.businessId === 'string' && /^[0-9a-f-]{36}$/i.test(body.businessId) ? body.businessId : null;
  const plan = body?.plan === 'starter' || body?.plan === 'pro' ? body.plan : null;
  const months = Number(body?.months);
  if (!id || !plan || !Number.isInteger(months) || months < 1 || months > 12) {
    return NextResponse.json({ error: 'Izaberite firmu, paket i broj mjeseci (1–12).' }, { status: 400 });
  }
  const { data: firm } = await auth.admin.from('businesses').select('plan_until, billing_provider').eq('id', id).maybeSingle();
  if (!firm) return NextResponse.json({ error: 'Firma nije pronađena.' }, { status: 404 });
  if (firm.billing_provider === 'dodo') return NextResponse.json({ error: 'Ova firma plaća karticom preko Dodoa.' }, { status: 409 });
  const start = Math.max(Date.now(), firm.plan_until ? Date.parse(firm.plan_until) : 0);
  const until = new Date(start);
  until.setMonth(until.getMonth() + months);
  const { error } = await auth.admin
    .from('businesses')
    .update({ billing_provider: 'bank', billing_status: 'active', plan, plan_until: until.toISOString() })
    .eq('id', id);
  if (error) return NextResponse.json({ error: 'Uplata nije evidentirana.' }, { status: 500 });
  return NextResponse.json({ success: true, planUntil: until.toISOString() });
}
