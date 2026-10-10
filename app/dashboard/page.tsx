'use client';

import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import Icon, { type IconName } from './_components/icons';
import BookingLinkCard from './_components/BookingLinkCard';
import SetupChecklist from './_components/SetupChecklist';
import MonthlyGoal from './_components/MonthlyGoal';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
);

const LINK_KEY = 'poslo-booking-link';

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

type NewStatus = 'Potvrđeno' | 'Završeno' | 'Otkazano';

type Business = {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  work_start: string;
  work_end: string;
  work_days: string[];
};

function parsePrice(value: unknown) {
  let normalized = String(value ?? '').replace(/[^\d,.-]/g, '');
  if (normalized.includes(',')) normalized = normalized.replace(/\./g, '').replace(',', '.');
  else normalized = normalized.replace(/\.(?=\d{3}$)/, '');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeStatus(value: unknown) {
  return String(value ?? '').trim().toLocaleLowerCase('bs').replace(/đ/g, 'dj').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
const isCancelledStatus = (v: unknown) => ['otkazano', 'cancelled', 'canceled'].includes(normalizeStatus(v));
const isCompletedStatus = (v: unknown) => ['zavrseno', 'completed', 'finished'].includes(normalizeStatus(v));
const isConfirmedStatus = (v: unknown) => ['potvrdjeno', 'confirmed'].includes(normalizeStatus(v));
const isOpenStatus = (v: unknown) => !isCancelledStatus(v) && !isCompletedStatus(v);

function localKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function dateKey(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return localKey(date);
}

function waNumber(phone: string | null) {
  let digits = String(phone ?? '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('00')) digits = digits.slice(2);
  else if (digits.startsWith('0')) digits = `387${digits.slice(1)}`;
  return digits;
}

const money = (amount: number) => `${amount.toLocaleString('bs-BA', { maximumFractionDigits: 2 })} KM`;
const trendOf = (current: number, previous: number) => (previous > 0 ? Math.round(((current - previous) / previous) * 100) : null);

const panel =
  'min-w-0 rounded-[var(--po-radius)] border border-white/[0.07] bg-gray-900/70 p-[var(--po-pad)] backdrop-blur';

function Skeleton() {
  return <span className="inline-block h-7 w-20 animate-pulse rounded-md bg-white/10 align-middle" />;
}

function PanelTitle({ icon, title, hint }: { icon: IconName; title: string; hint?: ReactNode }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
          <Icon name={icon} className="h-4 w-4" />
        </span>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      {hint}
    </div>
  );
}

function Trend({ value }: { value: number | null }) {
  if (value === null) return null;
  const tone = value > 0 ? 'text-emerald-400' : value < 0 ? 'text-red-400' : 'text-slate-400';
  const arrow = value > 0 ? '▲' : value < 0 ? '▼' : '•';
  return (
    <span className={`ml-2 whitespace-nowrap text-xs font-semibold ${tone}`} title="U odnosu na isti period prošlog mjeseca">
      {arrow} {Math.abs(value)}%
    </span>
  );
}

function Stat({ label, value, loading, tone = 'text-white', trend }: { label: string; value: ReactNode; loading: boolean; tone?: string; trend?: number | null }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`mt-1 break-words text-2xl font-bold tabular-nums ${tone}`}>
        {loading ? <Skeleton /> : value}
        {!loading && trend !== undefined && <Trend value={trend} />}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone = isCancelledStatus(status)
    ? 'border-red-500/25 bg-red-500/10 text-red-300'
    : isCompletedStatus(status)
      ? 'border-blue-500/25 bg-blue-500/10 text-blue-300'
      : isConfirmedStatus(status)
        ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
        : 'border-amber-500/25 bg-amber-500/10 text-amber-300';
  return <span className={`inline-flex shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tone}`}>{status}</span>;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 11) return 'Dobro jutro';
  if (hour < 18) return 'Dobar dan';
  return 'Dobro veče';
}

const actionBtn =
  'inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition disabled:opacity-50';

