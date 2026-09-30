'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
);

type Customer = {
  key: string;
  name: string;
  email: string;
  phone: string;
  reservationCount: number;
  lastReservation: string;
  totalSpent: number;
};

function parsePrice(value: unknown) {
  let normalized = String(value ?? '').replace(/[^\d,.-]/g, '');
  if (normalized.includes(',')) normalized = normalized.replace(/\./g, '').replace(',', '.');
  const result = Number.parseFloat(normalized);
  return Number.isFinite(result) ? result : 0;
}

function isCompleted(value: unknown) {
  return ['zavrseno', 'completed', 'finished'].includes(
    String(value || '').toLocaleLowerCase('bs').normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
  );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadCustomers() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Prijavite se ponovo za pregled klijenata.');
        const response = await fetch('/api/dashboard', { headers: { Authorization: `Bearer ${session.access_token}` } });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Klijente nije moguće učitati.');

        const grouped = new Map<string, Customer>();
        for (const reservation of result.reservations || []) {
          const email = String(reservation.customer_email || '').trim();
          const phone = String(reservation.customer_phone || '').trim();
          const name = String(reservation.customer_name || 'Klijent').trim();
          const key = reservation.user_id || email.toLocaleLowerCase('bs') || phone || name.toLocaleLowerCase('bs');
          const current = grouped.get(key) || { key, name, email, phone, reservationCount: 0, lastReservation: '', totalSpent: 0 };
          current.reservationCount += 1;
          const bookedAt = String(reservation.reservation_date || reservation.created_at || '');
          if (bookedAt > current.lastReservation) current.lastReservation = bookedAt;
          if (isCompleted(reservation.status)) current.totalSpent += parsePrice(reservation.price);
          if (!current.email && email) current.email = email;
          if (!current.phone && phone) current.phone = phone;
          if (current.name === 'Klijent' && name !== 'Klijent') current.name = name;
          grouped.set(key, current);
        }
        setCustomers([...grouped.values()].sort((a, b) => b.lastReservation.localeCompare(a.lastReservation)));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Klijente nije moguće učitati.');
      } finally {
        setLoading(false);
      }
    }
    loadCustomers();
  }, []);

  const visibleCustomers = customers.filter((customer) =>
    `${customer.name} ${customer.email} ${customer.phone}`.toLocaleLowerCase('bs').includes(search.toLocaleLowerCase('bs')),
  );

  return (
    <section className="space-y-6 pb-12 text-gray-100">
      <header className="flex flex-col gap-4 border-b border-gray-800 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-black text-white sm:text-3xl">Klijenti</h2>
          <p className="mt-1 text-sm text-slate-400">Klijenti koji su rezervisali termin za vaš biznis.</p>
        </div>
        <label className="text-xs font-semibold text-slate-400">
          Pretraga
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Ime, email ili telefon" className="mt-2 min-h-11 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500 sm:w-72" />
        </label>
      </header>

      {error && <p role="alert" className="rounded-lg border border-red-800 bg-red-950/50 p-4 text-sm text-red-200">{error}</p>}
      <div className="hidden overflow-x-auto rounded-xl border border-gray-800 bg-gray-900/60 lg:block">
        <table className="w-full text-left">
          <thead className="border-b border-gray-800 bg-gray-950/50 text-[11px] uppercase tracking-wide text-slate-400">
            <tr><th className="px-5 py-3">Klijent</th><th className="px-5 py-3">Telefon</th><th className="px-5 py-3">Rezervacije</th><th className="px-5 py-3">Posljednja rezervacija</th><th className="px-5 py-3">Potrošeno</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-800/70 text-sm">
            {loading ? <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-500">Učitavanje klijenata...</td></tr>
              : visibleCustomers.length === 0 ? <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-500">{search ? 'Nema rezultata pretrage.' : 'Još nema evidentiranih klijenata.'}</td></tr>
                : visibleCustomers.map((customer) => <tr key={customer.key} className="hover:bg-gray-800/30">
                  <td className="px-5 py-4"><span className="font-semibold text-white">{customer.name}</span><span className="mt-1 block text-xs text-slate-400">{customer.email || 'Email nije naveden'}</span></td>
                  <td className="px-5 py-4 text-slate-300">{customer.phone || '-'}</td>
                  <td className="px-5 py-4 text-slate-300">{customer.reservationCount}</td>
                  <td className="px-5 py-4 text-slate-300">{customer.lastReservation ? new Date(customer.lastReservation).toLocaleString('bs-BA') : '-'}</td>
                  <td className="px-5 py-4 font-semibold text-emerald-400">{customer.totalSpent.toLocaleString('bs-BA', { maximumFractionDigits: 2 })} KM</td>
                </tr>)}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 lg:hidden">
        {loading ? <p className="py-10 text-center text-sm text-slate-500">Učitavanje klijenata...</p>
          : visibleCustomers.length === 0 ? <p className="rounded-xl border border-gray-800 bg-gray-900/60 px-4 py-10 text-center text-sm text-slate-500">{search ? 'Nema rezultata pretrage.' : 'Još nema evidentiranih klijenata.'}</p>
            : visibleCustomers.map((customer) => (
              <article key={customer.key} className="space-y-3 rounded-xl border border-gray-800 bg-gray-900/70 p-4">
                <div className="min-w-0">
                  <h3 className="break-words font-semibold text-white">{customer.name}</h3>
                  <p className="mt-1 break-all text-xs text-slate-400">{customer.email || 'Email nije naveden'}</p>
                  <p className="mt-1 break-words text-sm text-blue-300">{customer.phone || 'Telefon nije naveden'}</p>
                </div>
                <dl className="grid grid-cols-2 gap-3 border-t border-gray-800 pt-3 text-xs">
                  <div><dt className="text-slate-500">Rezervacije</dt><dd className="mt-1 text-slate-200">{customer.reservationCount}</dd></div>
                  <div><dt className="text-slate-500">Potrošeno</dt><dd className="mt-1 font-semibold text-emerald-400">{customer.totalSpent.toLocaleString('bs-BA', { maximumFractionDigits: 2 })} KM</dd></div>
                  <div className="col-span-2"><dt className="text-slate-500">Posljednja rezervacija</dt><dd className="mt-1 text-slate-200">{customer.lastReservation ? new Date(customer.lastReservation).toLocaleString('bs-BA') : '-'}</dd></div>
                </dl>
              </article>
            ))}
      </div>
    </section>
  );
}