import type { SupabaseClient } from '@supabase/supabase-js';

// Galerija slika firme (sobe, salon, radovi...). Slike su u javnom bucketu 'logos',
// u folderu <id firme>/gallery/. Redoslijed određuje ime fajla: 13-cifreni ključ + nasumični dio.
// Nema nove kolone u bazi: spisak se čita direktno iz storagea.
export const GALLERY_BUCKET = 'logos';
export const GALLERY_MAX = 24;
export const GALLERY_MAX_BYTES = 4 * 1024 * 1024;

export type GalleryPhoto = { name: string; url: string };

export const galleryFolder = (businessId: string) => `${businessId}/gallery`;

// Ime fajla: samo ključ, crtica, slova/brojevi i ekstenzija. Sve ostalo se odbija (bez ../ i sl.).
export const isGalleryName = (name: unknown): name is string =>
  typeof name === 'string' && /^\d{13}-[a-z0-9]{6,12}\.(webp|jpg|png)$/.test(name);

export async function listGallery(admin: SupabaseClient, businessId: string): Promise<GalleryPhoto[]> {
  const folder = galleryFolder(businessId);
  const { data, error } = await admin.storage.from(GALLERY_BUCKET).list(folder, { limit: 100, sortBy: { column: 'name', order: 'asc' } });
  if (error || !data) return [];
  return data
    .filter((f) => isGalleryName(f.name))
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, GALLERY_MAX)
    .map((f) => ({ name: f.name, url: admin.storage.from(GALLERY_BUCKET).getPublicUrl(`${folder}/${f.name}`).data.publicUrl }));
}

export const sortKey = (n: number) => String(Math.max(0, Math.min(9999999999999, Math.floor(n)))).padStart(13, '0');
