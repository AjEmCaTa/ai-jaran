import { NextResponse } from 'next/server';
import { getCatalogBusinesses } from '../../../utils/catalogData';

export const revalidate = 60;

// Javni katalog: samo aktivne firme i samo podaci koji su ionako javni na njihovoj stranici.
export async function GET() {
  const businesses = await getCatalogBusinesses();
  if (!businesses) return NextResponse.json({ error: 'Katalog nije moguće učitati.', businesses: [] }, { status: 500 });
  return NextResponse.json({ businesses });
}
