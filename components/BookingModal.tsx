'use client';

import { useState, useEffect } from 'react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerSlug: string;
  partnerName: string;
  services: string[];
}

const AVAILABLE_TIMES = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
const MONTH_NAMES = ["Januar", "Februar", "Mart", "April", "Maj", "Juni", "Juli", "August", "Septembar", "Oktobar", "Novembar", "Decembar"];
const DAYS_SHORT = ["Pon", "Uto", "Sri", "Čet", "Pet", "Sub", "Ned"];

export default function BookingModal({
  isOpen,
  onClose,
  partnerSlug,
  partnerName,
  services,
}: BookingModalProps) {
  const [selectedService, setSelectedService] = useState(services[0] || 'Dubinsko pranje');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');

  const [loading, setLoading] = useState(false);
  const [fetchingSlots, setFetchingSlots] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());

  useEffect(() => {
    if (!selectedDate) return;

    async function fetchBookedSlots() {
      setFetchingSlots(true);
      try {
        const res = await fetch(`/api/booking?date=${selectedDate}&partnerSlug=${partnerSlug}`);
        const data = await res.json();
        if (data.bookedTimes) {
          setBookedTimes(data.bookedTimes);
        }
      } catch (err) {
        console.error('Greška pri dohvatanju slobodnih termina', err);
      } finally {
        setFetchingSlots(false);
      }
    }

    fetchBookedSlots();
  }, [selectedDate, partnerSlug]);

  if (!isOpen) return null;

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfWeek = (year: number, month: number) => {
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const totalDays = getDaysInMonth(calYear, calMonth);
  const startDayIndex = getFirstDayOfWeek(calYear, calMonth);

  const prevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(calYear - 1);
    } else {
      setCalMonth(calMonth - 1);
    }
  };

  const nextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(calYear + 1);
    } else {
      setCalMonth(calMonth + 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!selectedDate || !selectedTime) {
      setStatusMessage({ type: 'error', text: 'Molimo kliknite na datum i izaberite termin.' });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerSlug,
          serviceName: selectedService,
          date: selectedDate,
          time: selectedTime,
          clientName,
          clientPhone,
          clientEmail,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Greška pri zakazivanju.');
      }

      setStatusMessage({ type: 'success', text: 'Termin je uspješno zakazan!' });
      setTimeout(() => {
        onClose();
        setStatusMessage(null);
      }, 2000);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Došlo je do greške.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#0b0f19] border border-white/10 w-full max-w-xl rounded-3xl p-6 md:p-8 shadow-2xl relative text-white max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-white text-xl font-bold p-2"
        >
          ✕
        </button>

        <h2 className="text-2xl font-black mb-1">Zakažite termin</h2>
        <p className="text-xs text-blue-400 font-medium mb-6">{partnerName}</p>

        {statusMessage && (
          <div
            className={`p-4 rounded-xl mb-6 text-xs font-semibold ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
              1. Izaberite uslugu
            </label>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              {services.map((s, idx) => (
                <option key={idx} value={s} className="bg-[#111827]">
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
              2. Izaberite datum na kalendaru
            </label>
            <div className="bg-[#111827] p-4 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-gray-300">
                  Datum: <span className="text-blue-400">{selectedDate || 'Nije izabran'}</span>
                </span>
                <div className="flex items-center gap-1 bg-[#0b0f19] p-1 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={prevMonth}
                    className="px-2.5 py-1 text-xs bg-[#111827] hover:bg-blue-600 rounded-lg text-white font-bold transition-all"
                  >
                    ◀
                  </button>
                  <span className="text-xs font-bold px-3 text-blue-400">
                    {MONTH_NAMES[calMonth]} {calYear}
                  </span>
                  <button
                    type="button"
                    onClick={nextMonth}
                    className="px-2.5 py-1 text-xs bg-[#111827] hover:bg-blue-600 rounded-lg text-white font-bold transition-all"
                  >
                    ▶
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {DAYS_SHORT.map((d) => (
                  <span key={d} className="text-[10px] font-bold text-gray-500 uppercase">{d}</span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: startDayIndex }).map((_, index) => (
                  <div key={`empty-${index}`} />
                ))}

                {Array.from({ length: totalDays }).map((_, index) => {
                  const dayNum = index + 1;
                  const mStr = (calMonth + 1) < 10 ? `0${calMonth + 1}` : `${calMonth + 1}`;
                  const dStr = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
                  const fullDateStr = `${calYear}-${mStr}-${dStr}`;

                  const currentDateObj = new Date(calYear, calMonth, dayNum);
                  const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                  const isPast = currentDateObj < todayNormalized;
                  const isSelected = selectedDate === fullDateStr;

                  return (
                    <button
                      key={fullDateStr}
                      type="button"
                      disabled={isPast}
                      onClick={() => {
                        setSelectedDate(fullDateStr);
                        setSelectedTime('');
                      }}
                      className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                        isPast
                          ? 'bg-[#0b0f19]/40 border-transparent text-gray-700 cursor-not-allowed'
                          : isSelected
                          ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-600/30 scale-105'
                          : 'bg-[#0b0f19] border-white/10 text-gray-300 hover:border-blue-500/50 hover:bg-[#1f293d]'
                      }`}
                    >
                      {dayNum}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {selectedDate && (
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                3. Slobodni termini za {selectedDate}
              </label>
              {fetchingSlots ? (
                <p className="text-xs text-blue-400 animate-pulse">Učitavanje termina...</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1">
                  {AVAILABLE_TIMES.map((time) => {
                    const isBooked = bookedTimes.includes(time);
                    const isSelected = selectedTime === time;

                    return (
                      <button
                        key={time}
                        type="button"
                        disabled={isBooked}
                        onClick={() => setSelectedTime(time)}
                        className={`py-2.5 rounded-xl text-xs font-bold transition-all border ${
                          isBooked
                            ? 'bg-rose-500/10 text-rose-400/40 border-rose-500/20 cursor-not-allowed line-through'
                            : isSelected
                            ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-600/30'
                            : 'bg-[#111827] text-gray-300 border-white/10 hover:border-blue-500/50'
                        }`}
                      >
                        {time} {isBooked && '(Zauzeto)'}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="space-y-3 pt-2">
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1">
              4. Vaši kontakt podaci
            </label>

            <input
              type="text"
              placeholder="Ime i Prezime *"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              required
            />

            <input
              type="tel"
              placeholder="Broj telefona *"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              className="w-[#111827] w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              required
            />

            <input
              type="email"
              placeholder="Email adresa (opcionalno)"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm rounded-2xl transition-all shadow-lg shadow-blue-600/30 disabled:opacity-50"
          >
            {loading ? 'Zakazivanje...' : 'Potvrdi i zakaži termin →'}
          </button>
        </form>
      </div>
    </div>
  );
}