function ReservationRow({
  res,
  mode,
  busy,
  onStatus,
}: {
  res: DashboardReservation;
  mode: 'upcoming' | 'pending';
  busy: boolean;
  onStatus: (id: string, status: NewStatus) => void;
}) {
  const d = new Date(res.reservation_date as string);
  const wa = waNumber(res.customer_phone);
  return (
    <li className="rounded-[calc(var(--po-radius)*0.7)] bg-white/[0.03] p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-blue-500/10 text-blue-300">
          <span className="text-base font-bold leading-none">{d.getDate()}</span>
          <span className="mt-0.5 text-[10px]">{d.toLocaleDateString('bs-BA', { month: 'short' })}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{res.customer_name || 'Klijent'}</p>
          <p className="truncate text-xs text-slate-400">
            {d.toLocaleTimeString('bs-BA', { hour: '2-digit', minute: '2-digit' })} · {res.service_name || 'Usluga'}
          </p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {mode === 'upcoming' ? (
          <>
            {!isConfirmedStatus(res.status) && (
              <button type="button" disabled={busy} onClick={() => onStatus(res.id, 'Potvrđeno')} className={`${actionBtn} border-emerald-500/30 bg-emerald-600/15 text-emerald-300 hover:bg-emerald-600/25`}>
                <Icon name="check" className="h-3.5 w-3.5" /> Potvrdi
              </button>
            )}
            {res.customer_phone && (
              <a href={`tel:${res.customer_phone.replace(/\s/g, '')}`} className={`${actionBtn} border-white/10 text-slate-200 hover:border-blue-500/40`}>
                <Icon name="phone" className="h-3.5 w-3.5 text-blue-400" /> Nazovi
              </a>
            )}
            {wa && (
              <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className={`${actionBtn} border-white/10 text-slate-200 hover:border-emerald-500/40`}>
                <Icon name="message" className="h-3.5 w-3.5 text-emerald-400" /> WhatsApp
              </a>
            )}
          </>
        ) : (
          <button type="button" disabled={busy} onClick={() => onStatus(res.id, 'Završeno')} className={`${actionBtn} border-blue-500/30 bg-blue-600/15 text-blue-300 hover:bg-blue-600/25`}>
            <Icon name="check" className="h-3.5 w-3.5" /> Završi
          </button>
        )}
        <button type="button" disabled={busy} onClick={() => onStatus(res.id, 'Otkazano')} className={`${actionBtn} border-red-500/30 bg-red-600/10 text-red-300 hover:bg-red-600/20`}>
          <Icon name="cancel" className="h-3.5 w-3.5" /> Otkaži
        </button>
      </div>
    </li>
  );
}

