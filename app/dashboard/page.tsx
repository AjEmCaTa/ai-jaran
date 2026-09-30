'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"
);

type DashboardReservation = {
  id: string;
  user_id?: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  service_name: string | null;
  reservation_date: string | null;
  status: string | null;
  price: string | number | null;
};

function parsePrice(value: unknown) {
  let normalized = String(value ?? '').replace(/[^\d,.-]/g, '');
  if (normalized.includes(',')) normalized = normalized.replace(/\./g, '').replace(',', '.');
  else normalized = normalized.replace(/\.(?=\d{3}$)/, '');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeStatus(value: unknown) {
  return String(value ?? '').trim().toLocaleLowerCase('bs').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function isCancelledStatus(value: unknown) {
  return ['otkazano', 'cancelled', 'canceled'].includes(normalizeStatus(value));
}

function isCompletedStatus(value: unknown) {
  return ['zavrseno', 'completed', 'finished'].includes(normalizeStatus(value));
}

function dateKey(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export default function DashboardPage() {
  const [business, setBusiness] = useState({ id: '', name: '', city: '', category: '', phone: '', owner_email: '', address: '', work_start: '', work_end: '', work_days: [] as string[] });
  const [userName, setUserName] = useState('Korisnik');
  const [loading, setLoading] = useState(true);
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [statistics, setStatistics] = useState({ today: 0, month: 0, completed: 0, cancelled: 0, customers: 0, revenueToday: 0, revenueMonth: 0, revenueTotal: 0, upcoming: 0, services: 0 });
  const [recentBookings, setRecentBookings] = useState<DashboardReservation[]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          setLoading(false);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Prijavite se ponovo za pristup dashboardu.');
        const response = await fetch('/api/dashboard', { headers: { Authorization: `Bearer ${session.access_token}` } });
        const dashboard = await response.json();
        if (!response.ok) throw new Error(dashboard.error || 'Dashboard nije moguće učitati.');

        setUserName(user.user_metadata?.full_name || user.email || 'Korisnik');
        const businessData = dashboard.business;
        const reservations: DashboardReservation[] = dashboard.reservations || [];
        setBusiness({ ...businessData, work_days: Array.isArray(businessData.work_days) ? businessData.work_days : [] });
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const month = today.slice(0, 7);
        const customers = new Set(reservations.map((res) => String(res.user_id || res.customer_email || res.customer_phone || res.customer_name || '').trim().toLocaleLowerCase('bs')).filter(Boolean));
        const revenue = (items: DashboardReservation[]) => items.reduce((sum, res) => sum + (isCompletedStatus(res.status) ? parsePrice(res.price) : 0), 0);
        setRecentBookings(reservations.slice(0, 5));
        setStatistics((current) => ({
          ...current,
          today: reservations.filter((res) => dateKey(res.reservation_date) === today).length,
          month: reservations.filter((res) => dateKey(res.reservation_date).slice(0, 7) === month).length,
          completed: reservations.filter((res) => isCompletedStatus(res.status)).length,
          cancelled: reservations.filter((res) => isCancelledStatus(res.status)).length,
          customers: customers.size,
          revenueToday: revenue(reservations.filter((res) => dateKey(res.reservation_date) === today)),
          revenueMonth: revenue(reservations.filter((res) => dateKey(res.reservation_date).slice(0, 7) === month)),
          revenueTotal: revenue(reservations),
          upcoming: reservations.filter((res) => !isCancelledStatus(res.status) && !isCompletedStatus(res.status) && Boolean(res.reservation_date) && new Date(res.reservation_date as string).getTime() >= now.getTime()).length,
        }));

        setStatistics((current) => ({ ...current, services: dashboard.serviceCount || 0 }));

      } catch (err) {
        console.error("Greška pri učitavanju dashboard podataka:", err);
        setErrorMessage(err instanceof Error ? err.message : 'Podatke nije moguće učitati.');
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const saveBusiness = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingBusiness(true);
    setSaveMessage('');
    setErrorMessage('');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setErrorMessage('Prijavite se ponovo da biste sačuvali izmjene.');
      setSavingBusiness(false);
      return;
    }
    const response = await fetch('/api/dashboard', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({
      name: business.name.trim(),
      city: business.city.trim() || null,
      category: business.category.trim() || null,
      phone: business.phone.trim() || null,
      owner_email: business.owner_email.trim() || null,
      address: business.address.trim() || null,
      work_start: business.work_start || null,
      work_end: business.work_end || null,
      work_days: business.work_days,
      }),
    });
    const result = await response.json();
    if (!response.ok) setErrorMessage(result.error || 'Promjene nije moguće sačuvati.');
    else setSaveMessage('Podaci biznisa su sačuvani.');
    setSavingBusiness(false);
  };

  const money = (amount: number) => `${amount.toLocaleString('bs-BA', { maximumFractionDigits: 2 })} KM`;

  return (
    <div className="min-w-0 space-y-6 pb-12 sm:space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-800 pb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Kontrolna ploča</h2>
          <p className="text-slate-400 text-sm mt-1">
            Dobrodošli nazad, <span className="text-white font-medium">{userName}</span>. Pregled poslovanja za <span className="text-blue-400 font-semibold">{business.name || 'Moj biznis'}</span> {business.city && `(${business.city})`}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard/reservations"
            className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition"
          >
            + Upravljaj terminima
          </Link>
        </div>
      </div>

      {errorMessage && <p role="alert" className="rounded-lg border border-red-800 bg-red-950/50 p-4 text-sm text-red-200">{errorMessage}</p>}

      <section aria-label="Statistika rezervacija" className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4">
        {[
          ['Rezervacije danas', statistics.today, 'text-white'],
          ['Rezervacije ovaj mjesec', statistics.month, 'text-white'],
          ['Završene rezervacije', statistics.completed, 'text-blue-400'],
          ['Otkazane rezervacije', statistics.cancelled, 'text-red-400'],
          ['Broj klijenata', statistics.customers, 'text-white'],
          ['Prihod danas', money(statistics.revenueToday), 'text-emerald-400'],
          ['Prihod ovaj mjesec', money(statistics.revenueMonth), 'text-emerald-400'],
          ['Ukupan prihod', money(statistics.revenueTotal), 'text-emerald-400'],
          ['Predstojeći termini', statistics.upcoming, 'text-amber-400'],
          ['Usluge u cjenovniku', statistics.services, 'text-blue-400'],
        ].map(([label, value, color]) => (
          <div key={String(label)} className="min-w-0 rounded-xl border border-gray-800 bg-gray-900/80 p-4 sm:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
            <p className={`mt-2 break-words text-2xl font-black ${color}`}>{loading ? '...' : value}</p>
          </div>
        ))}
      </section>

      <section className="min-w-0 rounded-xl border border-gray-800 bg-gray-900/60 p-4 sm:p-6">
        <div className="mb-5">
          <h3 className="text-base font-bold text-white">Podaci o biznisu</h3>
          <p className="mt-1 text-xs text-slate-400">Uređujete podatke povezane s vašim vlasničkim profilom.</p>
        </div>
        <form onSubmit={saveBusiness} className="grid gap-4 sm:grid-cols-2">
          {([
            ['name', 'Naziv biznisa', 'text'],
            ['category', 'Djelatnost', 'text'],
            ['city', 'Grad / lokacija', 'text'],
            ['phone', 'Telefon', 'tel'],
            ['owner_email', 'Email biznisa', 'email'],
            ['address', 'Adresa', 'text'],
          ] as const).map(([field, label, type]) => (
            <label key={field} className="block text-xs font-medium text-slate-300">
              {label}
              <input required={field === 'name'} type={type} value={business[field]} onChange={(event) => setBusiness((current) => ({ ...current, [field]: event.target.value }))} className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500" />
            </label>
          ))}
          <label className="block text-xs font-medium text-slate-300">Početak radnog vremena
            <input type="time" value={business.work_start.slice(0, 5)} onChange={(event) => setBusiness((current) => ({ ...current, work_start: event.target.value }))} className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500" />
          </label>
          <label className="block text-xs font-medium text-slate-300">Kraj radnog vremena
            <input type="time" value={business.work_end.slice(0, 5)} onChange={(event) => setBusiness((current) => ({ ...current, work_end: event.target.value }))} className="mt-2 w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500" />
          </label>
          <fieldset className="sm:col-span-2">
            <legend className="mb-2 text-xs font-medium text-slate-300">Radni dani</legend>
            <div className="flex flex-wrap gap-2">
              {['Pon', 'Uto', 'Sri', 'Cet', 'Pet', 'Sub', 'Ned'].map((day) => (
                <label key={day} className="flex items-center gap-2 rounded-lg border border-gray-700 px-3 py-2 text-xs text-slate-300">
                  <input type="checkbox" checked={business.work_days.includes(day)} onChange={(event) => setBusiness((current) => ({ ...current, work_days: event.target.checked ? [...current.work_days, day] : current.work_days.filter((item) => item !== day) }))} className="accent-blue-500" />
                  {day}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex items-end gap-3 sm:col-span-2">
            <button type="submit" disabled={savingBusiness || loading || !business.id} className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50">{savingBusiness ? 'Čuvanje...' : 'Sačuvaj podatke'}</button>
            {saveMessage && <p role="status" className="pb-2 text-sm text-emerald-400">{saveMessage}</p>}
          </div>
        </form>
      </section>

      <div className="hidden overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/60 shadow-xl lg:block">
        <div className="p-6 border-b border-gray-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-white">Nedavne rezervacije</h3>
          <Link href="/dashboard/reservations" className="text-xs text-blue-400 hover:text-blue-300 font-semibold transition">
            Vidi sve u kalendaru →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-950/40 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-6">Klijent / Telefon</th>
                <th className="py-3.5 px-6">Usluga</th>
                <th className="py-3.5 px-6">Cijena</th>
                <th className="py-3.5 px-6">Termin</th>
                <th className="py-3.5 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 text-xs text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">Učitavanje podataka...</td>
                </tr>
              ) : recentBookings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">Još uvijek nema zabilježenih rezervacija.</td>
                </tr>
              ) : (
                recentBookings.map((b) => {
                  const clientName = b.customer_name || 'Klijent';
                  const clientPhone = b.customer_phone || '';
                  const serviceName = b.service_name || 'Usluga';
                  const price = b.price != null && b.price !== '' ? (String(b.price).includes('KM') ? b.price : `${b.price} KM`) : '-';
                  const date = b.reservation_date ? new Date(b.reservation_date).toLocaleString('bs-BA') : '-';
                  const status = b.status || 'Na čekanju';

                  const isCancelled = status.toLowerCase() === 'otkazano' || status.toLowerCase() === 'cancelled';
                  const isFinished = status.toLowerCase() === 'završeno' || status.toLowerCase() === 'zavrseno';

                  return (
                    <tr key={b.id} className="hover:bg-gray-800/30 transition">
                      <td className="py-4 px-6 font-semibold text-white">
                        {clientName}
                        {clientPhone && <span className="block text-[11px] text-blue-400 font-normal">{clientPhone}</span>}
                      </td>
                      <td className="py-4 px-6 text-slate-300">{serviceName}</td>
                      <td className="py-4 px-6 font-bold text-white">{price}</td>
                      <td className="py-4 px-6 text-slate-300">{date}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          isCancelled
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : isFinished
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <section aria-label="Nedavne rezervacije" className="space-y-3 lg:hidden">
        <h3 className="text-base font-bold text-white">Nedavne rezervacije</h3>
        {loading ? <p className="py-8 text-center text-sm text-slate-500">Učitavanje podataka...</p>
          : recentBookings.length === 0 ? <p className="rounded-xl border border-gray-800 bg-gray-900/60 px-4 py-8 text-center text-sm text-slate-500">Još uvijek nema zabilježenih rezervacija.</p>
            : recentBookings.map((booking) => {
              const status = booking.status || 'Na čekanju';
              const isCancelled = isCancelledStatus(status);
              const isFinished = isCompletedStatus(status);
              return (
                <article key={booking.id} className="space-y-3 rounded-xl border border-gray-800 bg-gray-900/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="break-words font-semibold text-white">{booking.customer_name || 'Klijent'}</h4>
                      <p className="mt-1 break-words text-xs text-blue-300">{booking.customer_phone || 'Telefon nije naveden'}</p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${isCancelled ? 'border-red-500/30 bg-red-500/10 text-red-300' : isFinished ? 'border-blue-500/30 bg-blue-500/10 text-blue-300' : 'border-amber-500/30 bg-amber-500/10 text-amber-300'}`}>{status}</span>
                  </div>
                  <dl className="grid grid-cols-2 gap-3 border-t border-gray-800 pt-3 text-xs">
                    <div className="col-span-2 min-w-0"><dt className="text-slate-500">Usluga</dt><dd className="mt-0.5 break-words text-slate-200">{booking.service_name || 'Usluga'}</dd></div>
                    <div><dt className="text-slate-500">Termin</dt><dd className="mt-0.5 text-slate-200">{booking.reservation_date ? new Date(booking.reservation_date).toLocaleString('bs-BA') : '-'}</dd></div>
                    <div><dt className="text-slate-500">Cijena</dt><dd className="mt-0.5 font-semibold text-white">{booking.price != null && booking.price !== '' ? `${booking.price}${String(booking.price).includes('KM') ? '' : ' KM'}` : '-'}</dd></div>
                  </dl>
                  <Link href="/dashboard/reservations" className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-gray-700 px-3 py-2 text-sm font-semibold text-blue-300">Otvori rezervacije</Link>
                </article>
              );
            })}
      </section>
    </div>
  );
}