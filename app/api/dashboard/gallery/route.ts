import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { getOwnerContext } from '../../../../utils/ownerAuth';
import { GALLERY_BUCKET, GALLERY_MAX, GALLERY_MAX_BYTES, galleryFolder, isGalleryName, listGallery, sortKey } from '../../../../utils/gallery';

// Galerija firme: spisak, dodavanje, brisanje i "postavi kao prvu".
// Putanja je uvijek pod id-jem firme iz tokena, nikad iz zahtjeva.
const TYPES: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };

function sniff(bytes: Uint8Array): string | null {
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return 'image/webp';
  return null;
}

export async function GET(request: NextRequest) {
  const result = await getOwnerContext(request);
  if (result.response) return result.response;
  const { admin, businessId } = result.context;
  return NextResponse.json({ photos: await listGallery(admin, businessId), max: GALLERY_MAX });
}

export async function POST(request: NextRequest) {
  const result = await getOwnerContext(request);
  if (result.response) return result.response;
  const { admin, businessId } = result.context;
  try {
    const current = await listGallery(admin, businessId);
    if (current.length >= GALLERY_MAX) return NextResponse.json({ error: `Najviše ${GALLERY_MAX} slika. Obrišite neku pa dodajte novu.` }, { status: 400 });
    const form = await request.formData().catch(() => null);
    const file = form?.get('photo');
    if (!file || typeof file === 'string') return NextResponse.json({ error: 'Izaberite sliku.' }, { status: 400 });
    if (file.size > GALLERY_MAX_BYTES) return NextResponse.json({ error: 'Slika je prevelika. Pokušajte s manjom slikom.' }, { status: 400 });
    const bytes = new Uint8Array(await file.arrayBuffer());
    const type = sniff(bytes);
    if (!type) return NextResponse.json({ error: 'Dozvoljeni formati su PNG, JPG i WEBP.' }, { status: 400 });
    const last = current.length ? Number(current[current.length - 1].name.slice(0, 13)) : 0;
    const key = sortKey(Math.max(Date.now(), last + 1));
    const name = `${key}-${randomBytes(4).toString('hex')}.${TYPES[type]}`;
    const upload = await admin.storage.from(GALLERY_BUCKET).upload(`${galleryFolder(businessId)}/${name}`, bytes, { contentType: type, upsert: false, cacheControl: '31536000' });
    if (upload.error) return NextResponse.json({ error: 'Slika nije sačuvana. Pokušajte ponovo.' }, { status: 500 });
    return NextResponse.json({ success: true, photos: await listGallery(admin, businessId) });
  } catch {
    return NextResponse.json({ error: 'Slika nije sačuvana. Pokušajte ponovo.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const result = await getOwnerContext(request);
  if (result.response) return result.response;
  const { admin, businessId } = result.context;
  const name = request.nextUrl.searchParams.get('name');
  if (!isGalleryName(name)) return NextResponse.json({ error: 'Neispravna slika.' }, { status: 400 });
  const { error } = await admin.storage.from(GALLERY_BUCKET).remove([`${galleryFolder(businessId)}/${name}`]);
  if (error) return NextResponse.json({ error: 'Slika nije obrisana.' }, { status: 500 });
  return NextResponse.json({ success: true, photos: await listGallery(admin, businessId) });
}

// Postavi kao prvu (naslovnu): fajl dobije ključ manji od trenutno prvog.
export async function PATCH(request: NextRequest) {
  const result = await getOwnerContext(request);
  if (result.response) return result.response;
  const { admin, businessId } = result.context;
  const body = await request.json().catch(() => ({}));
  const name = body?.name;
  if (!isGalleryName(name)) return NextResponse.json({ error: 'Neispravna slika.' }, { status: 400 });
  const current = await listGallery(admin, businessId);
  if (!current.some((p) => p.name === name)) return NextResponse.json({ error: 'Slika nije pronađena.' }, { status: 404 });
  if (current[0]?.name === name) return NextResponse.json({ success: true, photos: current });
  const first = Number(current[0].name.slice(0, 13));
  const newName = `${sortKey(first - 1)}${name.slice(13)}`;
  const folder = galleryFolder(businessId);
  const { error } = await admin.storage.from(GALLERY_BUCKET).move(`${folder}/${name}`, `${folder}/${newName}`);
  if (error) return NextResponse.json({ error: 'Redoslijed nije promijenjen.' }, { status: 500 });
  return NextResponse.json({ success: true, photos: await listGallery(admin, businessId) });
}
