import { NextRequest, NextResponse } from 'next/server';
import { requireMasterAdmin, logMarketing } from '../../../../../utils/masterAuth';
import { sanitizeContact, isLegalBasis, MAX_IMPORT_ROWS, type ContactInput } from '../../../../../utils/marketingContacts';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const chunk = <T,>(list: T[], size: number) => Array.from({ length: Math.ceil(list.length / size) }, (_, i) => list.slice(i * size, i * size + size));

// CSV se čita u pregledniku; server ponovo provjerava svaki red i nikad ne prepisuje postojeće kontakte.
// dryRun: true -> samo pregled (koliko je novih, koliko već postoji). Bez dryRun -> upis.
export async function POST(request: NextRequest) {
  const auth = await requireMasterAdmin(request);
  if ('response' in auth) return auth.response;
  const { admin, email: actor } = auth;
  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.contacts)) return NextResponse.json({ error: 'Neispravan zahtjev.' }, { status: 400 });
  if (body.contacts.length === 0) return NextResponse.json({ error: 'Fajl nema nijedan kontakt.' }, { status: 400 });
  if (body.contacts.length > MAX_IMPORT_ROWS) {
    return NextResponse.json({ error: `Najviše ${MAX_IMPORT_ROWS} kontakata po uvozu. Podijelite fajl.` }, { status: 400 });
  }
  if (!isLegalBasis(body.legalBasis)) return NextResponse.json({ error: 'Izaberite pravni osnov za ovaj uvoz.' }, { status: 400 });
  const source = typeof body.source === 'string' ? body.source.trim().slice(0, 200) : '';
  if (!source) return NextResponse.json({ error: 'Upišite odakle su kontakti (izvor).' }, { status: 400 });
  let consentAt: string | null = null;
  if (body.legalBasis === 'consent') {
    const t = typeof body.consentAt === 'string' ? Date.parse(body.consentAt) : NaN;
    if (!Number.isFinite(t) || t > Date.now() + 86400000) return NextResponse.json({ error: 'Za pristanak upišite datum pristanka.' }, { status: 400 });
    consentAt = new Date(t).toISOString();
  }

  // Redovi koje je preglednik već izbacio (neispravni, ponovljeni) ulaze u izvještaj uvoza.
  const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.min(Math.floor(v), MAX_IMPORT_ROWS * 2) : 0);
  const skippedInvalid = n(body.skippedInvalid);
  const skippedDuplicates = n(body.skippedDuplicates);
  const fileRows = Math.max(n(body.fileRows), body.contacts.length);

  const valid: ContactInput[] = [];
  const seen = new Set<string>();
  let invalid = 0;
  let duplicatesInFile = 0;
  for (const raw of body.contacts) {
    const res = sanitizeContact(raw && typeof raw === 'object' ? raw : {});
    if (!res.ok) { invalid++; continue; }
    if (seen.has(res.contact.email)) { duplicatesInFile++; continue; }
    seen.add(res.contact.email);
    valid.push(res.contact);
  }

  const existing = new Set<string>();
  for (const part of chunk(valid.map((c) => c.email), 200)) {
    const { data, error } = await admin.from('marketing_contacts').select('email').in('email', part);
    if (error) {
      console.error('Marketing uvoz: provjera postojećih', error.message);
      return NextResponse.json({ error: 'Provjera postojećih kontakata nije uspjela.' }, { status: 500 });
    }
    for (const r of data || []) existing.add(r.email);
  }
  const fresh = valid.filter((c) => !existing.has(c.email));

  if (body.dryRun) {
    return NextResponse.json({
      newCount: fresh.length,
      existingCount: existing.size,
      existing: [...existing].slice(0, 50),
      invalid,
      duplicatesInFile,
    });
  }

  const fileName = typeof body.fileName === 'string' ? body.fileName.slice(0, 200) : null;
  const { data: imp, error: impErr } = await admin
    .from('marketing_imports')
    .insert({ file_name: fileName, legal_basis: body.legalBasis, source, total_rows: fileRows, created_by: actor })
    .select('id')
    .single();
  if (impErr || !imp) {
    console.error('Marketing uvoz: zapis uvoza', impErr?.message);
    return NextResponse.json({ error: 'Uvoz nije pokrenut.' }, { status: 500 });
  }

  let inserted = 0;
  for (const part of chunk(fresh, 500)) {
    const rows = part.map((c) => ({
      ...c,
      legal_basis: body.legalBasis,
      consent_source: body.legalBasis === 'consent' ? source : null,
      consent_at: consentAt,
      import_id: imp.id,
      created_by: actor,
    }));
    // ignoreDuplicates: ako je neko u međuvremenu dodao isti email, postojeći ostaje netaknut.
    const { data, error } = await admin.from('marketing_contacts').upsert(rows, { onConflict: 'email', ignoreDuplicates: true }).select('id');
    if (error) {
      console.error('Marketing uvoz: upis', error.message);
      await admin.from('marketing_imports').update({ inserted, duplicates: existing.size + duplicatesInFile + skippedDuplicates, invalid: invalid + skippedInvalid }).eq('id', imp.id);
      await logMarketing(admin, actor, 'import.failed', 'import', imp.id, { inserted, error: error.message.slice(0, 200) });
      return NextResponse.json({ error: `Uvoz je prekinut nakon ${inserted} kontakata.`, inserted }, { status: 500 });
    }
    inserted += data?.length || 0;
  }
  const duplicates = existing.size + duplicatesInFile + skippedDuplicates + (fresh.length - inserted);
  invalid += skippedInvalid;
  await admin.from('marketing_imports').update({ inserted, duplicates, invalid }).eq('id', imp.id);
  await logMarketing(admin, actor, 'import.done', 'import', imp.id, {
    file: fileName, legal_basis: body.legalBasis, source, total: fileRows, inserted, duplicates, invalid,
  });
  return NextResponse.json({ importId: imp.id, inserted, duplicates, invalid });
}
