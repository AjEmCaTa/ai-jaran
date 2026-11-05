import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PARTNER_LOGOS } from '../../../utils/partnerLogos';
import { categoryOf } from '../../../utils/catalog';

export const revalidate = 60;

// Javni katalog: samo aktivne firme i samo podaci koji su ionako javni na njihovoj stranici.
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ businesses: [] }, { status: 503 });
  const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await admin
    .from('businesses')
    .select('slug, name, category, city, logo_url, created_at')
    .eq('status', 'active')
    .neq('is_active', false)
    .order('created_at', { ascending: true });
  if (error) {
    console.error('Katalog nije učitan:', error);
    return NextResponse.json({ error: 'Katalog nije moguće učitati.' }, { status: 500 });
  }
  const businesses = (data || [])
    .filter((b) => b.slug && b.name)
    .map((b) => ({
      slug: b.slug,
      name: b.name,
      city: b.city || '',
      category: categoryOf(b.category),
      logo_url: b.logo_url || PARTNER_LOGOS[b.slug] || '',
    }));
  return NextResponse.json({ businesses });
}
