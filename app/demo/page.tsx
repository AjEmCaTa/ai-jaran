'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Icon from '../../components/Icon';

// Demo stranica izmišljene firme: radi kao prava stranica za zakazivanje, ali ništa ne šalje i ne sprema.

const SERVICES = [
  { id: 'sisanje', tag: 'Najtraženije', name: 'Šišanje + feniranje', price: 30, minutes: 45, desc: 'Pranje, šišanje po mjeri i feniranje.' },
  { id: 'bojanje', tag: 'Premium', name: 'Bojanje kose', price: 60, minutes: 90, desc: 'Bojanje cijele dužine uz njegu.' },
  { id: 'musko', tag: 'Brzo', name: 'Muško šišanje', price: 15, minutes: 30, desc: 'Klasično ili moderno, uz pranje.' },
];
const TIMES = ['09:00', '09:45', '10:30', '11:15', '12:00', '13:00', '13:45', '14:30', '15:15', '16:00', '16:45', '17:30', '18:15'];
const DAY_NAMES = ['Ned', 'Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub'];

const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const pretty = (k: string) => {
  const [y, m, d] = k.split('-');
  return `${d}.${m}.${y}.`;
};
// Isti "zauzeti" termini za isti dan, da demo djeluje stvarno.
const isTaken = (day: string, time: string) => {
  let h = 0;
  for (const c of day + time) h = (h * 31 + c.charCodeAt(0)) % 997;
  return h % 4 === 0;
};

const card = 'rounded-3xl border border-white/10 bg-[#0b0f19] p-5 sm:p-7';
const input = 'mt-2 w-full rounded-xl border border-white/10 bg-[#030712] px-4 py-3 text-base text-white outline-none transition placeholder:text-gray-600 focus:border-blue-500 sm:text-sm';

