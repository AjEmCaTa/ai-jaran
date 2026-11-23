import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';
import { categoryBySlug, categoryLabel } from '../../../utils/catalog';
import { PARTNER_LOGOS } from '../../../utils/partnerLogos';
import { retryFetch } from '../../../utils/supabaseRetryFetch';

const SITE = 'https://poslo.one';

// Naslov, opis i slika za Google i za dijeljenje linka (Facebook, WhatsApp, Instagram).
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const url = `${SITE}/katalog/${slug}`;

  const category = categoryBySlug(slug);
  if (category) {
    const title = `${category.title} – online zakazivanje | POSLO ONE`;
    return {
      title,
      description: category.description,
      alternates: { canonical: url },
      openGraph: { title, description: category.description, url, siteName: 'POSLO ONE', type: 'website', images: [{ url: category.image }] },
    };
  }

  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!sbUrl || !key || !/^[a-z0-9-]{1,80}$/.test(slug)) return { title: 'POSLO ONE' };
  const admin = createClient(sbUrl, key, { auth: { autoRefreshToken: false, persistSession: false }, global: { fetch: retryFetch } });
  const { data } = await admin
    .from('businesses')
    .select('name, city, category, logo_url')
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle();
  if (!data?.name) return { title: 'POSLO ONE' };

  const title = `${data.name} – zakaži termin online | POSLO ONE`;
  const description = `${data.name}${data.city ? `, ${data.city}` : ''}. ${categoryLabel(data.category)}. Pogledajte usluge i cijene i zakažite termin online, bez poziva.`;
  const logo = data.logo_url || PARTNER_LOGOS[slug] || '/poslo.one.png';
  const image = logo.startsWith('http') ? logo : `${SITE}${logo.startsWith('/') ? '' : '/'}${logo}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: 'POSLO ONE', type: 'website', locale: 'bs_BA', images: [{ url: image }] },
    twitter: { card: 'summary', title, description, images: [image] },
  };
}

export default function BusinessLayout({ children }: { children: ReactNode }) {
  return children;
}
