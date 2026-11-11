import { NextRequest, NextResponse } from 'next/server';
import { requireMasterAdmin, logMarketing } from '../../../../../utils/masterAuth';
import {
  sanitizeContact, isLegalBasis, isContactStatus, parseTags, normalizeCategory, maskEmail, MARKETING_CATEGORIES,
} from '../../../../../utils/marketingContacts';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;
const LIST_FIELDS =
  'id, email, company_name, owner_name, category, city, phone, website, notes, tags, legal_basis, consent_source, consent_at, status, import_id, last_contacted_at, replied_at, created_at, updated_at';

// Tekst pretrage ide u PostgREST filter: izbacuju se znakovi koji bi mijenjali sam filter.
const safeSearch = (q: string) => q.replace(/[,()%*\\:"']/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);

function parseConsentDate(v: unknown): string | null | 'invalid' {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v !== 'string') return 'invalid';
  const t = Date.parse(v);
  if (!Number.isFinite(t) || t > Date.now() + 86400000 || t < Date.parse('2000-01-01')) return 'invalid';
  return new Date(t).toISOString();
}

export async function GET(request: NextRequest) {
  const auth = await requireMasterAdmin(request);
  if ('response' in auth) return auth.response;
  const { admin } = auth;
  const p = request.nextUrl.searchParams;
  const page = Math.max(1, Math.min(1000, Number(p.get('page')) || 1));

  let query = admin.from('marketing_contacts').select(LIST_FIELDS, { count: 'exact' });
  const q = safeSearch(p.get('q') || '');
  if (q) {
    const like = `%${q}%`;
    query = query.or(`email.ilike.${like},company_name.ilike.${like},owner_name.ilike.${like},city.ilike.${like},phone.ilike.${like}`);
  }
  const status = p.get('status');
  if (status === 'problematic') query = query.in('status', ['bounced', 'complained']);
  else if (isContactStatus(status)) query = query.eq('status', status);
  const basis = p.get('basis');
  if (basis === 'sendable') query = query.eq('status', 'active').in('legal_basis', ['consent', 'customer', 'inquiry']);
  else if (isLegalBasis(basis)) query = query.eq('legal_basis', basis);
  const category = p.get('category');
  if (category && MARKETING_CATEGORIES.some((c) => c.id === category)) query = query.eq('category', category);
  const city = safeSearch(p.get('city') || '');
  if (city) query = query.ilike('city', city);
  const tag = parseTags(p.get('tag') || '')[0];
  if (tag) query = query.contains('tags', [tag]);

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .order('email', { ascending: true })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (error) {
    console.error('Marketing kontakti GET', error.message);
    return NextResponse.json({ error: 'Kontakte nije moguće učitati.' }, { status: 500 });
  }

  // Brojke za kartice (uvijek za cijelu bazu, ne za filter).
  const base = () => admin.from('marketing_contacts').select('id', { count: 'exact', head: true });
  const [all, sendable, cold, unsub, bad] = await Promise.all([
    base(),
    base().eq('status', 'active').in('legal_basis', ['consent', 'customer', 'inquiry']),
    base().eq('legal_basis', 'cold'),
    base().eq('status', 'unsubscribed'),
    base().in('status', ['bounced', 'complained']),
  ]);

  return NextResponse.json({
    contacts: data || [],
    total: count || 0,
    page,
    pageSize: PAGE_SIZE,
    stats: {
      total: all.count || 0,
      sendable: sendable.count || 0,
      cold: cold.count || 0,
      unsubscribed: unsub.count || 0,
      problematic: bad.count || 0,
    },
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireMasterAdmin(request);
  if ('response' in auth) return auth.response;
  const { admin, email: actor } = auth;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Neispravan zahtjev.' }, { status: 400 });

  const res = sanitizeContact(body);
  if (!res.ok) return NextResponse.json({ error: res.reason }, { status: 400 });
  if (!isLegalBasis(body.legal_basis)) return NextResponse.json({ error: 'Izaberite pravni osnov.' }, { status: 400 });
  const consentAt = parseConsentDate(body.consent_at);
  if (consentAt === 'invalid') return NextResponse.json({ error: 'Neispravan datum pristanka.' }, { status: 400 });
  const consentSource = typeof body.consent_source === 'string' ? body.consent_source.trim().slice(0, 200) || null : null;
  if (body.legal_basis === 'consent' && (!consentAt || !consentSource)) {
    return NextResponse.json({ error: 'Za pristanak upišite kako i kada je kontakt pristao.' }, { status: 400 });
  }

  const { data, error } = await admin
    .from('marketing_contacts')
    .insert({ ...res.contact, legal_basis: body.legal_basis, consent_at: consentAt, consent_source: consentSource, created_by: actor })
    .select(LIST_FIELDS)
    .single();
  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Kontakt s tom email adresom već postoji.' }, { status: 409 });
    console.error('Marketing kontakt POST', error.message);
    return NextResponse.json({ error: 'Kontakt nije sačuvan.' }, { status: 500 });
  }
  await logMarketing(admin, actor, 'contact.create', 'contact', data.id, { legal_basis: body.legal_basis });
  return NextResponse.json({ contact: data });
}

const TEXT_FIELDS: Record<string, number> = { company_name: 160, owner_name: 120, city: 80, phone: 40, website: 200, notes: 1000 };

export async function PATCH(request: NextRequest) {
  const auth = await requireMasterAdmin(request);
  if ('response' in auth) return auth.response;
  const { admin, email: actor } = auth;
  const body = await request.json().catch(() => null);
  if (!body || typeof body.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(body.id)) {
    return NextResponse.json({ error: 'Neispravan zahtjev.' }, { status: 400 });
  }
  const { data: current } = await admin.from('marketing_contacts').select(LIST_FIELDS).eq('id', body.id).maybeSingle();
  if (!current) return NextResponse.json({ error: 'Kontakt nije pronađen.' }, { status: 404 });

  const update: Record<string, unknown> = {};
  for (const [k, max] of Object.entries(TEXT_FIELDS)) {
    if (!(k in body)) continue;
    const v = typeof body[k] === 'string' ? (k === 'notes' ? body[k].trim() : body[k].replace(/\s+/g, ' ').trim()) : '';
    update[k] = v ? v.slice(0, max) : null;
  }
  if ('category' in body) update.category = normalizeCategory(typeof body.category === 'string' ? body.category : null);
  if ('tags' in body) update.tags = parseTags(body.tags);

  if ('legal_basis' in body) {
    if (!isLegalBasis(body.legal_basis)) return NextResponse.json({ error: 'Neispravan pravni osnov.' }, { status: 400 });
    update.legal_basis = body.legal_basis;
  }
  if ('consent_at' in body) {
    const d = parseConsentDate(body.consent_at);
    if (d === 'invalid') return NextResponse.json({ error: 'Neispravan datum pristanka.' }, { status: 400 });
    update.consent_at = d;
  }
  if ('consent_source' in body) update.consent_source = typeof body.consent_source === 'string' ? body.consent_source.trim().slice(0, 200) || null : null;
  const nextBasis = (update.legal_basis ?? current.legal_basis) as string;
  const nextConsentAt = 'consent_at' in update ? update.consent_at : current.consent_at;
  const nextConsentSource = 'consent_source' in update ? update.consent_source : current.consent_source;
  if (nextBasis === 'consent' && (!nextConsentAt || !nextConsentSource)) {
    return NextResponse.json({ error: 'Za pristanak upišite kako i kada je kontakt pristao.' }, { status: 400 });
  }

  if ('status' in body) {
    // Ručno se kontakt može samo odjaviti. Odjavljen, neispravan ili spam se ne vraća ručno na aktivan.
    if (body.status !== current.status) {
      if (body.status !== 'unsubscribed') {
        return NextResponse.json({ error: 'Odjavljen kontakt se ne može ručno ponovo aktivirati. Mora se sam ponovo prijaviti.' }, { status: 400 });
      }
      update.status = 'unsubscribed';
    }
  }
  if ('replied' in body) update.replied_at = body.replied ? new Date().toISOString() : null;

  // Polja koja se nisu stvarno promijenila se ne šalju (i ne upisuju u evidenciju).
  const same = (x: unknown, y: unknown) => JSON.stringify(x ?? null) === JSON.stringify(y ?? null)
    || (typeof x === 'string' && typeof y === 'string' && Date.parse(x) === Date.parse(y) && /^\d{4}-/.test(x));
  const cur = current as Record<string, unknown>;
  for (const k of Object.keys(update)) if (same(update[k], cur[k])) delete update[k];
  if (Object.keys(update).length === 0) {
    const { data: unchanged } = await admin.from('marketing_contacts').select(LIST_FIELDS).eq('id', body.id).single();
    return NextResponse.json({ contact: unchanged });
  }

  const { data, error } = await admin.from('marketing_contacts').update(update).eq('id', body.id).select(LIST_FIELDS).single();
  if (error) {
    console.error('Marketing kontakt PATCH', error.message);
    return NextResponse.json({ error: 'Izmjena nije sačuvana.' }, { status: 500 });
  }
  const details: Record<string, unknown> = { fields: Object.keys(update) };
  if (update.legal_basis && update.legal_basis !== current.legal_basis) details.legal_basis = [current.legal_basis, update.legal_basis];
  if (update.status) details.status = [current.status, update.status];
  await logMarketing(admin, actor, 'contact.update', 'contact', body.id, details);
  return NextResponse.json({ contact: data });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireMasterAdmin(request);
  if ('response' in auth) return auth.response;
  const { admin, email: actor } = auth;
  const id = request.nextUrl.searchParams.get('id') || '';
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Neispravan zahtjev.' }, { status: 400 });
  const { data, error } = await admin.from('marketing_contacts').delete().eq('id', id).select('email').maybeSingle();
  if (error) return NextResponse.json({ error: 'Kontakt nije obrisan.' }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Kontakt nije pronađen.' }, { status: 404 });
  await logMarketing(admin, actor, 'contact.delete', 'contact', id, { email: maskEmail(data.email) });
  return NextResponse.json({ success: true });
}
