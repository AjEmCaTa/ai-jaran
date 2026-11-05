import { NextRequest, NextResponse } from 'next/server';
import { getOwnerContext } from '../../../../utils/ownerAuth';

// Logo firme: upload (PNG/JPG/WEBP do 1 MB) u javni bucket 'logos' i brisanje.
// Putanja je uvijek pod id-jem firme iz tokena, nikad iz zahtjeva.
const MAX_BYTES = 1024 * 1024;
const TYPES: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };

// Provjera "magičnih" bajtova, da se ne može poslati drugi sadržaj s lažnim tipom.
function sniff(bytes: Uint8Array): string | null {
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return 'image/webp';
  return null;
}

const pathFromUrl = (url: unknown) => {
  const m = /\/storage\/v1\/object\/public\/logos\/(.+)$/.exec(String(url ?? ''));
  return m ? decodeURIComponent(m[1]) : null;
};

export async function POST(request: NextRequest) {
  const result = await getOwnerContext(request);
  if (result.response) return result.response;
  const { admin, businessId } = result.context;
  try {
    const form = await request.formData().catch(() => null);
    const file = form?.get('logo');
    if (!file || typeof file === 'string') return NextResponse.json({ error: 'Izaberite sliku loga.' }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: 'Slika je veća od 1 MB.' }, { status: 400 });
    const bytes = new Uint8Array(await file.arrayBuffer());
    const type = sniff(bytes);
    if (!type || !TYPES[type]) return NextResponse.json({ error: 'Dozvoljeni formati su PNG, JPG i WEBP.' }, { status: 400 });

    const { data: current } = await admin.from('businesses').select('logo_url').eq('id', businessId).maybeSingle();
    const path = `${businessId}/logo-${Date.now()}.${TYPES[type]}`;
    const upload = await admin.storage.from('logos').upload(path, bytes, { contentType: type, upsert: false, cacheControl: '31536000' });
    if (upload.error) throw upload.error;
    const publicUrl = admin.storage.from('logos').getPublicUrl(path).data.publicUrl;

    const { error } = await admin.from('businesses').update({ logo_url: publicUrl }).eq('id', businessId);
    if (error) {
      await admin.storage.from('logos').remove([path]);
      throw error;
    }
    const oldPath = pathFromUrl(current?.logo_url);
    if (oldPath && oldPath.startsWith(`${businessId}/`)) await admin.storage.from('logos').remove([oldPath]);
    return NextResponse.json({ success: true, logo_url: publicUrl });
  } catch (error) {
    console.error('Logo nije sačuvan:', error);
    return NextResponse.json({ error: 'Logo nije moguće sačuvati.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const result = await getOwnerContext(request);
  if (result.response) return result.response;
  const { admin, businessId } = result.context;
  try {
    const { data: current } = await admin.from('businesses').select('logo_url').eq('id', businessId).maybeSingle();
    const { error } = await admin.from('businesses').update({ logo_url: null }).eq('id', businessId);
    if (error) throw error;
    const oldPath = pathFromUrl(current?.logo_url);
    if (oldPath && oldPath.startsWith(`${businessId}/`)) await admin.storage.from('logos').remove([oldPath]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logo nije uklonjen:', error);
    return NextResponse.json({ error: 'Logo nije moguće ukloniti.' }, { status: 500 });
  }
}
