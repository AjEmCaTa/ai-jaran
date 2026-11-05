import { NextRequest, NextResponse } from 'next/server';
import { getOwnerContext } from '../../../../utils/ownerAuth';

// Koliko je firmi registrovano preko linka za preporuku ove firme (samo broj i status, bez tuđih podataka).
export async function GET(request: NextRequest) {
  const result = await getOwnerContext(request);
  if (result.response) return result.response;
  const { admin, businessId } = result.context;
  try {
    const { data: own, error } = await admin.from('businesses').select('slug').eq('id', businessId).maybeSingle();
    if (error) throw error;
    if (!own?.slug) return NextResponse.json({ slug: '', total: 0, active: 0 });
    const { data: referred, error: refError } = await admin
      .from('businesses')
      .select('status')
      .eq('referred_by', own.slug);
    if (refError) throw refError;
    const list = referred || [];
    return NextResponse.json({
      slug: own.slug,
      total: list.length,
      active: list.filter((b) => b.status === 'active').length,
    });
  } catch (error) {
    console.error('Preporuke nisu učitane:', error);
    return NextResponse.json({ error: 'Preporuke nije moguće učitati.' }, { status: 500 });
  }
}
