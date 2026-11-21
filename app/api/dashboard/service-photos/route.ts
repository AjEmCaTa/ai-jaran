import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { getOwnerContext } from '../../../../utils/ownerAuth';
import {
  IMAGE_TYPES, MEDIA_BUCKET, MEDIA_MAX_BYTES, PHOTOS_PER_SERVICE,
  isServicePhotoName, isUuid, keyOf, listServicePhotos, serviceIdOf, servicesFolder, sniffImage, sortKey,
} from '../../../../utils/gallery';

// Slike pojedinačnih usluga: spisak, dodavanje, brisanje i "postavi kao prvu".
// Usluga mora pripadati firmi iz tokena; putanja je uvijek pod id-jem te firme.
export async function GET(request: NextRequest) {
  const result = await getOwnerContext(request);
  if (result.response) return result.response;
  const { admin, businessId } = result.context;
  return NextResponse.json({ photos: await listServicePhotos(admin, businessId), max: PHOTOS_PER_SERVICE });
}

export async function POST(request: NextRequest) {
  const result = await getOwnerContext(request);
  if (result.response) return result.response;
  const { admin, businessId } = result.context;
  try {
    const form = await request.formData().catch(() => null);
    const serviceId = form?.get('serviceId');
    const file = form?.get('photo');
    if (!isUuid(serviceId)) return NextResponse.json({ error: 'Usluga nije važeća.' }, { status: 400 });
    const { data: service } = await admin.from('services').select('id').eq('id', serviceId).eq('business_id', businessId).maybeSingle();
    if (!service) return NextResponse.json({ error: 'Usluga nije pronađena.' }, { status: 404 });
    if (!file || typeof file === 'string') return NextResponse.json({ error: 'Izaberite sliku.' }, { status: 400 });
    if (file.size > MEDIA_MAX_BYTES) return NextResponse.json({ error: 'Slika je prevelika. Pokušajte s manjom slikom.' }, { status: 400 });
    const bytes = new Uint8Array(await file.arrayBuffer());
    const type = sniffImage(bytes);
    if (!type) return NextResponse.json({ error: 'Dozvoljeni formati su PNG, JPG i WEBP.' }, { status: 400 });

    const all = await listServicePhotos(admin, businessId);
    const current = all[serviceId] || [];
    if (current.length >= PHOTOS_PER_SERVICE) return NextResponse.json({ error: `Najviše ${PHOTOS_PER_SERVICE} slika po usluzi.` }, { status: 400 });
    const last = current.length ? keyOf(current[current.length - 1].name) : 0;
    const name = `${serviceId}__${sortKey(Math.max(Date.now(), last + 1))}-${randomBytes(4).toString('hex')}.${IMAGE_TYPES[type]}`;
    const upload = await admin.storage.from(MEDIA_BUCKET).upload(`${servicesFolder(businessId)}/${name}`, bytes, { contentType: type, upsert: false, cacheControl: '31536000' });
    if (upload.error) return NextResponse.json({ error: 'Slika nije sačuvana. Pokušajte ponovo.' }, { status: 500 });
    const fresh = await listServicePhotos(admin, businessId);
    return NextResponse.json({ success: true, photos: fresh[serviceId] || [] });
  } catch {
    return NextResponse.json({ error: 'Slika nije sačuvana. Pokušajte ponovo.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const result = await getOwnerContext(request);
  if (result.response) return result.response;
  const { admin, businessId } = result.context;
  const name = request.nextUrl.searchParams.get('name');
  if (!isServicePhotoName(name)) return NextResponse.json({ error: 'Neispravna slika.' }, { status: 400 });
  const { error } = await admin.storage.from(MEDIA_BUCKET).remove([`${servicesFolder(businessId)}/${name}`]);
  if (error) return NextResponse.json({ error: 'Slika nije obrisana.' }, { status: 500 });
  const fresh = await listServicePhotos(admin, businessId);
  return NextResponse.json({ success: true, photos: fresh[serviceIdOf(name)!] || [] });
}

// Postavi kao prvu: fajl dobije ključ manji od trenutno prvog u toj usluzi.
export async function PATCH(request: NextRequest) {
  const result = await getOwnerContext(request);
  if (result.response) return result.response;
  const { admin, businessId } = result.context;
  const body = await request.json().catch(() => ({}));
  const name = body?.name;
  if (!isServicePhotoName(name)) return NextResponse.json({ error: 'Neispravna slika.' }, { status: 400 });
  const serviceId = serviceIdOf(name)!;
  const current = (await listServicePhotos(admin, businessId))[serviceId] || [];
  if (!current.some((p) => p.name === name)) return NextResponse.json({ error: 'Slika nije pronađena.' }, { status: 404 });
  if (current[0].name === name) return NextResponse.json({ success: true, photos: current });
  const newName = `${serviceId}__${sortKey(keyOf(current[0].name) - 1)}${name.slice(name.indexOf('-', 38))}`;
  const folder = servicesFolder(businessId);
  const { error } = await admin.storage.from(MEDIA_BUCKET).move(`${folder}/${name}`, `${folder}/${newName}`);
  if (error) return NextResponse.json({ error: 'Redoslijed nije promijenjen.' }, { status: 500 });
  const fresh = await listServicePhotos(admin, businessId);
  return NextResponse.json({ success: true, photos: fresh[serviceId] || [] });
}
