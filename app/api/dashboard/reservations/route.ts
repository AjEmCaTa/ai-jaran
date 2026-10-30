import { NextRequest, NextResponse } from 'next/server';
import { getOwnerContext } from '../../../../utils/ownerAuth';
import {
  TARGET_STATUS,
  actionFromLegacyStatus,
  canApply,
  durationOf,
  findConflict,
  parseAction,
  startMs,
  statusKind,
} from '../../../../utils/reservationFlow';
import { reservationStartMs } from '../../../../utils/reservationRules';
import { notifyClientStatus, type ClientNotifyKind } from '../../../../utils/clientNotify';

const reservationFields = 'id, business_id, user_id, customer_name, customer_phone, customer_email, service_name, reservation_date, status, created_at, price, duration_minutes';

export async function GET(request: NextRequest) {
  const result = await getOwnerContext(request);
  if (result.response) return result.response;

  try {
    const reservations: Record<string, unknown>[] = [];
    const pageSize = 1000;
    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await result.context.admin
        .from('reservations')
        .select(reservationFields)
        .eq('business_id', result.context.businessId)
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);
      if (error) throw error;
      reservations.push(...(data || []));
      if (!data || data.length < pageSize) break;
    }
    return NextResponse.json({ reservations });
  } catch (error) {
    console.error('Rezervacije biznisa nisu učitane:', error);
    return NextResponse.json({ error: 'Rezervacije nije moguće učitati.' }, { status: 500 });
  }
}

// Akcije: confirm (POTVRDI), reschedule (DOGOVORI TERMIN), cancel (OTKAŽI), complete (ZAVRŠI).
// Stari klijent šalje { status }; mapira se na akciju. Prihod se računa samo iz 'Završeno' (nepromijenjeno).
export async function PATCH(request: NextRequest) {
  const result = await getOwnerContext(request);
  if (result.response) return result.response;
  const { admin, businessId } = result.context;

  try {
    const body = await request.json().catch(() => null);
    const id = typeof body?.id === 'string' ? body.id : '';
    const action = parseAction(body?.action) || (body?.status !== undefined ? actionFromLegacyStatus(body.status) : null);
    if (!id || !action) {
      return NextResponse.json({ error: 'Zahtjev nije važeći.' }, { status: 400 });
    }

    // Rezervacija se uvijek čita unutar firme iz tokena: tuđi id daje 404.
    const { data: current, error: readError } = await admin
      .from('reservations')
      .select(reservationFields)
      .eq('id', id)
      .eq('business_id', businessId)
      .maybeSingle();
    if (readError) throw readError;
    if (!current) return NextResponse.json({ error: 'Rezervacija nije pronađena.' }, { status: 404 });

    if (!canApply(current.status, action)) {
      return NextResponse.json(
        { error: 'Ova promjena nije moguća: rezervacija je već ' + String(current.status || 'obrađena').toLowerCase() + '.', reservation: current },
        { status: 409 }
      );
    }

    const update: Record<string, unknown> = { status: TARGET_STATUS[action] };

    if (action === 'confirm' || action === 'reschedule') {
      let start = startMs(current.reservation_date);
      if (action === 'reschedule') {
        start = startMs(body?.reservation_date);
        if (start === null) return NextResponse.json({ error: 'Unesite ispravan novi datum i vrijeme.' }, { status: 400 });
        // Vrijeme je lokalno (Europe/Sarajevo), ne UTC: bez ovoga je provjera "u budućnosti" kasnila 1-2 sata.
        const realStart = reservationStartMs(body?.reservation_date);
        if (realStart === null || realStart < Date.now() - 5 * 60000) return NextResponse.json({ error: 'Novi termin mora biti u budućnosti.' }, { status: 400 });
        update.reservation_date = body.reservation_date;
      }
      if (start !== null) {
        const { data: others, error: othersError } = await admin
          .from('reservations')
          .select('id, reservation_date, duration_minutes, status')
          .eq('business_id', businessId)
          .neq('id', id);
        if (othersError) throw othersError;
        // Potvrda se sudara samo s već potvrđenim/dogovorenim terminima; novi termin sa svim neotkazanim.
        const pool = (others || []).filter((o) => action === 'reschedule' || ['confirmed', 'rescheduling'].includes(statusKind(o.status)));
        const conflict = findConflict({ id, start, durationMinutes: durationOf(current.duration_minutes) }, pool);
        if (conflict) {
          return NextResponse.json({ error: 'Termin se preklapa s drugom rezervacijom.' }, { status: 409 });
        }
      }
    }

    // Atomarno: mijenja se samo ako je status još onakav kakvog smo ga pročitali (sprječava dvostruku potvrdu).
    let query = admin.from('reservations').update(update).eq('id', id).eq('business_id', businessId);
    query = current.status === null ? query.is('status', null) : query.eq('status', current.status);
    const { data: updated, error } = await query.select(reservationFields).maybeSingle();
    if (error) throw error;
    if (!updated) {
      return NextResponse.json({ error: 'Rezervacija je u međuvremenu promijenjena. Osvježite prikaz.' }, { status: 409 });
    }
    // Klijent dobija mail o potvrdi, otkazivanju/odbijanju i novom terminu (završavanje ne šalje ništa).
    // Greška pri slanju ne poništava promjenu statusa.
    let notified = false;
    const notifyKind: ClientNotifyKind | null =
      action === 'confirm' ? 'confirmed'
      : action === 'reschedule' ? 'rescheduled'
      : action === 'cancel' ? (statusKind(current.status) === 'pending' ? 'declined' : 'cancelled')
      : null;
    if (notifyKind) notified = await notifyClientStatus(admin, notifyKind, updated);
    return NextResponse.json({ success: true, reservation: updated, clientNotified: notified });
  } catch (error) {
    console.error('Status rezervacije nije promijenjen:', error);
    return NextResponse.json({ error: 'Status rezervacije nije moguće promijeniti.' }, { status: 500 });
  }
}
