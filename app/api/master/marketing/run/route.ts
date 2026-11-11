import { NextRequest, NextResponse } from 'next/server';
import { requireMasterAdmin, logMarketing } from '../../../../../utils/masterAuth';
import { runMarketing } from '../../../../../utils/marketingRunner';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// "Pokreni sada": isto što radi planer (sinhronizacija + slanje odobrenih nizova u okviru limita).
export async function POST(request: NextRequest) {
  const auth = await requireMasterAdmin(request);
  if ('response' in auth) return auth.response;
  try {
    const result = await runMarketing(auth.admin, { actor: auth.email });
    await logMarketing(auth.admin, auth.email, 'run.manual', null, null, result);
    return NextResponse.json(result);
  } catch (e) {
    console.error('Marketing ručno pokretanje', (e as Error).message);
    return NextResponse.json({ error: 'Pokretanje nije uspjelo.' }, { status: 500 });
  }
}
