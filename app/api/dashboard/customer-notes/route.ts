import { NextRequest, NextResponse } from 'next/server';
import { getOwnerContext } from '../../../../utils/ownerAuth';

export async function GET(request: NextRequest) {
  const result = await getOwnerContext(request);
  if (result.response) return result.response;

  try {
    const { data, error } = await result.context.admin
      .from('customer_notes')
      .select('customer_key, note')
      .eq('business_id', result.context.businessId);
    if (error) throw error;
    return NextResponse.json({ notes: data || [] });
  } catch (error) {
    console.error('Bilješke o klijentima nisu učitane:', error);
    return NextResponse.json({ error: 'Bilješke nije moguće učitati.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const result = await getOwnerContext(request);
  if (result.response) return result.response;

  try {
    const body = await request.json();
    const key = typeof body.customer_key === 'string' ? body.customer_key.trim() : '';
    const note = typeof body.note === 'string' ? body.note.trim() : '';

    if (!key || key.length > 300 || note.length > 2000) {
      return NextResponse.json({ error: 'Bilješka nije važeća (najviše 2000 znakova).' }, { status: 400 });
    }

    const { admin, businessId } = result.context;

    if (!note) {
      const { error } = await admin
        .from('customer_notes')
        .delete()
        .eq('business_id', businessId)
        .eq('customer_key', key);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    const { error } = await admin
      .from('customer_notes')
      .upsert(
        { business_id: businessId, customer_key: key, note, updated_at: new Date().toISOString() },
        { onConflict: 'business_id,customer_key' },
      );
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Bilješka nije sačuvana:', error);
    return NextResponse.json({ error: 'Bilješku nije moguće sačuvati. Provjerite je li tabela customer_notes kreirana.' }, { status: 500 });
  }
}