export default function DashboardPage() {
  const [business, setBusiness] = useState<Business>({ id: '', name: '', city: '', address: '', phone: '', work_start: '', work_end: '', work_days: [] });
  const [userName, setUserName] = useState('Korisnik');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [reservations, setReservations] = useState<DashboardReservation[]>([]);
  const [serviceCount, setServiceCount] = useState(0);
  const [chartMode, setChartMode] = useState<'bookings' | 'revenue'>('bookings');
  const [bookingLink, setBookingLink] = useState('');
  const [busyId, setBusyId] = useState('');

  useEffect(() => {
    try {
      setBookingLink(window.localStorage.getItem(LINK_KEY) || '');
    } catch {
      /* privatni mod */
    }

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
        const b = dashboard.business || {};
        setBusiness({
          id: b.id || '',
          name: b.name || '',
          city: b.city || '',
          address: b.address || '',
          phone: b.phone || '',
          work_start: b.work_start || '',
          work_end: b.work_end || '',
          work_days: Array.isArray(b.work_days) ? b.work_days : [],
        });
        setReservations(dashboard.reservations || []);
        setServiceCount(dashboard.serviceCount || 0);
      } catch (err) {
        console.error('Greška pri učitavanju dashboard podataka:', err);
        setErrorMessage(err instanceof Error ? err.message : 'Podatke nije moguće učitati.');
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const saveLink = (link: string) => {
    setBookingLink(link);
    try {
      window.localStorage.setItem(LINK_KEY, link);
    } catch {
      /* privatni mod */
    }
  };

  const updateStatus = async (id: string, newStatus: NewStatus) => {
    if (newStatus === 'Otkazano' && !window.confirm('Sigurno želite otkazati ovaj termin?')) return;
    setBusyId(id);
    setErrorMessage('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Prijavite se ponovo za izmjenu rezervacije.');
      const response = await fetch('/api/dashboard/reservations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Status nije moguće promijeniti.');
      setReservations((current) => current.map((res) => (res.id === id ? { ...res, status: newStatus } : res)));
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Status nije moguće promijeniti.');
    } finally {
      setBusyId('');
    }
  };

  const data = useMemo(() => {
    const now = new Date();
    const today = localKey(now);
    const month = today.slice(0, 7);
    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    const revenueOf = (items: DashboardReservation[]) =>
      items.reduce((sum, res) => sum + (isCompletedStatus(res.status) ? parsePrice(res.price) : 0), 0);

    const todayItems = reservations.filter((res) => dateKey(res.reservation_date) === today);
    const monthItems = reservations.filter((res) => dateKey(res.reservation_date).slice(0, 7) === month);
    // isti period prošlog mjeseca (od 1. do današnjeg dana u mjesecu), da poređenje bude pošteno
    const prevItems = reservations.filter((res) => {
      const key = dateKey(res.reservation_date);
      return key.slice(0, 7) === prevMonth && Number(key.slice(8, 10)) <= now.getDate();
    });

    const customers = new Set(
      reservations
        .map((res) => String(res.user_id || res.customer_email || res.customer_phone || res.customer_name || '').trim().toLocaleLowerCase('bs'))
        .filter(Boolean)
    );

    const withDate = reservations.filter((res) => Boolean(res.reservation_date) && !Number.isNaN(new Date(res.reservation_date as string).getTime()));
    const time = (res: DashboardReservation) => new Date(res.reservation_date as string).getTime();

    const upcoming = withDate.filter((res) => isOpenStatus(res.status) && time(res) >= now.getTime()).sort((a, b) => time(a) - time(b));
    const pending = withDate.filter((res) => isOpenStatus(res.status) && time(res) < now.getTime()).sort((a, b) => time(b) - time(a));

    const days = Array.from({ length: 7 }, (_, index) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - index));
      const key = localKey(d);
      const items = reservations.filter((res) => dateKey(res.reservation_date) === key);
      return {
        key,
        label: d.toLocaleDateString('bs-BA', { weekday: 'short' }),
        isToday: key === today,
        count: items.filter((res) => !isCancelledStatus(res.status)).length,
        revenue: revenueOf(items),
      };
    });

    const active = reservations.filter((res) => !isCancelledStatus(res.status));

    const serviceMap = new Map<string, { name: string; count: number; revenue: number }>();
    active.forEach((res) => {
      const name = res.service_name || 'Usluga';
      const entry = serviceMap.get(name) || { name, count: 0, revenue: 0 };
      entry.count += 1;
      entry.revenue += isCompletedStatus(res.status) ? parsePrice(res.price) : 0;
      serviceMap.set(name, entry);
    });
    const topServices = [...serviceMap.values()].sort((a, b) => b.count - a.count).slice(0, 5);

    const weekdayCounts = Array(7).fill(0) as number[];
    const hourCounts = new Map<number, number>();
    active.forEach((res) => {
      if (!res.reservation_date || Number.isNaN(new Date(res.reservation_date).getTime())) return;
      const d = new Date(res.reservation_date);
      weekdayCounts[d.getDay()] += 1;
      if (res.reservation_date.includes('T')) hourCounts.set(d.getHours(), (hourCounts.get(d.getHours()) || 0) + 1);
    });
    const weekdays = [1, 2, 3, 4, 5, 6, 0].map((idx) => ({
      label: ['Ned', 'Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub'][idx],
      count: weekdayCounts[idx],
    }));
    const bestHour = [...hourCounts.entries()].sort((a, b) => b[1] - a[1])[0];

    const cancelled = reservations.filter((res) => isCancelledStatus(res.status)).length;
    const revenueMonth = revenueOf(monthItems);

    return {
      today: todayItems.length,
      month: monthItems.length,
      completed: reservations.filter((res) => isCompletedStatus(res.status)).length,
      cancelled,
      cancelRate: reservations.length ? Math.round((cancelled / reservations.length) * 100) : 0,
      customers: customers.size,
      revenueToday: revenueOf(todayItems),
      revenueMonth,
      revenueTotal: revenueOf(reservations),
      monthTrend: trendOf(monthItems.length, prevItems.length),
      revenueTrend: trendOf(revenueMonth, revenueOf(prevItems)),
      upcoming,
      pending,
      days,
      topServices,
      weekdays,
      bestHour,
      recent: reservations.slice(0, 5),
    };
  }, [reservations]);

  const firstName = (userName.includes('@') ? userName.split('@')[0] : userName.split(' ')[0]) || 'Korisnik';
  const next = data.upcoming[0];
  const chartValues = data.days.map((d) => (chartMode === 'bookings' ? d.count : d.revenue));
  const chartMax = Math.max(...chartValues, 0);
  const chartTotal = chartValues.reduce((a, b) => a + b, 0);
  const todayLabel = new Date().toLocaleDateString('bs-BA', { weekday: 'long', day: 'numeric', month: 'long' });
  const topMax = Math.max(...data.topServices.map((s) => s.count), 1);
  const weekdayMax = Math.max(...data.weekdays.map((d) => d.count), 0);

  const checklist = [
    { label: 'Dodajte usluge i cijene', hint: 'Klijenti biraju iz vašeg cjenovnika.', done: serviceCount > 0, href: '/dashboard/services' },
    { label: 'Postavite radno vrijeme', hint: 'Početak, kraj i radni dani.', done: Boolean(business.work_start && business.work_end && business.work_days.length > 0), href: '/dashboard/settings' },
    { label: 'Upišite telefon i adresu', hint: 'Da vas klijenti lako pronađu i nazovu.', done: Boolean(business.phone && business.address), href: '/dashboard/settings' },
    { label: 'Podijelite link za rezervacije', hint: 'Sačuvajte link ispod i pošaljite ga klijentima.', done: Boolean(bookingLink), href: '#link-rezervacije' },
    { label: 'Primite prvu rezervaciju', hint: 'Pojavit će se na ovoj ploči čim stigne.', done: reservations.length > 0, href: '/dashboard/reservations' },
  ];
  const checklistVisible = !loading && checklist.some((item) => !item.done);

  const quickActions: { href: string; label: string; icon: IconName }[] = [
    { href: '/dashboard/services', label: 'Usluge', icon: 'tag' },
    { href: '/dashboard/customers', label: 'Klijenti', icon: 'users' },
    { href: '/dashboard/settings', label: 'Izgled', icon: 'palette' },
  ];

  return (
    <div className="mx-auto min-w-0 max-w-7xl space-y-5 pb-12">
      {errorMessage && (
        <p role="alert" className="rounded-lg border border-red-800 bg-red-950/50 p-4 text-sm text-red-200">
          {errorMessage}
        </p>
      )}

      {/* HERO */}
      <section
        className="relative overflow-hidden rounded-[var(--po-radius)] border border-blue-500/20 p-[var(--po-pad)] sm:p-8"
        style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--color-blue-500) 24%, var(--color-gray-900)), var(--color-gray-900) 62%)' }}
      >
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
          <div className="min-w-0">
            <p className="text-sm capitalize text-blue-300/80">{todayLabel}</p>
            <h2 className="mt-1 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {greeting()}, {firstName}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              {business.name || 'Moj biznis'}
              {business.city && ` · ${business.city}`}
            </p>

            <div className="mt-6 flex flex-wrap items-end gap-x-8 gap-y-4">
              <div>
                <p className="text-xs text-slate-400">Rezervacija danas</p>
                <p className="mt-1 text-5xl font-bold tabular-nums text-white">{loading ? <Skeleton /> : data.today}</p>
              </div>
              <div className="min-w-0 max-w-sm border-l border-white/10 pl-6">
                <p className="text-xs text-slate-400">Sljedeći termin</p>
                {loading ? (
                  <p className="mt-2"><Skeleton /></p>
                ) : next ? (
                  <>
                    <p className="mt-1 truncate text-base font-semibold text-white">
                      {new Date(next.reservation_date as string).toLocaleString('bs-BA', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="truncate text-sm text-slate-400">
                      {next.customer_name || 'Klijent'} · {next.service_name || 'Usluga'}
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-sm text-slate-400">Nema zakazanih termina. Podijelite link za rezervacije s klijentima.</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <Link
              href="/dashboard/reservations"
              className="col-span-3 flex items-center justify-center gap-2 rounded-[calc(var(--po-radius)*0.8)] bg-blue-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300"
            >
              <Icon name="plus" className="h-4 w-4" />
              Upravljaj terminima
            </Link>
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex flex-col items-center gap-1.5 rounded-[calc(var(--po-radius)*0.8)] border border-white/10 bg-white/[0.04] px-2 py-3 text-xs font-medium text-slate-200 transition hover:border-blue-500/40 hover:bg-white/[0.07]"
              >
                <Icon name={action.icon} className="h-4 w-4 text-blue-400" />
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* LISTA ZA POČETAK + LINK */}
      <div className="grid gap-5 lg:grid-cols-2">
        {checklistVisible && <SetupChecklist items={checklist} />}
        <div id="link-rezervacije" className={checklistVisible ? '' : 'lg:col-span-2'}>
          <BookingLinkCard link={bookingLink} onSave={saveLink} className="h-full" />
        </div>
      </div>

      {/* TERMINI KOJE TREBA ZATVORITI */}
      {!loading && data.pending.length > 0 && (
        <section className={`${panel} border-amber-500/25`} aria-label="Termini koje treba zatvoriti">
          <PanelTitle
            icon="alert"
            title={`Treba zatvoriti (${data.pending.length})`}
            hint={<span className="hidden text-xs text-slate-400 sm:block">Prošli termini bez statusa. Završeni ulaze u prihod.</span>}
          />
          <ul className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
            {data.pending.slice(0, 6).map((res) => (
              <ReservationRow key={res.id} res={res} mode="pending" busy={busyId === res.id} onStatus={updateStatus} />
            ))}
          </ul>
          {data.pending.length > 6 && (
            <Link href="/dashboard/reservations" className="mt-4 inline-block text-xs font-medium text-blue-400 hover:text-blue-300">
              Još {data.pending.length - 6} u kalendaru
            </Link>
          )}
        </section>
      )}

      {/* GRAFIKON + NADOLAZEĆI */}
      <div className="grid gap-5 lg:grid-cols-3">
        <section className={`${panel} lg:col-span-2`} aria-label="Aktivnost u zadnjih 7 dana">
          <PanelTitle
            icon="trending"
            title="Zadnjih 7 dana"
            hint={
              <div className="flex rounded-full border border-white/10 p-0.5 text-xs">
                {(['bookings', 'revenue'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setChartMode(mode)}
                    aria-pressed={chartMode === mode}
                    className={`rounded-full px-3 py-1 font-medium transition ${chartMode === mode ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    {mode === 'bookings' ? 'Rezervacije' : 'Prihod'}
                  </button>
                ))}
              </div>
            }
          />
          {loading ? (
            <div className="h-48 animate-pulse rounded-lg bg-white/5" />
          ) : chartMax === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-white/10 text-center">
              <p className="text-sm font-medium text-slate-300">
                {chartMode === 'bookings' ? 'Još nema rezervacija u zadnjih 7 dana' : 'Još nema završenih termina s prihodom'}
              </p>
              <p className="mt-1 max-w-xs text-xs text-slate-500">Čim stigne prva rezervacija, ovdje ćete vidjeti kako posao raste.</p>
            </div>
          ) : (
            <>
              <p className="mb-3 text-xs text-slate-400">
                Ukupno: <span className="font-semibold text-white">{chartMode === 'bookings' ? chartTotal : money(chartTotal)}</span>
              </p>
              <div className="flex h-48 items-stretch gap-2 sm:gap-4">
                {data.days.map((day, index) => {
                  const value = chartValues[index];
                  const pct = chartMax > 0 ? (value / chartMax) * 100 : 0;
                  return (
                    <div key={day.key} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                      <div className="flex w-full flex-1 items-end justify-center rounded-lg bg-white/[0.025]">
                        <div
                          title={chartMode === 'bookings' ? `${value} rezervacija` : money(value)}
                          className={`w-full max-w-12 rounded-t-md transition-[height] duration-500 ${day.isToday ? 'bg-gradient-to-t from-blue-600 to-blue-400' : 'bg-blue-500/30'}`}
                          style={{ height: value > 0 ? `${Math.max(pct, 8)}%` : '2px' }}
                        />
                      </div>
                      <span className={`text-xs ${day.isToday ? 'font-semibold text-white' : 'text-slate-500'}`}>{day.label}</span>
                      <span className="text-[11px] font-medium tabular-nums text-slate-300">
                        {value > 0 ? (chartMode === 'bookings' ? value : Math.round(value)) : '–'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>

        <section className={panel} aria-label="Nadolazeći termini">
          <PanelTitle
            icon="clock"
            title="Nadolazeći termini"
            hint={<Link href="/dashboard/reservations" className="text-xs font-medium text-blue-400 hover:text-blue-300">Kalendar</Link>}
          />
          {loading ? (
            <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-lg bg-white/5" />)}</div>
          ) : data.upcoming.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-white/10 px-4 text-center">
              <p className="text-sm font-medium text-slate-300">Nema nadolazećih termina</p>
              <p className="mt-1 text-xs text-slate-500">Novi termini pojavit će se ovdje čim ih klijenti zakažu.</p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {data.upcoming.slice(0, 4).map((res) => (
                <ReservationRow key={res.id} res={res} mode="upcoming" busy={busyId === res.id} onStatus={updateStatus} />
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* GRUPISANA STATISTIKA */}
      <div className="grid gap-5 lg:grid-cols-3">
        <section className={panel} aria-label="Prihod">
          <PanelTitle icon="wallet" title="Prihod" />
          <div className="space-y-5">
            <Stat label="Ovaj mjesec" value={money(data.revenueMonth)} loading={loading} tone="text-emerald-400" trend={data.revenueTrend} />
            <div className="grid grid-cols-2 gap-4 border-t border-white/[0.06] pt-4">
              <Stat label="Danas" value={money(data.revenueToday)} loading={loading} tone="text-emerald-300" />
              <Stat label="Ukupno" value={money(data.revenueTotal)} loading={loading} tone="text-emerald-300" />
            </div>
          </div>
        </section>

        <section className={panel} aria-label="Rezervacije">
          <PanelTitle icon="calendar" title="Rezervacije" />
          <div className="grid grid-cols-2 gap-x-4 gap-y-5">
            <Stat label="Ovaj mjesec" value={data.month} loading={loading} trend={data.monthTrend} />
            <Stat label="Predstojeće" value={data.upcoming.length} loading={loading} tone="text-amber-400" />
            <Stat label="Završene" value={data.completed} loading={loading} tone="text-blue-400" />
            <Stat label="Otkazane" value={data.cancelled} loading={loading} tone="text-red-400" />
          </div>
        </section>

        <section className={panel} aria-label="Poslovanje">
          <PanelTitle icon="building" title="Poslovanje" />
          <div className="grid grid-cols-2 gap-x-4 gap-y-5">
            <Stat label="Klijenata" value={data.customers} loading={loading} />
            <Stat label="Usluga u cjenovniku" value={serviceCount} loading={loading} tone="text-blue-400" />
            <div className="col-span-2 border-t border-white/[0.06] pt-4">
              <Stat label="Stopa otkazivanja" value={`${data.cancelRate}%`} loading={loading} tone={data.cancelRate > 25 ? 'text-red-400' : 'text-white'} />
            </div>
          </div>
        </section>
      </div>

      {/* UVIDI + CILJ */}
      <div className="grid gap-5 lg:grid-cols-3">
        <section className={panel} aria-label="Najtraženije usluge">
          <PanelTitle icon="tag" title="Najtraženije usluge" />
          {loading ? (
            <div className="h-40 animate-pulse rounded-lg bg-white/5" />
          ) : data.topServices.length === 0 ? (
            <p className="rounded-lg border border-dashed border-white/10 px-4 py-10 text-center text-xs text-slate-500">Čim stignu rezervacije, vidjet ćete šta se najviše traži.</p>
          ) : (
            <ul className="space-y-3.5">
              {data.topServices.map((service) => (
                <li key={service.name}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate font-medium text-white">{service.name}</span>
                    <span className="shrink-0 text-xs tabular-nums text-slate-400">
                      {service.count}× {service.revenue > 0 && `· ${money(service.revenue)}`}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400" style={{ width: `${(service.count / topMax) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={panel} aria-label="Najjači dani i sati">
          <PanelTitle icon="chart" title="Najjači dani" />
          {loading ? (
            <div className="h-40 animate-pulse rounded-lg bg-white/5" />
          ) : weekdayMax === 0 ? (
            <p className="rounded-lg border border-dashed border-white/10 px-4 py-10 text-center text-xs text-slate-500">Nakon par rezervacija vidjet ćete koji su vam dani najjači.</p>
          ) : (
            <>
              <div className="flex h-28 items-end gap-2">
                {data.weekdays.map((day) => (
                  <div key={day.label} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                    <div className="flex w-full flex-1 items-end">
                      <div
                        title={`${day.count} rezervacija`}
                        className={`w-full rounded-t-md ${day.count === weekdayMax ? 'bg-gradient-to-t from-blue-600 to-blue-400' : 'bg-blue-500/30'}`}
                        style={{ height: day.count > 0 ? `${Math.max((day.count / weekdayMax) * 100, 10)}%` : '2px' }}
                      />
                    </div>
                    <span className={`text-[11px] ${day.count === weekdayMax ? 'font-semibold text-white' : 'text-slate-500'}`}>{day.label}</span>
                  </div>
                ))}
              </div>
              {data.bestHour && (
                <p className="mt-4 border-t border-white/[0.06] pt-3 text-xs text-slate-400">
                  Najtraženiji sat: <span className="font-semibold text-white">{String(data.bestHour[0]).padStart(2, '0')}:00</span> ({data.bestHour[1]} rezervacija)
                </p>
              )}
            </>
          )}
        </section>

        <MonthlyGoal revenue={data.revenueMonth} loading={loading} />
      </div>

      {/* NEDAVNE REZERVACIJE */}
      <section className={panel} aria-label="Nedavne rezervacije">
        <PanelTitle
          icon="users"
          title="Nedavne rezervacije"
          hint={<Link href="/dashboard/reservations" className="text-xs font-medium text-blue-400 hover:text-blue-300">Vidi sve u kalendaru</Link>}
        />
        {loading ? (
          <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-white/5" />)}</div>
        ) : data.recent.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/10 px-4 py-10 text-center">
            <p className="text-sm font-medium text-slate-300">Još uvijek nema zabilježenih rezervacija</p>
            <p className="mt-1 text-xs text-slate-500">Kad klijent zakaže termin, pojavit će se na ovoj listi.</p>
          </div>
        ) : (
          <ul className="divide-y divide-white/[0.06]">
            {data.recent.map((b) => {
              const name = b.customer_name || 'Klijent';
              const price = b.price != null && b.price !== '' ? (String(b.price).includes('KM') ? String(b.price) : `${b.price} KM`) : '-';
              return (
                <li key={b.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3.5 first:pt-0 last:pb-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-sm font-bold text-blue-300">
                    {name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1 basis-40">
                    <p className="truncate text-sm font-semibold text-white">{name}</p>
                    <p className="truncate text-xs text-slate-400">{b.customer_phone || 'Telefon nije naveden'}</p>
                  </div>
                  <p className="min-w-0 basis-36 truncate text-sm text-slate-300">{b.service_name || 'Usluga'}</p>
                  <p className="basis-40 text-xs text-slate-400">{b.reservation_date ? new Date(b.reservation_date).toLocaleString('bs-BA') : '-'}</p>
                  <p className="basis-20 text-sm font-semibold tabular-nums text-white">{price}</p>
                  <StatusBadge status={b.status || 'Na čekanju'} />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}