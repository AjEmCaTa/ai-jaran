import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { getOwnerContext } from '../../../../utils/ownerAuth';
import { IMAGE_TYPES, MEDIA_BUCKET, MEDIA_MAX_BYTES, coverFolder, getCover, sniffImage, sortKey } from '../../../../utils/gallery';

// Naslovna slika javne stranice firme: jedna slika; nova zamijeni staru.
export async function GET(request: NextRequest) {
  const result = await getOwnerContext(request);
  if (result.response) return result.response;
  const { admin, businessId } = result.context;
  return NextResponse.json({ cover: await getCover(admin, businessId) });
}

export async function POST(request: NextRequest) {
  const result = await getOwnerContext(request);
  if (result.response) return result.response;
  const { admin, businessId } = result.context;
  try {
    const form = await request.formData().catch(() => null);
    const file = form?.get('photo');
    if (!file || typeof file === 'string') return NextResponse.json({ error: 'Izaberite sliku.' }, { status: 400 });
    if (file.size > MEDIA_MAX_BYTES) return NextResponse.json({ error: 'Slika je prevelika. Pokušajte s manjom slikom.' }, { status: 400 });
    const bytes = new Uint8Array(await file.arrayBuffer());
    const type = sniffImage(bytes);
    if (!type) return NextResponse.json({ error: 'Dozvoljeni formati su PNG, JPG i WEBP.' }, { status: 400 });
    const old = await getCover(admin, businessId);
    const folder = coverFolder(businessId);
    const name = `${sortKey(Date.now())}-${randomBytes(4).toString('hex')}.${IMAGE_TYPES[type]}`;
    const upload = await admin.storage.from(MEDIA_BUCKET).upload(`${folder}/${name}`, bytes, { contentType: type, upsert: false, cacheControl: '31536000' });
    if (upload.error) return NextResponse.json({ error: 'Slika nije sačuvana. Pokušajte ponovo.' }, { status: 500 });
    if (old) await admin.storage.from(MEDIA_BUCKET).remove([`${folder}/${old.name}`]);
    return NextResponse.json({ success: true, cover: await getCover(admin, businessId) });
  } catch {
    return NextResponse.json({ error: 'Slika nije sačuvana. Pokušajte ponovo.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const result = await getOwnerContext(request);
  if (result.response) return result.response;
  const { admin, businessId } = result.context;
  const old = await getCover(admin, businessId);
  if (old) {
    const { error } = await admin.storage.from(MEDIA_BUCKET).remove([`${coverFolder(businessId)}/${old.name}`]);
    if (error) return NextResponse.json({ error: 'Slika nije obrisana.' }, { status: 500 });
  }
  return NextResponse.json({ success: true, cover: null });
}
