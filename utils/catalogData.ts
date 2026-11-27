import { createClient } from '@supabase/supabase-js';
import { PARTNER_LOGOS } from './partnerLogos';
import { categoryOf } from './catalog';
import { retryFetch } from './supabaseRetryFetch';

export type CatalogBusiness = { slug: string; name: string; city: string; category: string; logo_url: string };

// Javni katalog: samo aktivne firme s bar jednom uslugom i samo podaci koji su ionako javni.
// Koriste ga i API (/api/catalog) i stranica /katalog (na serveru, pa se stranica odmah prikaže cijela).
// Firme koje rade, ali se ne prikazuju u katalogu, pretrazi ni sitemapu (npr. probna firma za Googleov pregled aplikacije).
export const HIDDEN_SLUGS = new Set(['demo-google-pregled']);

export async function getCatalogBusinesses(): Promise<CatalogBusiness[] | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false }, global: { fetch: retryFetch } });
  const [{ data, error }, { data: services, error: servicesError }] = await Promise.all([
    admin.from('businesses').select('id, slug, name, category, city, logo_url, created_at').eq('status', 'active').neq('is_active', false).order('created_at', { ascending: true }),
    admin.from('services').select('business_id'),
  ]);
  if (error || servicesError) {
    // Bez usluga bi se svaka firma sakrila iz kataloga, pa je to ista greška kao i bez firmi.
    console.error('Katalog nije učitan:', error || servicesError);
    return null;
  }
  const withServices = new Set((services || []).map((s) => s.business_id));
  return (data || [])
    .filter((b) => b.slug && b.name && withServices.has(b.id) && !HIDDEN_SLUGS.has(b.slug))
    .map((b) => ({
      slug: b.slug,
      name: b.name,
      city: b.city || '',
      category: categoryOf(b.category),
      logo_url: b.logo_url || PARTNER_LOGOS[b.slug] || '',
    }));
}
