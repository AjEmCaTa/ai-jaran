import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { retryFetch } from '../../../../utils/supabaseRetryFetch';

// Profilna slika korisnika (klijent ili vlasnik). Slika se prije slanja smanji u pregledniku.
// Sprema se u javni bucket 'logos' pod avatars/<id korisnika>/, a link u user_metadata.poslo_avatar.
// Putanja je uvijek iz tokena, nikad iz zahtjeva.
const MAX_BYTES = 2 * 1024 * 1024;
const TYPES: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const admin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY || 'missing-service-role-key', { global: { fetch: retryFetch } });
const authClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');

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

async function getUser(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data, error } = await authClient.auth.getUser(token);
  return error ? null : data.user;
}

async function setAvatar(userId: string, meta: Record<string, unknown>, url: string | null) {
  return admin.auth.admin.updateUserById(userId, { user_metadata: { ...meta, poslo_avatar: url } });
}

export async function POST(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ success: false, error: 'Prijavite se.' }, { status: 401 });
  const form = await request.formData().catch(() => null);
  const file = form?.get('avatar');
  if (!file || typeof file === 'string') return NextResponse.json({ success: false, error: 'Izaberite sliku.' }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ success: false, error: 'Slika je prevelika.' }, { status: 400 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniff(bytes);
  if (!type) return NextResponse.json({ success: false, error: 'Dozvoljeni formati su PNG, JPG i WEBP.' }, { status: 400 });

  const prefix = `avatars/${user.id}/`;
  const path = `${prefix}a-${Date.now()}.${TYPES[type]}`;
  const up = await admin.storage.from('logos').upload(path, bytes, { contentType: type, upsert: false, cacheControl: '31536000' });
  if (up.error) return NextResponse.json({ success: false, error: 'Slanje slike nije uspjelo.' }, { status: 500 });
  const url = admin.storage.from('logos').getPublicUrl(path).data.publicUrl;

  const meta = (user.user_metadata || {}) as Record<string, unknown>;
  const { error } = await setAvatar(user.id, meta, url);
  if (error) {
    await admin.storage.from('logos').remove([path]);
    return NextResponse.json({ success: false, error: 'Spremanje slike nije uspjelo.' }, { status: 500 });
  }
  const old = pathFromUrl(meta.poslo_avatar);
  if (old && old.startsWith(prefix)) await admin.storage.from('logos').remove([old]);
  return NextResponse.json({ success: true, url });
}

export async function DELETE(request: NextRequest) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ success: false, error: 'Prijavite se.' }, { status: 401 });
  const meta = (user.user_metadata || {}) as Record<string, unknown>;
  const { error } = await setAvatar(user.id, meta, null);
  if (error) return NextResponse.json({ success: false, error: 'Uklanjanje nije uspjelo.' }, { status: 500 });
  const old = pathFromUrl(meta.poslo_avatar);
  if (old && old.startsWith(`avatars/${user.id}/`)) await admin.storage.from('logos').remove([old]);
  return NextResponse.json({ success: true });
}