export default function DemoPage() {
  const [service, setService] = useState<string>('');
  const [day, setDay] = useState('');
  const [time, setTime] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [done, setDone] = useState(false);
  const [inquirySent, setInquirySent] = useState(false);

  const days = useMemo(() => {
    const out: { key: string; label: string; num: number; closed: boolean }[] = [];
    const now = new Date();
    for (let i = 0; i < 14; i += 1) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      out.push({ key: key(d), label: DAY_NAMES[d.getDay()], num: d.getDate(), closed: d.getDay() === 0 });
    }
    return out;
  }, []);

  const selected = SERVICES.find((s) => s.id === service);
  const canBook = Boolean(selected && day && time && name.trim() && phone.trim());

  const reset = () => {
    setDone(false);
    setService('');
    setDay('');
    setTime('');
    setName('');
    setPhone('');
  };

  return (
    <main className="min-h-screen bg-[#030712] text-white">
      <Navbar onOpenContact={() => (window.location.href = '/cjenovnik')} onResetHero={() => (window.location.href = '/')} onOpenCatalog={() => (window.location.href = '/katalog')} />

      <div className="mx-auto max-w-3xl px-4 pb-20 pt-24 sm:pt-28">
        {/* DEMO TRAKA */}
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-blue-500/25 bg-blue-500/[0.07] p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-blue-100">
            <span className="font-semibold">Ovo je demo.</span> Isprobajte kako klijenti zakazuju kod vas. Ništa se ne šalje i ne sprema.
          </p>
          <Link href="/registracija" className="inline-flex shrink-0 items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500">
            Želim ovakvu stranicu
          </Link>
        </div>

        {/* FIRMA */}
        <section className={card}>
          <p className="inline-flex rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-300">
            Frizerski salon
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">Studio Lana</h1>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-300">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/5 bg-white/5 px-3 py-1.5"><Icon name="mapPin" className="h-3.5 w-3.5 text-blue-400" />Ferhadija 12, Sarajevo</span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/5 bg-white/5 px-3 py-1.5"><Icon name="phone" className="h-3.5 w-3.5 text-blue-400" />+387 61 234 567</span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/5 bg-white/5 px-3 py-1.5 text-blue-300"><Icon name="clock" className="h-3.5 w-3.5" />Pon – Sub: 09:00 – 19:00</span>
          </div>
        </section>

        {/* 1. USLUGA */}
        <h2 className="mb-4 mt-10 flex items-center gap-3 text-xl font-bold"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm">1</span>Izaberite uslugu</h2>
        <div className="grid gap-3">
          {SERVICES.map((s) => {
            const active = s.id === service;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => { setService(s.id); setTime(''); }}
                className={`flex items-start justify-between gap-4 rounded-3xl border p-5 text-left transition ${active ? 'border-blue-500 bg-gradient-to-b from-blue-900/20 to-[#0b0f19]' : 'border-white/10 bg-[#0b0f19] hover:border-blue-500/40'}`}
              >
                <div className="min-w-0">
                  <span className="rounded-md border border-blue-500/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-300">{s.tag}</span>
                  <p className="mt-2 font-display text-lg font-bold">{s.name}</p>
                  <p className="mt-1 text-xs text-gray-400">{s.desc}</p>
                  <p className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-gray-400"><Icon name="clock" className="h-3.5 w-3.5" />{s.minutes} min</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-3">
                  <p className="font-display text-2xl font-bold text-blue-400">{s.price} KM</p>
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full border ${active ? 'border-blue-500 bg-blue-500' : 'border-white/20'}`}>
                    {active && <Icon name="check" className="h-4 w-4" />}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* 2. TERMIN */}
        <h2 className="mb-4 mt-10 flex items-center gap-3 text-xl font-bold"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm">2</span>Izaberite termin</h2>
        <section className={card}>
          {!selected ? (
            <p className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-center text-xs font-semibold text-amber-300">Prvo izaberite uslugu, da znamo koliko traje termin.</p>
          ) : (
            <>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {days.map((d) => (
                  <button
                    key={d.key}
                    type="button"
                    disabled={d.closed}
                    onClick={() => { setDay(d.key); setTime(''); }}
                    className={`flex w-14 shrink-0 flex-col items-center rounded-xl border py-2 transition ${day === d.key ? 'border-blue-400 bg-blue-600 text-white' : 'border-white/10 bg-[#030712] text-gray-300 hover:border-blue-500/40'} disabled:cursor-not-allowed disabled:opacity-30`}
                  >
                    <span className="text-[10px] font-semibold uppercase">{d.label}</span>
                    <span className="font-display text-lg font-bold">{d.num}</span>
                  </button>
                ))}
              </div>
              {day ? (
                <div className="mt-4 border-t border-white/10 pt-4">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">Slobodni termini za <span className="text-blue-400">{pretty(day)}</span></p>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {TIMES.map((t) => {
                      const taken = isTaken(day, t);
                      return (
                        <button
                          key={t}
                          type="button"
                          disabled={taken}
                          onClick={() => setTime(t)}
                          className={`rounded-xl border py-2 text-xs font-bold transition ${time === t ? 'border-blue-400 bg-blue-600 text-white' : taken ? 'cursor-not-allowed border-white/5 bg-gray-900/50 text-gray-600 line-through opacity-40' : 'border-white/10 bg-[#030712] text-gray-300 hover:border-blue-500/40'}`}
                        >
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-center text-xs italic text-gray-500">Izaberite dan da vidite slobodne termine.</p>
              )}
            </>
          )}
        </section>

        {/* 3. PODACI */}
        <h2 className="mb-4 mt-10 flex items-center gap-3 text-xl font-bold"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm">3</span>Vaši podaci</h2>
        <section className={`${card} space-y-4`}>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">
            Ime i prezime
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="npr. Ana Kovač" className={input} />
          </label>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">
            Broj telefona
            <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="061 123 456" className={input} />
          </label>
          <div className="rounded-xl border border-white/5 bg-[#030712] p-4">
            <p className="font-semibold">{selected ? `${selected.name} — ${selected.price} KM (${selected.minutes} min)` : 'Niste još izabrali uslugu'}</p>
            <p className="mt-1 text-xs text-gray-400">{day && time ? `Termin: ${pretty(day)} u ${time}h` : 'Odaberite datum i vrijeme iznad.'}</p>
          </div>
          <button
            type="button"
            disabled={!canBook}
            onClick={() => setDone(true)}
            className="w-full rounded-xl bg-blue-600 py-4 text-sm font-extrabold uppercase tracking-wider text-white transition hover:bg-blue-500 disabled:opacity-40"
          >
            Potvrdi i rezerviši termin
          </button>
        </section>

        {/* UPIT */}
        <section className={`${card} mt-10`}>
          <h2 className="text-xl font-bold">Imate pitanje?</h2>
          <p className="mt-1 text-sm text-gray-400">Klijenti mogu poslati i upit, bez rezervacije termina.</p>
          {inquirySent ? (
            <p className="mt-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm text-emerald-200">Upit je poslan. U pravoj stranici bi ga firma odmah vidjela u svom panelu.</p>
          ) : (
            <div className="mt-4 space-y-3">
              <input placeholder="Ime i prezime" className={input} />
              <textarea rows={3} placeholder="Kako vam možemo pomoći?" className={input} />
              <button type="button" onClick={() => setInquirySent(true)} className="min-h-11 w-full rounded-xl bg-blue-600 text-sm font-bold text-white transition hover:bg-blue-500">
                Pošalji upit
              </button>
            </div>
          )}
        </section>

        {/* CTA */}
        <section className="mt-10 rounded-3xl border border-blue-500/25 bg-gradient-to-b from-blue-900/25 to-[#0b0f19] p-6 text-center sm:p-10">
          <h2 className="text-3xl font-bold tracking-tight">Ovakva stranica za vašu firmu</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-300">30 dana besplatno. Pošaljite nam usluge i cijene, a mi postavimo sve za vas.</p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <Link href="/registracija" className="rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-blue-500">Probaj 30 dana besplatno</Link>
            <Link href="/" className="rounded-xl border border-white/10 px-6 py-3.5 text-sm font-semibold text-slate-200 transition hover:bg-white/5">Saznaj više</Link>
          </div>
        </section>
      </div>

      {/* POTVRDA */}
      {done && selected && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#030712]/90 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-3xl border border-emerald-500/30 bg-[#0b0f19] p-6 text-center shadow-2xl">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
              <Icon name="check" className="h-7 w-7" />
            </span>
            <h3 className="mt-4 font-display text-2xl font-bold">Termin je zakazan</h3>
            <p className="mt-2 text-sm text-slate-300">U pravoj stranici firma bi odmah dobila obavijest, a klijent potvrdu na email.</p>
            <div className="mt-4 space-y-2 rounded-2xl border border-white/5 bg-[#060a14] p-4 text-left text-sm">
              <div className="flex justify-between gap-3 text-slate-400">Usluga<b className="text-white">{selected.name}</b></div>
              <div className="flex justify-between gap-3 text-slate-400">Termin<b className="text-blue-400">{pretty(day)} u {time}</b></div>
            </div>
            <button type="button" onClick={reset} className="mt-5 w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white transition hover:bg-blue-500">
              Probaj ponovo
            </button>
            <Link href="/registracija" className="mt-2 block text-sm font-semibold text-blue-300 hover:text-blue-200">
              Želim ovakvu stranicu za svoju firmu
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
