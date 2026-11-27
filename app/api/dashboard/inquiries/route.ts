import { NextRequest, NextResponse } from 'next/server';
import { getOwnerContext } from '../../../../utils/ownerAuth';
import { isStage, parseDay, parseMoney, statusForStage } from '../../../../utils/jobs';
import { sendJobReviewRequest } from '../../../../utils/growthEmails';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const COLUMNS =
  'id, name, phone, email, service, message, status, created_at, stage, quote, deposit, paid, costs, note, started_on, finished_on, source, review_sent_at';

const clean = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export async function GET(request: NextRequest) {
  const owner = await getOwnerContext(request);
  if (owner.response) return owner.response;
  const { admin, businessId } = owner.context;

  const { data, error } = await admin
    .from('business_inquiries')
    .select(COLUMNS)
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) {
    console.error('inquiries list:', error);
    return NextResponse.json({ error: 'Upite nije moguće učitati.', inquiries: [] }, { status: 500 });
  }
  return NextResponse.json({ inquiries: data || [] });
}

// Izmjena upita: stari način (status Novi/Riješen) ili posao (faza, iznosi, bilješka, datumi).
export async function PATCH(request: NextRequest) {
  const owner = await getOwnerContext(request);
  if (owner.response) return owner.response;
  const { admin, businessId } = owner.context;

  const body = await request.json().catch(() => null);
  const id = typeof body?.id === 'string' ? body.id : '';
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Neispravan zahtjev.' }, { status: 400 });

  const update: Record<string, unknown> = {};
  if ('status' in (body || {})) {
    if (body.status !== 'new' && body.status !== 'handled') return NextResponse.json({ error: 'Neispravan status.' }, { status: 400 });
    update.status = body.status;
    update.stage = body.status === 'new' ? 'new' : null; // "Riješen" bez faze se prikazuje kao Kontaktiran
  }
  if ('stage' in (body || {})) {
    if (!isStage(body.stage)) return NextResponse.json({ error: 'Neispravna faza.' }, { status: 400 });
    update.stage = body.stage;
    update.status = statusForStage(body.stage);
  }
  for (const key of ['quote', 'deposit', 'paid', 'costs'] as const) {
    if (!(key in (body || {}))) continue;
    const v = parseMoney(body[key]);
    if (v === undefined) return NextResponse.json({ error: 'Iznos nije ispravan.' }, { status: 400 });
    update[key] = v;
  }
  for (const key of ['started_on', 'finished_on'] as const) {
    if (!(key in (body || {}))) continue;
    const v = parseDay(body[key]);
    if (v === undefined) return NextResponse.json({ error: 'Datum nije ispravan.' }, { status: 400 });
    update[key] = v;
  }
  if ('note' in (body || {})) update.note = clean(body.note, 2000) || null;
  // Završen posao bez datuma završetka dobija današnji dan.
  if (update.stage === 'done' && !('finished_on' in update)) {
    const { data: cur } = await admin.from('business_inquiries').select('finished_on').eq('id', id).eq('business_id', businessId).maybeSingle();
    if (!cur?.finished_on) update.finished_on = new Date().toISOString().slice(0, 10);
  }
  if (!Object.keys(update).length) return NextResponse.json({ error: 'Nema izmjena.' }, { status: 400 });
  update.updated_at = new Date().toISOString();

  const { data, error } = await admin
    .from('business_inquiries')
    .update(update)
    .eq('id', id)
    .eq('business_id', businessId)
    .select(COLUMNS)
    .maybeSingle();

  if (error) return NextResponse.json({ error: 'Upit nije moguće izmijeniti.' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Upit nije pronađen.' }, { status: 404 });
  return NextResponse.json({ inquiry: data });
}

// Ručno dodan posao (klijent javio telefonom ili uživo) ili, uz action=review, molba za recenziju.
export async function POST(request: NextRequest) {
  const owner = await getOwnerContext(request);
  if (owner.response) return owner.response;
  const { admin, businessId } = owner.context;
  const body = await request.json().catch(() => null);

  if (body?.action === 'review') {
    const id = typeof body?.id === 'string' ? body.id : '';
    if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Neispravan zahtjev.' }, { status: 400 });
    const result = await sendJobReviewRequest(admin, businessId, id);
    if (result === 'sent') {
      const { data } = await admin.from('business_inquiries').select(COLUMNS).eq('id', id).eq('business_id', businessId).maybeSingle();
      return NextResponse.json({ success: true, inquiry: data });
    }
    const messages: Record<string, string> = {
      no_email: 'Klijent nije ostavio e-mail adresu.',
      no_link: 'Prvo dodajte link za Google recenzije u Podacima o firmi.',
      already: 'Molba za recenziju je već poslana ovom klijentu.',
      failed: 'E-mail nije poslan. Pokušajte ponovo.',
    };
    return NextResponse.json({ error: messages[result] || messages.failed }, { status: result === 'failed' ? 502 : 409 });
  }

  const name = clean(body?.name, 120);
  if (!name) return NextResponse.json({ error: 'Upišite ime klijenta.' }, { status: 400 });
  const email = clean(body?.email, 200);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'E-mail adresa nije ispravna.' }, { status: 400 });
  const stage = isStage(body?.stage) ? body.stage : 'agreed';
  const row: Record<string, unknown> = {
    business_id: businessId,
    name,
    phone: clean(body?.phone, 40),
    email: email || null,
    service: clean(body?.service, 200) || null,
    message: clean(body?.message, 2000),
    stage,
    status: statusForStage(stage),
    source: 'manual',
    note: clean(body?.note, 2000) || null,
    updated_at: new Date().toISOString(),
  };
  for (const key of ['quote', 'deposit', 'paid', 'costs'] as const) {
    const v = parseMoney(body?.[key]);
    if (v === undefined) return NextResponse.json({ error: 'Iznos nije ispravan.' }, { status: 400 });
    row[key] = v;
  }
  for (const key of ['started_on', 'finished_on'] as const) {
    const v = parseDay(body?.[key]);
    if (v === undefined) return NextResponse.json({ error: 'Datum nije ispravan.' }, { status: 400 });
    row[key] = v;
  }
  if (stage === 'done' && !row.finished_on) row.finished_on = new Date().toISOString().slice(0, 10);

  const { data, error } = await admin.from('business_inquiries').insert(row).select(COLUMNS).single();
  if (error) {
    console.error('job insert:', error);
    return NextResponse.json({ error: 'Posao nije sačuvan.' }, { status: 500 });
  }
  return NextResponse.json({ inquiry: data });
}

// Brisanje samo ručno dodanih poslova (upiti s javnog profila ostaju kao zapis).
export async function DELETE(request: NextRequest) {
  const owner = await getOwnerContext(request);
  if (owner.response) return owner.response;
  const { admin, businessId } = owner.context;
  const id = request.nextUrl.searchParams.get('id') || '';
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Neispravan zahtjev.' }, { status: 400 });
  const { data, error } = await admin
    .from('business_inquiries')
    .delete()
    .eq('id', id)
    .eq('business_id', businessId)
    .eq('source', 'manual')
    .select('id')
    .maybeSingle();
  if (error) return NextResponse.json({ error: 'Posao nije obrisan.' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Može se obrisati samo ručno dodan posao.' }, { status: 409 });
  return NextResponse.json({ success: true });
}
