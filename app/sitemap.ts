import type { MetadataRoute } from 'next';
import { getCatalogBusinesses } from '../utils/catalogData';

const SITE = 'https://poslo.one';

// Osvježava se svakih sat vremena: javne stranice + stranica svake aktivne firme.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const fixed = ['', '/za-firme', '/o-nama', '/faq', '/cjenovnik', '/demo', '/registracija', '/uslovi', '/privatnost', '/povrat-novca'].map((path) => ({
    url: `${SITE}${path}`,
    lastModified: now,
    changeFrequency: path === '' ? ('daily' as const) : ('monthly' as const),
    priority: path === '' ? 1 : path === '/cjenovnik' ? 0.8 : 0.5,
  }));
  const businesses = (await getCatalogBusinesses()) || [];
  return [
    ...fixed,
    ...businesses.map((b) => ({ url: `${SITE}/katalog/${b.slug}`, lastModified: now, changeFrequency: 'weekly' as const, priority: 0.7 })),
  ];
}
