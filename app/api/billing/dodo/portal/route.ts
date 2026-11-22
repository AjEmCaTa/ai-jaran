import { NextRequest, NextResponse } from 'next/server';
import { getOwnerContext } from '../../../../../utils/ownerAuth';
import { dodoPortalLink } from '../../../../../utils/dodo';

// Link za upravljanje pretplatom (kartica, računi, otkazivanje).
export async function POST(request: NextRequest) {
  const result = await getOwnerContext(request);
  if (result.response) return result.response;
  const { admin, businessId } = result.context;
  try {
    const url = await dodoPortalLink(admin, businessId);
    if (!url) return NextResponse.json({ error: 'Pretplata još nije pronađena.' }, { status: 404 });
    return NextResponse.json({ url });
  } catch (error) {
    console.error('Dodo portal nije otvoren:', error);
    return NextResponse.json({ error: 'Upravljanje pretplatom trenutno nije dostupno.' }, { status: 502 });
  }
}
