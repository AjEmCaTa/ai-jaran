import type { SupabaseClient } from '@supabase/supabase-js';
import { selectExpired, selectReminders, type LifecycleRow } from './reservationRules.ts';

type Row = LifecycleRow & { business_id?: string | null; service_name?: string | null; customer_name?: string | null };

export type ReminderSender = (row: Row) => Promise<boolean>;

export type LifecycleSummary = { scanned: number; expired: number; reminded: number; reminderFailed: number };

const TERMINAL = ['otkazano', 'cancelled', 'canceled', 'zavrseno', 'completed', 'finished', 'isteklo', 'expired'];
const norm = (v: unknown) => String(v ?? '').toLowerCase().replace(/đ/g, 'dj').normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

// Jedan prolaz: (1) zahtjevi koji su istekli dobijaju status 'Isteklo' (termin se oslobađa),
// (2) potvrđenim terminima u narednih 24 h šalje se podsjetnik tačno jednom.
// Sve izmjene su atomarne (uvjet na stari status / reminder_sent_at), pa istovremeni prolazi ne dupliraju posao.
export async function runReservationLifecycle(admin: SupabaseClient, nowMs: number, sendReminder: ReminderSender): Promise<LifecycleSummary> {
  const summary: LifecycleSummary = { scanned: 0, expired: 0, reminded: 0, reminderFailed: 0 };
  const rows: Row[] = [];
  const pageSize = 1000;
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await admin
      .from('reservations')
      .select('id, business_id, status, reservation_date, created_at, reminder_sent_at, customer_email, customer_name, service_name')
      .order('created_at', { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (error) throw error;
    rows.push(...((data || []) as Row[]));
    if (!data || data.length < pageSize) break;
  }
  const active = rows.filter((r) => !TERMINAL.includes(norm(r.status)));
  summary.scanned = active.length;

  for (const row of selectExpired(active, nowMs)) {
    let q = admin.from('reservations').update({ status: 'Isteklo' }).eq('id', row.id);
    q = row.status === null || row.status === undefined ? q.is('status', null) : q.eq('status', row.status as string);
    const { data, error } = await q.select('id').maybeSingle();
    if (error) throw error;
    if (data) summary.expired += 1;
  }

  for (const row of selectReminders(active, nowMs)) {
    // Rezervacija se "zauzima" prije slanja: ko prvi upiše reminder_sent_at, taj šalje.
    const claimedAt = new Date(nowMs).toISOString();
    const { data: claimed, error: claimError } = await admin
      .from('reservations')
      .update({ reminder_sent_at: claimedAt })
      .eq('id', row.id)
      .is('reminder_sent_at', null)
      .select('id')
      .maybeSingle();
    if (claimError) throw claimError;
    if (!claimed) continue;
    let sent = false;
    try {
      sent = await sendReminder(row);
    } catch (e) {
      console.error('Podsjetnik nije poslan:', e);
    }
    if (sent) {
      summary.reminded += 1;
    } else {
      summary.reminderFailed += 1;
      // Vrati oznaku da sljedeći prolaz pokuša ponovo.
      await admin.from('reservations').update({ reminder_sent_at: null }).eq('id', row.id);
    }
  }
  return summary;
}
