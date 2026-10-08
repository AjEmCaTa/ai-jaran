'use client';

import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import Icon, { type IconName } from './_components/icons';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
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
const isCancelledStatus = (v: unknown) => ['otkazano', 'cancelled', 'canceled'].includes(normalizeStatus(v));
const isCompletedStatus = (v: unknown) => ['zavrseno', 'completed', 'finished'].includes(normalizeStatus(v));

function localKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function dateKey(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return localKey(date);
}

const money = (amount: number) => `${amount.toLocaleString('bs-BA', { maximumFractionDigits: 2 })} KM`;

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

function Stat({ label, value, loading, tone = 'text-white' }: { label: string; value: ReactNode; loading: boolean; tone?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`mt-1 break-words text-2xl font-bold tabular-nums ${tone}`}>{loading ? <Skeleton /> : value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone = isCancelledStatus(status)
    ? 'border-red-500/25 bg-red-500/10 text-red-300'
    : isCompletedStatus(status)
      ? 'border-blue-500/25 bg-blue-500/10 text-blue-300'
      : 'border-amber-500/25 bg-amber-500/10 text-amber-300';
  return <span className={`inline-flex shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tone}`}>{status}</span>;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 11) return 'Dobro jutro';
  if (hour < 18) return 'Dobar dan';
  return 'Dobro veče';
}

export default function DashboardPage() {
  const [business, setBusiness] = useState({ name: '', city: '' });
  const [userName, setUserName] = useState('Korisnik');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [reservations, setReservations] = useState<DashboardReservation[]>([]);
  const [serviceCount, setServiceCount] = useState(0);
  const [chartMode, setChartMode] = useState<'bookings' | 'revenue'>('bookings');

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

        const fullName = user.user_metadata?.full_name || user.email || 'Korisnik';
        setUserName(fullName);
        setBusiness({ name: dashboard.business?.name || '', city: dashboard.business?.city || '' });
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

  const data = useMemo(() => {
    const now = new Date();
    const today = localKey(now);
    const month = today.slice(0, 7);
    const revenueOf = (items: DashboardReservation[]) =>
      items.reduce((sum, res) => sum + (isCompletedStatus(res.status) ? parsePrice(res.price) : 0), 0);

    const todayItems = reservations.filter((res) => dateKey(res.reservation_date) === today);
    const monthItems = reservations.filter((res) => dateKey(res.reservation_date).slice(0, 7) === month);
    const customers = new Set(
      reservations
        .map((res) => String(res.user_id || res.customer_email || res.customer_phone || res.customer_name || '').trim().toLocaleLowerCase('bs'))
        .filter(Boolean)
    );

    const upcoming = reservations
      .filter(
        (res) =>
          !isCancelledStatus(res.status) &&
          !isCompletedStatus(res.status) &&
          Boolean(res.reservation_date) &&
          new Date(res.reservation_date as string).getTime() >= now.getTime()
      )
      .sort((a, b) => new Date(a.reservation_date as string).getTime() - new Date(b.reservation_date as string).getTime());

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

    const cancelled = reservations.filter((res) => isCancelledStatus(res.status)).length;

    return {
      today: todayItems.length,
      month: monthItems.length,
      completed: reservations.filter((res) => isCompletedStatus(res.status)).length,
      cancelled,
      cancelRate: reservations.length ? Math.round((cancelled / reservations.length) * 100) : 0,
      customers: customers.size,
      revenueToday: revenueOf(todayItems),
      revenueMonth: revenueOf(monthItems),
      revenueTotal: revenueOf(reservations),
      upcoming,
      days,
      recent: reservations.slice(0, 5),
    };
  }, [reservations]);

  const firstName = (userName.includes('@') ? userName.split('@')[0] : userName.split(' ')[0]) || 'Korisnik';
  const next = data.upcoming[0];
  const chartValues = data.days.map((d) => (chartMode === 'bookings' ? d.count : d.revenue));
  const chartMax = Math.max(...chartValues, 0);
  const chartTotal = chartValues.reduce((a, b) => a + b, 0);
  const todayLabel = new Date().toLocaleDateString('bs-BA', { weekday: 'long', day: 'numeric', month: 'long' });

  const quickActions: { href: string; label: string; icon: IconName }[] = [
    { href: '/dashboard/reservations', label: 'Termini', icon: 'calendar' },
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
        style={{
          background:
            'linear-gradient(135deg, color-mix(in srgb, var(--color-blue-500) 24%, var(--color-gray-900)), var(--color-gray-900) 62%)',
        }}
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

          <div className="grid grid-cols-2 gap-2.5">
            <Link
              href="/dashboard/reservations"
              className="col-span-2 flex items-center justify-center gap-2 rounded-[calc(var(--po-radius)*0.8)] bg-blue-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-300"
            >
              <Icon name="plus" className="h-4 w-4" />
              Upravljaj terminima
            </Link>
            {quickActions.slice(1).map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-2.5 rounded-[calc(var(--po-radius)*0.8)] border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm font-medium text-slate-200 transition hover:border-blue-500/40 hover:bg-white/[0.07]"
              >
                <Icon name={action.icon} className="h-4 w-4 text-blue-400" />
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

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
            <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-white/5" />)}</div>
          ) : data.upcoming.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed border-white/10 px-4 text-center">
              <p className="text-sm font-medium text-slate-300">Nema nadolazećih termina</p>
              <p className="mt-1 text-xs text-slate-500">Novi termini pojavit će se ovdje čim ih klijenti zakažu.</p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {data.upcoming.slice(0, 5).map((res) => {
                const d = new Date(res.reservation_date as string);
                return (
                  <li key={res.id} className="flex items-center gap-3 rounded-[calc(var(--po-radius)*0.7)] bg-white/[0.03] p-2.5">
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
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {/* GRUPISANA STATISTIKA */}
      <div className="grid gap-5 lg:grid-cols-3">
        <section className={panel} aria-label="Prihod">
          <PanelTitle icon="wallet" title="Prihod" />
          <div className="space-y-5">
            <Stat label="Ukupan prihod" value={money(data.revenueTotal)} loading={loading} tone="text-emerald-400" />
            <div className="grid grid-cols-2 gap-4 border-t border-white/[0.06] pt-4">
              <Stat label="Danas" value={money(data.revenueToday)} loading={loading} tone="text-emerald-300" />
              <Stat label="Ovaj mjesec" value={money(data.revenueMonth)} loading={loading} tone="text-emerald-300" />
            </div>
          </div>
        </section>

        <section className={panel} aria-label="Rezervacije">
          <PanelTitle icon="calendar" title="Rezervacije" />
          <div className="grid grid-cols-2 gap-x-4 gap-y-5">
            <Stat label="Ovaj mjesec" value={data.month} loading={loading} />
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
