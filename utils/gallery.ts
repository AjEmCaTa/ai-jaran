import type { SupabaseClient } from '@supabase/supabase-js';

// Slike firme u javnom bucketu 'logos', uvijek pod folderom firme:
//   <id firme>/services/<id usluge>__<ključ>-<nasumično>.<ext>   slike pojedinačne usluge
//   <id firme>/cover/<ključ>-<nasumično>.<ext>                   naslovna slika stranice
// Redoslijed određuje 13-cifreni ključ u imenu. Nema kolona u bazi: spisak se čita iz storagea
// jednim pozivom po folderu, pa i javna stranica ostaje brza.
export const MEDIA_BUCKET = 'logos';
export const PHOTOS_PER_SERVICE = 50;
export const MEDIA_MAX_BYTES = 4 * 1024 * 1024;

export type MediaPhoto = { name: string; url: string };

export const servicesFolder = (businessId: string) => `${businessId}/services`;
export const coverFolder = (businessId: string) => `${businessId}/cover`;

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const SERVICE_PHOTO = new RegExp(`^(${UUID})__(\\d{13})-[a-z0-9]{6,12}\\.(webp|jpg|png)$`);
const COVER_PHOTO = /^(\d{13})-[a-z0-9]{6,12}\.(webp|jpg|png)$/;

export const isUuid = (v: unknown): v is string => typeof v === 'string' && new RegExp(`^${UUID}$`).test(v);
export const isServicePhotoName = (name: unknown): name is string => typeof name === 'string' && SERVICE_PHOTO.test(name);
export const isCoverName = (name: unknown): name is string => typeof name === 'string' && COVER_PHOTO.test(name);
export const serviceIdOf = (name: string) => SERVICE_PHOTO.exec(name)?.[1] ?? null;
export const keyOf = (name: string) => Number(SERVICE_PHOTO.exec(name)?.[2] ?? COVER_PHOTO.exec(name)?.[1] ?? 0);

export const sortKey = (n: number) => String(Math.max(0, Math.min(9999999999999, Math.floor(n)))).padStart(13, '0');

async function listFolder(admin: SupabaseClient, folder: string) {
  const out: string[] = [];
  for (let offset = 0; offset < 3000; offset += 1000) {
    const { data, error } = await admin.storage.from(MEDIA_BUCKET).list(folder, { limit: 1000, offset, sortBy: { column: 'name', order: 'asc' } });
    if (error || !data) break;
    out.push(...data.map((f) => f.name));
    if (data.length < 1000) break;
  }
  return out;
}

const publicUrl = (admin: SupabaseClient, path: string) => admin.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;

// Slike svih usluga firme, grupisane po id-ju usluge i poredane (prva = naslovna slika usluge).
export async function listServicePhotos(admin: SupabaseClient, businessId: string): Promise<Record<string, MediaPhoto[]>> {
  const folder = servicesFolder(businessId);
  const names = (await listFolder(admin, folder)).filter(isServicePhotoName).sort((a, b) => keyOf(a) - keyOf(b) || a.localeCompare(b));
  const grouped: Record<string, MediaPhoto[]> = {};
  for (const name of names) {
    const id = serviceIdOf(name)!;
    (grouped[id] ||= []).push({ name, url: publicUrl(admin, `${folder}/${name}`) });
  }
  return grouped;
}

// Naslovna slika firme: najnovija u folderu cover (stare se brišu pri promjeni).
export async function getCover(admin: SupabaseClient, businessId: string): Promise<MediaPhoto | null> {
  const folder = coverFolder(businessId);
  const names = (await listFolder(admin, folder)).filter(isCoverName).sort((a, b) => keyOf(b) - keyOf(a));
  return names[0] ? { name: names[0], url: publicUrl(admin, `${folder}/${names[0]}`) } : null;
}

export const IMAGE_TYPES: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };

// Provjera "magičnih" bajtova, da se ne može poslati drugi sadržaj s lažnim tipom.
export function sniffImage(bytes: Uint8Array): string | null {
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return 'image/webp';
  return null;
}
