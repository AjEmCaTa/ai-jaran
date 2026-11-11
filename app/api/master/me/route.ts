import { NextRequest, NextResponse } from 'next/server';
import { requireMasterAdmin } from '../../../../utils/masterAuth';

export const dynamic = 'force-dynamic';

// Da li je prijavljeni korisnik administrator (za izgled admin panela; svaka ruta i dalje sama provjerava).
export async function GET(request: NextRequest) {
  const auth = await requireMasterAdmin(request);
  if ('response' in auth) return auth.response;
  return NextResponse.json({ email: auth.email });
}
