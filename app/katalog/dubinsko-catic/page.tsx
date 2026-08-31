'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import Background from '../../../components/Background';

interface ServicePackage {
  id: string;
  name: string;
  price: string;
  badge?: string;
  desc: string;
  features: string[];
}

interface Reservation {
  id?: number | string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  service_name: string;
  price: number;
  reservation_date: string;
  status: string;
}

const monthNames = [
  "Januar", "Februar", "Mart", "April", "Maj", "Juni",
  "Juli", "August", "Septembar", "Oktobar", "Novembar", "Decembar"
];
const dayNamesShort = ["Pon", "Uto", "Sri", "Čet", "Pet", "Sub", "Ned"];

const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 8; hour <= 16; hour++) {
    const hStr = hour < 10 ? `0${hour}` : `${hour}`;
    slots.push(`${hStr}:00`);
    slots.push(`${hStr}:30`);
  }
  return slots;
};

const timeSlots = generateTimeSlots();

const formatToBalkanDate = (dateStr: string) => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}.${month}.${year}.`;
};

export default function DubinskoCaticPage() {
  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null);
  const [resDate, setResDate] = useState('');
  const [resTime, setResTime] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const [successModalData, setSuccessModalData] = useState<Reservation | null>(null);

  const todayObj = new Date();
  todayObj.setHours(0, 0, 0, 0);

  const [calYear, setCalYear] = useState(todayObj.getFullYear());
  const [calMonth, setCalMonth] = useState(todayObj.getMonth());

  const [myReservations, setMyReservations] = useState<Reservation[]>([]);
  const [allTakenSlots, setAllTakenSlots] = useState<string[]>([]);
  const [showMyTerminiModal, setShowMyTerminiModal] = useState(false);
  
  const [reservationToCancel, setReservationToCancel] = useState<Reservation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const packages: ServicePackage[] = [
    { 
      id: 'basic', 
      name: 'Basic Paket', 
      price: '25 KM',
      badge: 'Brzo & Efikasno',
      desc: 'Idealan za parcijalno čišćenje i osvježenje enterijera.',
      features: ['Dubinsko pranje 2 prednja sjedišta', 'Osvježavanje mirisa', 'Osnovno usisavanje'] 
    },
    { 
      id: 'premium', 
      name: 'Premium Paket', 
      price: '130 KM',
      badge: 'Najpopularnije 🔥',
      desc: 'Kompletno detaljno dubinsko pranje cijelog vozila.',
      features: ['Vađenje i pranje svih sjedišta', 'Tepisi i krovni tapacirung', 'Zaštita i sjaj svih plastika', 'Kompletno vanjsko pranje'] 
    }
  ];

  useEffect(() => {
    const saved = localStorage.getItem('aijaran_catic_reservations');
    if (saved) {
      try {
        setMyReservations(JSON.parse(saved));
      } catch (e) {
        console.error('Greška pri čitanju rezervacija:', e);
      }
    }
    fetchTakenSlots();
  }, []);

  const fetchTakenSlots = async () => {
    try {
      const res = await fetch('/api/narudzbe');
      const json = await res.json();
      if (res.ok && json.data) {
        const taken = json.data
          .filter((item: any) => item.status !== 'Otkazano')
          .map((item: any) => item.reservation_date);
        setAllTakenSlots(taken);
      }
    } catch (err) {
      console.error('Greška pri dohvatanju zauzetih termina:', err);
    }
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackage || !resDate || !resTime || !clientName || !clientPhone || !clientEmail) {
      alert('Molimo vas da popunite sva polja, izaberete paket, datum i vrijeme.');
      return;
    }

    setLoading(true);

    const formattedDateTime = `${resDate}T${resTime}:00`;
    const priceNum = Number(selectedPackage.price.replace(/[^0-9]/g, '')) || 0;

    try {
      const response = await fetch('/api/narudzbe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: clientName,
          customer_phone: clientPhone,
          customer_email: clientEmail,
          service_name: selectedPackage.name,
          price: priceNum,
          reservation_date: formattedDateTime,
          status: 'Na čekanju',
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Došlo je do greške na serveru.');

      const newReservation: Reservation = {
        id: result.data && result.data[0] ? result.data[0].id : Date.now(),
        customer_name: clientName,
        customer_phone: clientPhone,
        customer_email: clientEmail,
        service_name: selectedPackage.name,
        price: priceNum,
        reservation_date: formattedDateTime,
        status: 'Na čekanju',
      };

      const updated = [newReservation, ...myReservations];
      setMyReservations(updated);
      localStorage.setItem('aijaran_catic_reservations', JSON.stringify(updated));

      setAllTakenSlots((prev) => [...prev, formattedDateTime]);
      setSuccessModalData(newReservation);

      setSelectedPackage(null);
      setResDate('');
      setResTime('');
      setClientName('');
      setClientPhone('');
      setClientEmail('');
    } catch (err: any) {
      alert('Greška prilikom rezervacije: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmCancelReservation = async () => {
    if (!reservationToCancel) return;

    setIsDeleting(true);
    const id = reservationToCancel.id;
    const targetDateStr = reservationToCancel.reservation_date;

    try {
      if (typeof id === 'number' || typeof id === 'string') {
        await fetch(`/api/narudzbe?id=${id}`, {
          method: 'DELETE',
        });
      }

      const updated = myReservations.filter((r) => r.id !== id);
      setMyReservations(updated);
      localStorage.setItem('aijaran_catic_reservations', JSON.stringify(updated));

      setAllTakenSlots((prev) => prev.filter((d) => d !== targetDateStr));
      setReservationToCancel(null);
    } catch (err: any) {
      alert('Greška pri otkazivanju: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-[#030712] text-white overflow-x-hidden font-sans">
      <Background />
      <Navbar brandName="AI Jaran" onOpenContact={() => {}} onResetHero={() => {}} onOpenCatalog={() => {}} />

      <div className="pt-32 pb-24 px-4 max-w-6xl mx-auto space-y-10">
        
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link 
            href="/katalog/dubinsko-ciscenje" 
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-blue-400 bg-[#0b0f19] px-4 py-2.5 rounded-xl border border-white/10 transition-all hover:border-blue-500/40"
          >
            ← Nazad na partnere
          </Link>

          <div className="flex items-center gap-3">
            {myReservations.length > 0 && (
              <button
                onClick={() => setShowMyTerminiModal(true)}
                className="text-xs font-bold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 px-4 py-2.5 rounded-xl border border-blue-500/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                📅 Moji zakazani termini ({myReservations.length})
              </button>
            )}

            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-full border border-emerald-500/20 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Slobodni termini dostupni
            </span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#0e172a] to-[#0b0f19] border border-white/10 p-6 md:p-10 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
                🌟 Certificirani AI Jaran Partner
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                Dubinsko Ćatić
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-gray-300 pt-1">
                <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                  📍 Vrapčići, Mostar
                </span>
                <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                  📞 060 30 50 153
                </span>
                <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 text-blue-400">
                  🕒 Pon – Sub: 07:00 – 17:00
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-lg shadow-blue-600/30">1</span>
            <h2 className="text-xl font-bold text-white">Izaberite paket usluge</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {packages.map((pkg) => {
              const isSelected = selectedPackage?.id === pkg.id;
              return (
                <div 
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg)}
                  className={`relative p-6 rounded-3xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                    isSelected 
                      ? 'bg-gradient-to-b from-blue-900/20 to-[#0b0f19] border-blue-500 shadow-xl shadow-blue-500/10 scale-[1.01]' 
                      : 'bg-[#0b0f19] border-white/10 hover:border-white/25 hover:bg-[#0e1424]'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20">
                          {pkg.badge}
                        </span>
                        <h3 className="text-2xl font-extrabold text-white mt-2">{pkg.name}</h3>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-black text-blue-400 block">{pkg.price}</span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-400 mb-6 leading-relaxed">{pkg.desc}</p>

                    <div className="space-y-2 border-t border-white/5 pt-4">
                      {pkg.features.map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-gray-300">
                          <span className="text-blue-400 font-bold">✓</span> {feat}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-400">
                      {isSelected ? 'Odabrano' : 'Klikni za odabir'}
                    </span>
                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                      isSelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-white/20'
                    }`}>
                      {isSelected && <span className="text-xs font-bold">✓</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleBooking} className="space-y-10">
          
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-lg shadow-blue-600/30">2</span>
              <h2 className="text-xl font-bold text-white">Odaberite datum i vrijeme dolaska</h2>
            </div>

            <div className="bg-[#0b0f19] border border-white/10 p-6 rounded-3xl space-y-6">
              
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-400 font-medium block">Odabrani datum:</span>
                  <span className="text-sm font-bold text-blue-400">
                    {resDate ? formatToBalkanDate(resDate) : "Nije izabran datum"}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-[#030712] p-1.5 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => setCalMonth((prev) => (prev === 0 ? 11 : prev - 1))}
                    className="px-2.5 py-1 text-xs bg-[#0b0f19] hover:bg-blue-600 rounded-lg text-white font-bold transition-all"
                  >
                    ◀
                  </button>
                  <span className="text-xs font-bold px-2 text-white">
                    {monthNames[calMonth]} {calYear}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCalMonth((prev) => (prev === 11 ? 0 : prev + 1))}
                    className="px-2.5 py-1 text-xs bg-[#0b0f19] hover:bg-blue-600 rounded-lg text-white font-bold transition-all"
                  >
                    ▶
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-7 gap-1 text-center">
                  {dayNamesShort.map((d) => (
                    <span key={d} className="text-[11px] font-bold text-gray-500 uppercase">{d}</span>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1.5">
                  {Array.from({ length: new Date(calYear, calMonth, 1).getDay() === 0 ? 6 : new Date(calYear, calMonth, 1).getDay() - 1 }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}

                  {Array.from({ length: new Date(calYear, calMonth + 1, 0).getDate() }).map((_, index) => {
                    const dayNum = index + 1;
                    const currentDateObj = new Date(calYear, calMonth, dayNum);
                    currentDateObj.setHours(0, 0, 0, 0);

                    const isPast = currentDateObj < todayObj;
                    const isSunday = currentDateObj.getDay() === 0;
                    
                    const mStr = (calMonth + 1) < 10 ? `0${calMonth + 1}` : `${calMonth + 1}`;
                    const dStr = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
                    const fullDateStr = `${calYear}-${mStr}-${dStr}`;

                    const daySlotsCount = timeSlots.length;
                    const takenSlotsCountForDay = timeSlots.filter(t => allTakenSlots.includes(`${fullDateStr}T${t}:00`)).length;
                    const isFullyBooked = daySlotsCount > 0 && takenSlotsCountForDay >= daySlotsCount;

                    const isDisabled = isPast || isSunday || isFullyBooked;
                    const isSelected = resDate === fullDateStr;

                    return (
                      <button
                        key={fullDateStr}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => {
                          if (!isDisabled) {
                            setResDate(fullDateStr);
                            setResTime("");
                          }
                        }}
                        className={`py-2.5 rounded-xl text-xs font-bold transition-all border relative ${
                          isDisabled
                            ? "opacity-30 cursor-not-allowed bg-gray-900 border-transparent text-gray-600"
                            : isSelected
                            ? "bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-600/30 scale-105"
                            : "bg-[#030712] border-white/10 text-gray-300 hover:border-blue-500/50 hover:bg-[#080d1a]"
                        }`}
                      >
                        {dayNum}
                        {isFullyBooked && !isPast && !isSunday && (
                          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-red-500 rounded-full"></span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {resDate ? (
                <div className="pt-4 border-t border-white/10">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                    Slobodni termini za <span className="text-blue-400">{formatToBalkanDate(resDate)}</span>:
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {timeSlots.map((time) => {
                      const fullSlotString = `${resDate}T${time}:00`;
                      const isTaken = allTakenSlots.includes(fullSlotString);

                      return (
                        <button
                          key={time}
                          type="button"
                          disabled={isTaken}
                          onClick={() => !isTaken && setResTime(time)}
                          className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                            isTaken
                              ? "bg-gray-900/50 border-white/5 text-gray-600 line-through opacity-40 cursor-not-allowed"
                              : resTime === time
                              ? "bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/30 scale-105"
                              : "bg-[#030712] text-gray-300 border-white/10 hover:border-blue-500/40"
                          }`}
                        >
                          {time} {isTaken && '(Zauzeto)'}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-[#030712] rounded-xl border border-white/5 text-center text-xs text-gray-500 italic">
                  👆 Izaberite dan na kalendaru iznad da vam se prikažu slobodni termini.
                </div>
              )}

            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-lg shadow-blue-600/30">3</span>
              <h2 className="text-xl font-bold text-white">Vaši kontakt podaci</h2>
            </div>

            <div className="bg-[#0b0f19] border border-white/10 p-6 rounded-3xl space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Ime i prezime *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Unesite vaše ime i prezime" 
                    value={clientName} 
                    onChange={e => setClientName(e.target.value)} 
                    className="w-full bg-[#030712] border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Broj telefona *</label>
                  <input 
                    type="tel" 
                    required
                    placeholder="061 123 456" 
                    value={clientPhone} 
                    onChange={e => setClientPhone(e.target.value)} 
                    className="w-full bg-[#030712] border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-all" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">E-mail adresa *</label>
                <input 
                  type="email" 
                  required
                  placeholder="vasa.adresa@email.com" 
                  value={clientEmail} 
                  onChange={e => setClientEmail(e.target.value)} 
                  className="w-full bg-[#030712] border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-all" 
                />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-900/30 via-[#0b0f19] to-blue-900/30 border border-blue-500/30 p-6 md:p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
            <div>
              <span className="text-xs font-bold text-blue-400 uppercase tracking-widest block mb-1">
                Pregled rezervacije
              </span>
              <p className="text-base font-extrabold text-white">
                {selectedPackage 
                  ? `${selectedPackage.name} — ${selectedPackage.price}` 
                  : '⚠️ Niste još izabrali paket'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {resDate && resTime ? `📅 Termin: ${formatToBalkanDate(resDate)} u ${resTime}h` : 'Odaberite datum i satnicu iznad.'}
              </p>
            </div>

            <button 
              type="submit" 
              disabled={loading || !selectedPackage || !resDate || !resTime}
              className="w-full md:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white font-extrabold text-sm rounded-2xl transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap uppercase tracking-wider"
            >
              {loading ? 'Spremanje...' : 'Potvrdi i rezerviši termin 🚀'}
            </button>
          </div>

        </form>

      </div>

      {successModalData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b0f19] border border-emerald-500/40 rounded-3xl max-w-md w-full p-6 text-center space-y-5 shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto text-2xl animate-bounce">
              🎉
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-white">Uspješno ste rezervisali termin!</h3>
              <p className="text-xs text-gray-300">
                Vaš zahtjev je poslat. Očekujte brzu potvrdu od tima <span className="text-blue-400 font-bold">Dubinsko Ćatić</span>.
              </p>
            </div>

            <div className="bg-[#030712] p-4 rounded-2xl border border-white/10 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Usluga:</span>
                <span className="font-bold text-white">{successModalData.service_name} ({successModalData.price} KM)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Termin:</span>
                <span className="font-bold text-blue-400">
                  {formatToBalkanDate(successModalData.reservation_date.split('T')[0])} u {successModalData.reservation_date.split('T')[1]?.slice(0, 5)}h
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className="font-bold text-amber-400">{successModalData.status}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSuccessModalData(null)}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all uppercase tracking-wider"
            >
              Razumijem, hvala! 👍
            </button>
          </div>
        </div>
      )}

      {showMyTerminiModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b0f19] border border-white/10 rounded-3xl max-w-md w-full p-6 relative shadow-2xl space-y-4">
            <button
              onClick={() => setShowMyTerminiModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white font-bold text-lg"
            >
              ✕
            </button>

            <h3 className="text-xl font-black text-white">Moji zakazani termini</h3>
            <p className="text-xs text-gray-400">Ovdje možete pregledati i otkazati svoje nadolazeće termine.</p>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {myReservations.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-500">Nemate aktivnih rezervacija.</div>
              ) : (
                myReservations.map((res) => {
                  const dateObj = new Date(res.reservation_date);
                  const rawDateStr = !isNaN(dateObj.getTime()) ? dateObj.toISOString().split('T')[0] : res.reservation_date;
                  const dateStr = formatToBalkanDate(rawDateStr);
                  const timeStr = !isNaN(dateObj.getTime()) ? dateObj.toTimeString().slice(0, 5) : '';

                  return (
                    <div key={res.id} className="bg-[#030712] p-4 rounded-2xl border border-white/10 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-xs font-bold text-white block">{res.service_name}</span>
                          <span className="text-[10px] text-blue-400 font-bold">{res.price} KM</span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md">
                          {res.status}
                        </span>
                      </div>

                      <div className="text-xs text-gray-300">
                        📅 {dateStr} {timeStr ? `u 🕒 ${timeStr}h` : ''}
                      </div>

                      <div className="pt-2 border-t border-white/5 flex justify-end">
                        <button
                          onClick={() => setReservationToCancel(res)}
                          className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-[11px] font-bold rounded-lg transition-all"
                        >
                          ❌ Otkaži termin
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {reservationToCancel && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b0f19] border border-white/10 rounded-3xl max-w-sm w-full p-6 text-center space-y-5 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center mx-auto text-xl">
              ⚠️
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Otkaži termin?</h3>
              <p className="text-xs text-gray-400">
                Jeste li sigurni da želite otkazati termin za <span className="text-white font-semibold">{reservationToCancel.service_name}</span>?
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setReservationToCancel(null)}
                className="flex-1 py-3 bg-[#030712] hover:bg-white/5 text-gray-300 text-xs font-bold rounded-xl border border-white/10 transition-all"
              >
                Odustani
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmCancelReservation}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-600/30 transition-all disabled:opacity-50"
              >
                {isDeleting ? 'Brisanje...' : 'Da, otkaži'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer t={{ rights: "Sva prava zadržana.", privacy: "Politika privatnosti" }} brandName="AI Jaran" onOpenPrivacy={() => {}} />
    </main>
  );
}