"use client";

import { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Background from "../../components/Background";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Glavne kategorije biznisa
const businessCategories = [
  {
    id: "dubinsko",
    title: "Dubinsko čišćenje i Autopraonice",
    description: "Sve za vozila i namještaj – dubinsko pranje, autopraonice, detailing i keramička zaštita uz automatsko vođenje termina.",
    icon: "🚗",
    count: "Mreža partnera",
    image: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "apartmani",
    title: "Vile i Apartmani",
    description: "Automatsko preuzimanje rezervacija noćenja, komunikacija sa gostima i upiti preko AI asistenta.",
    icon: "🏡",
    count: "Turistički smještaj",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "stanovi",
    title: "Agencije za čišćenje stanova",
    description: "Organizacija i raspored čišćenja stambenih i poslovnih objekata, redovno ili generalno čišćenje.",
    icon: "🧹",
    count: "Usluge čišćenja",
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "beauty",
    title: "Frizeri i Beauty Saloni",
    description: "Zakazivanje termina za šišanje, njegu lica, tretmane i kozmetičke usluge bez gužve na telefonu.",
    icon: "💇‍♂️",
    count: "Beauty sektor",
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80"
  }
];

// Lista partnera po kategorijama
const partnersData: Record<string, any[]> = {
  dubinsko: [
    {
      id: "dubinsko-catic",
      name: "Dubinsko Ćatić",
      city: "Mostar",
      location: "Vrapčići, Mostar",
      description: "Profesionalno dubinsko čišćenje automobila i namještaja. Vrhunska oprema, provjerena hemija i besprijekoran sjaj vašeg vozila.",
      phone: "060 30 50 153",
      workingHours: "Ponedjeljak - Subota: 07:00 - 16:00",
      image: "https://images.unsplash.com/photo-1552930219-7ffb48920732?auto=format&fit=crop&w=600&q=80",
      badge: "Preporučeno",
      packages: [
        { id: "basic", name: "Basic Paket (Automobili)", price: "20 - 25 KM", durationHours: 2, desc: "Osnovno dubinsko čišćenje / pojedinačni detalji sjedala ili gepeka." },
        { id: "premium", name: "Premium Paket (Komplet)", price: "120 - 150 KM", durationHours: 5, desc: "Kompletno dubinsko pranje cijelog automobila (sjedala, tepisi, nebo, gepek) + zaštita." }
      ],
      furnitureNote: "Za čišćenje namještaja (ugaone garniture, fotelje, madraci), termini se dogovaraju direktno pozivom ili porukom na broj: 060 30 50 153."
    }
  ],
  apartmani: [],
  stanovi: [],
  beauty: []
};

const cities = ["Svi gradovi", "Mostar", "Sarajevo", "Banja Luka", "Tuzla", "Zenica"];

// Generisanje slotova svakih pola sata od 07:00 do 16:00
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 7; hour <= 15; hour++) {
    const hStr = hour < 10 ? `0${hour}` : `${hour}`;
    slots.push(`${hStr}:00`);
    slots.push(`${hStr}:30`);
  }
  slots.push("16:00");
  return slots;
};

const allTimeSlots = generateTimeSlots();

// Nazivi mjeseci i dana na našem jeziku
const monthNames = [
  "Januar", "Februar", "Mart", "April", "Maj", "Juni",
  "Juli", "August", "Septembar", "Oktobar", "Novembar", "Decembar"
];
const dayNamesShort = ["Pon", "Uto", "Sri", "Čet", "Pet", "Sub", "Ned"];

export default function KatalogPage() {
  const [selectedCity, setSelectedCity] = useState("Svi gradovi");
  const [activeCategory, setActiveCategory] = useState<any>(null);
  const [selectedPartner, setSelectedPartner] = useState<any>(null);

  // Stanje rezervacija za klijente
  const [myReservations, setMyReservations] = useState<any[]>([]);
  const [showMyTerminiModal, setShowMyTerminiModal] = useState(false);

  // Forma za rezervaciju unutar profila partnera
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [resDate, setResDate] = useState(""); // Format: YYYY-MM-DD
  const [resTime, setResTime] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Stanje za naš custom kalendar (mjesec i godina)
  const todayObj = new Date();
  const [calYear, setCalYear] = useState(todayObj.getFullYear());
  const [calMonth, setCalMonth] = useState(todayObj.getMonth()); // 0-11

  // Stanje za zauzete termine sa API-ja / baze
  const [busySlots, setBusySlots] = useState<string[]>([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);

  const getFilteredPartners = (catId: string) => {
    const partners = partnersData[catId] || [];
    if (selectedCity === "Svi gradovi") return partners;
    return partners.filter(p => p.city.toLowerCase() === selectedCity.toLowerCase());
  };

  // Direktno učitavanje rezervacija iz Supabase tabele 'reservations'
  const fetchMyReservations = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        const formatted = data.map((item: any) => ({
          id: item.id,
          partnerName: "Dubinsko Ćatić",
          packageName: item.service_name,
          price: item.price ? `${item.price} KM` : '',
          durationHours: 2,
          date: item.reservation_date ? item.reservation_date.split('T')[0] : '',
          time: item.reservation_date ? item.reservation_date.split('T')[1]?.substring(0, 5) : "10:00",
          clientName: item.customer_name,
          clientPhone: item.customer_phone,
          clientEmail: ""
        }));
        setMyReservations(formatted);
      }
    } catch (err) {
      console.error("Greška pri učitavanju rezervacija iz baze:", err);
    }
  };

  useEffect(() => {
    fetchMyReservations();
  }, []);

  // Učitavanje zauzetih termina sa API-ja / baze kada se izabere datum
  useEffect(() => {
    if (!resDate || !selectedPartner) {
      setBusySlots([]);
      return;
    }

    const fetchAvailability = async () => {
      setLoadingCalendar(true);
      try {
        const res = await fetch(`/api/calendar/availability?date=${resDate}&partner=${encodeURIComponent(selectedPartner.name)}`);
        if (res.ok) {
          const data = await res.json();
          setBusySlots(data.busySlots || []);
        }
      } catch (err) {
        console.error("Greška pri učitavanju kalendara:", err);
      } finally {
        setLoadingCalendar(false);
      }
    };

    fetchAvailability();
  }, [resDate, selectedPartner]);

  // Računanje zauzetih slotova na osnovu baze i trajanja paketa
  const getOccupiedSlots = () => {
    const occupied = new Set<string>();

    busySlots.forEach(slot => occupied.add(slot));

    myReservations
      .filter(r => r.date === resDate && r.partnerName === selectedPartner?.name)
      .forEach(r => {
        const startIndex = allTimeSlots.indexOf(r.time);
        if (startIndex !== -1) {
          const slotsCount = (r.durationHours || 2) * 2;
          for (let i = 0; i < slotsCount; i++) {
            if (startIndex + i < allTimeSlots.length) {
              occupied.add(allTimeSlots[startIndex + i]);
            }
          }
        }
      });

    return occupied;
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPackage || !resDate || !resTime || !clientName || !clientPhone || !clientEmail) {
      alert("Molimo popunite sva polja, uključujući i e-mail adresu.");
      return;
    }

    if (!supabase) {
      alert("Supabase nije konfigurisan.");
      return;
    }

    try {
      const { error } = await supabase.from('reservations').insert([
        {
          customer_name: clientName,
          customer_phone: clientPhone,
          service_name: selectedPackage.name,
          price: Number(selectedPackage.price.replace(/[^0-9]/g, '')) || 0,
          reservation_date: `${resDate}T${resTime}:00`,
          status: 'Na čekanju',
        },
      ]);

      if (error) throw error;

      setSuccessMsg("Uspješno ste zakazali termin! Podaci su spremljeni u bazu.");
      
      setSelectedPackage(null);
      setResDate("");
      setResTime("");
      setClientName("");
      setClientPhone("");
      setClientEmail("");

      // Osvježi listu iz baze
      fetchMyReservations();

    } catch (error: any) {
      console.error("Greška pri slanju u bazu:", error);
      alert("Greška pri upisu u bazu: " + error.message);
    }
  };

  const cancelReservation = async (id: number) => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMyReservations(myReservations.filter(r => r.id !== id));
      alert("Termin je uspješno otkazan.");
    } catch (err: any) {
      console.error("Greška pri otkazivanju:", err);
      alert("Greška pri otkazivanju: " + err.message);
    }
  };

  // Generisanje dana za custom kalendar grid
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfWeek = (year: number, month: number) => {
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Ponedjeljak je 0
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

  const occupiedSlotsForSelectedDate = getOccupiedSlots();

  return (
    <main className="relative min-h-screen bg-[#030712] text-white overflow-x-hidden font-sans">
      <Background />

      <Navbar 
        brandName="AI Jaran"
        onOpenContact={() => {}} 
        onResetHero={() => {}}
        onOpenCatalog={() => {}}
      />

      <div className="absolute top-24 right-4 z-20 max-w-7xl mx-auto px-4 w-full flex justify-end">
        <button
          onClick={() => setShowMyTerminiModal(true)}
          className="relative px-4 py-2.5 bg-gray-900/95 backdrop-blur-md border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500 hover:text-gray-950 font-semibold text-xs rounded-xl shadow-lg shadow-cyan-500/10 transition-all flex items-center gap-2 group"
        >
          <span>📅 Moji zakazani termini</span>
          {myReservations.length > 0 && (
            <span className="bg-cyan-500 group-hover:bg-gray-950 group-hover:text-cyan-400 text-gray-950 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold transition-colors">
              {myReservations.length}
            </span>
          )}
        </button>
      </div>

      <div className="pt-32 pb-20 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <span className="px-3.5 py-1 text-xs font-semibold bg-cyan-500/10 text-cyan-400 rounded-full border border-cyan-500/20 uppercase tracking-wider">
            Katalog Biznisa
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold mt-3 mb-4 bg-gradient-to-r from-white via-gray-200 to-cyan-400 bg-clip-text text-transparent">
            Izaberi djelatnost
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-base">
            Pregledaj industrije i sektore za koje AI Jaran pruža naprednu automatizaciju, upravljanje kalendarima i terminima.
          </p>
        </div>

        {!selectedPartner && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
            <span className="text-sm text-gray-400 font-medium">📍 Filtriraj lokaciju:</span>
            <div className="flex flex-wrap gap-2 justify-center">
              {cities.map(city => (
                <button
                  key={city}
                  onClick={() => setSelectedCity(city)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    selectedCity === city
                      ? "bg-cyan-500 text-gray-950 font-bold shadow-md shadow-cyan-500/20"
                      : "bg-gray-900/80 text-gray-400 border border-gray-800 hover:text-white"
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        )}

        {!activeCategory && !selectedPartner && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {businessCategories.map(cat => (
              <div 
                key={cat.id}
                onClick={() => setActiveCategory(cat)}
                className="group bg-gray-900/60 backdrop-blur-md rounded-2xl overflow-hidden border border-gray-800 hover:border-cyan-500/50 transition-all duration-300 flex flex-col justify-between cursor-pointer hover:shadow-xl hover:shadow-cyan-500/10"
              >
                <div>
                  <div className="relative h-48 overflow-hidden bg-gray-800">
                    <img src={cat.image} alt={cat.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-3 left-3 bg-gray-950/85 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-cyan-400 border border-gray-700 flex items-center gap-1.5">
                      <span>{cat.icon}</span>
                      <span>{cat.count}</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2 text-white group-hover:text-cyan-400 transition-colors">{cat.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{cat.description}</p>
                  </div>
                </div>
                <div className="px-6 pb-6 pt-0 flex items-center justify-between border-t border-gray-800/60 mt-4 pt-4">
                  <span className="text-xs text-gray-500">Grad: {selectedCity}</span>
                  <span className="text-cyan-400 font-semibold text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Pregledaj →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeCategory && !selectedPartner && (
          <div className="bg-gray-900/40 backdrop-blur-md border border-gray-800 rounded-2xl p-6 md:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-4 border-b border-gray-800 gap-4">
              <div>
                <button onClick={() => setActiveCategory(null)} className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-cyan-400 transition-colors bg-gray-900 px-4 py-2 rounded-xl border border-gray-800 mb-2">
                  ← Nazad na sve kategorije
                </button>
                <h2 className="text-2xl font-bold flex items-center gap-2 mt-2">
                  <span>{activeCategory.icon}</span>
                  <span>{activeCategory.title}</span>
                </h2>
              </div>
              <span className="text-xs font-normal text-gray-400 bg-gray-900 px-4 py-2 rounded-xl border border-gray-800">
                Aktivni filter: <strong className="text-white">{selectedCity}</strong>
              </span>
            </div>

            {getFilteredPartners(activeCategory.id).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getFilteredPartners(activeCategory.id).map(partner => (
                  <div key={partner.id} className="bg-gray-900/90 rounded-2xl overflow-hidden border border-gray-800 flex flex-col justify-between shadow-lg">
                    <div>
                      <div className="relative h-44 bg-gray-800">
                        <img src={partner.image} alt={partner.name} className="w-full h-full object-cover" />
                        <span className="absolute top-3 right-3 bg-cyan-500 text-gray-950 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow">
                          {partner.badge}
                        </span>
                      </div>
                      <div className="p-5">
                        <h4 className="text-lg font-bold text-white mb-1">{partner.name}</h4>
                        <p className="text-xs text-cyan-400 font-medium mb-3">📍 {partner.location}</p>
                        <p className="text-xs text-gray-400 leading-relaxed mb-4">{partner.description}</p>
                      </div>
                    </div>
                    <div className="p-5 pt-0">
                      <button 
                        onClick={() => setSelectedPartner(partner)}
                        className="w-full block text-center py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-gray-950 text-xs font-bold rounded-xl transition-colors shadow-lg shadow-cyan-500/20"
                      >
                        Otvori profil i rezerviši termin 📅
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <h3 className="text-xl font-bold text-white mb-2">Nema partnera za izabrani grad</h3>
              </div>
            )}
          </div>
        )}

        {selectedPartner && (
          <div className="bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-2xl p-6 md:p-10">
            <button 
              onClick={() => { setSelectedPartner(null); setSuccessMsg(""); }}
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-cyan-400 transition-colors bg-gray-900 px-4 py-2 rounded-xl border border-gray-800 mb-6"
            >
              ← Nazad na listu partnera
            </button>

            {successMsg && (
              <div className="mb-6 p-4 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 rounded-xl text-sm font-medium flex items-center justify-between">
                <span>{successMsg}</span>
                <button onClick={() => setSuccessMsg("")} className="text-xs text-gray-400 hover:text-white">✕ Zatvori</button>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-gray-950 p-6 rounded-2xl border border-gray-800">
                  <h2 className="text-xl font-bold text-white mb-1">{selectedPartner.name}</h2>
                  <p className="text-xs text-cyan-400 font-medium mb-4">📍 {selectedPartner.location}</p>
                  <p className="text-sm text-gray-300 leading-relaxed mb-4">{selectedPartner.description}</p>
                </div>

                <div className="bg-gray-950 p-6 rounded-2xl border border-gray-800">
                  <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider text-cyan-400">Dostupni paketi za vozila</h3>
                  <div className="space-y-3">
                    {selectedPartner.packages.map((pkg: any) => (
                      <div 
                        key={pkg.id}
                        onClick={() => setSelectedPackage(pkg)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          selectedPackage?.id === pkg.id 
                            ? "bg-cyan-500/10 border-cyan-500 text-white shadow-md shadow-cyan-500/10" 
                            : "bg-gray-900 border-gray-800 text-gray-300 hover:border-gray-700"
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-sm text-white">{pkg.name}</span>
                          <span className="text-xs font-extrabold text-cyan-400">{pkg.price}</span>
                        </div>
                        <p className="text-xs text-gray-400 mb-2">{pkg.desc}</p>
                        <span className="text-[10px] bg-gray-950 px-2 py-0.5 rounded text-gray-400 border border-gray-800">
                          ⏱ Trajanje: {pkg.durationHours} sata
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 bg-gray-950 p-6 md:p-8 rounded-2xl border border-gray-800">
                <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                  <span>📅</span>
                  <span>Izaberi datum i vrijeme termina</span>
                </h3>
                <p className="text-xs text-gray-400 mb-6">
                  Radno vrijeme je od 07:00 do 16:00. Zauzeti termini se automatski uklanjaju sa baze i kalendara.
                </p>

                <form onSubmit={handleBookingSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-2">1. Izabrani paket:</label>
                    <div className="p-3 bg-gray-900 rounded-xl border border-gray-800 text-sm font-semibold text-cyan-400">
                      {selectedPackage ? `${selectedPackage.name} (${selectedPackage.price}) - Trajanje: ${selectedPackage.durationHours}h` : "⚠️ Izaberi paket sa lijeve strane"}
                    </div>
                  </div>

                  {/* PRELIJEPI CUSTOM DARK MODE KALENDAR (DOŽIVOTNI) */}
                  <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-bold text-white">
                        2. Izaberi datum: <span className="text-cyan-400">{resDate ? resDate : "(Nije izabrano)"}</span>
                      </span>
                      <div className="flex items-center gap-1 bg-gray-950 p-1 rounded-xl border border-gray-800">
                        <button
                          type="button"
                          onClick={prevMonth}
                          className="px-2.5 py-1 text-xs bg-gray-900 hover:bg-cyan-500 hover:text-gray-950 rounded-lg text-gray-300 font-bold transition-all"
                        >
                          ◀
                        </button>
                        <span className="text-xs font-bold px-3 text-cyan-400">
                          {monthNames[calMonth]} {calYear}
                        </span>
                        <button
                          type="button"
                          onClick={nextMonth}
                          className="px-2.5 py-1 text-xs bg-gray-900 hover:bg-cyan-500 hover:text-gray-950 rounded-lg text-gray-300 font-bold transition-all"
                        >
                          ▶
                        </button>
                      </div>
                    </div>

                    {/* Dani u sedmici */}
                    <div className="grid grid-cols-7 gap-1 text-center mb-2">
                      {dayNamesShort.map(d => (
                        <span key={d} className="text-[11px] font-bold text-gray-500 uppercase">{d}</span>
                      ))}
                    </div>

                    {/* Dani u mjesecu grid */}
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: startDayIndex }).map((_, index) => (
                        <div key={`empty-${index}`} />
                      ))}

                      {Array.from({ length: totalDays }).map((_, index) => {
                        const dayNum = index + 1;
                        const mStr = (calMonth + 1) < 10 ? `0${calMonth + 1}` : `${calMonth + 1}`;
                        const dStr = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
                        const fullDateStr = `${calYear}-${mStr}-${dStr}`;

                        // Provjera da li je prošlost
                        const currentDateObj = new Date(calYear, calMonth, dayNum);
                        const todayNormalized = new Date(todayObj.getFullYear(), todayObj.getMonth(), todayObj.getDate());
                        const isPast = currentDateObj < todayNormalized;

                        const isSelected = resDate === fullDateStr;

                        return (
                          <button
                            key={fullDateStr}
                            type="button"
                            disabled={isPast}
                            onClick={() => { setResDate(fullDateStr); setResTime(""); }}
                            className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                              isPast
                                ? "bg-gray-950/40 border-transparent text-gray-700 cursor-not-allowed"
                                : isSelected
                                ? "bg-cyan-500 text-gray-950 border-cyan-500 shadow-lg shadow-cyan-500/20 scale-105"
                                : "bg-gray-950 border-gray-800 text-gray-300 hover:border-cyan-500/50 hover:bg-gray-800"
                            }`}
                          >
                            {dayNum}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-xs font-medium text-gray-300">3. Izaberi slobodan sat (svakih 30 min):</label>
                      {loadingCalendar && <span className="text-[11px] text-cyan-400 animate-pulse">Učitavam kalendar... 🔄</span>}
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1 bg-gray-900 rounded-xl border border-gray-800">
                      {allTimeSlots.map(time => {
                        const isOccupied = occupiedSlotsForSelectedDate.has(time);
                        const isSelected = resTime === time;
                        
                        return (
                          <button
                            key={time}
                            type="button"
                            disabled={!resDate || !selectedPackage || isOccupied || loadingCalendar}
                            onClick={() => setResTime(time)}
                            className={`py-2 px-2 rounded-lg text-xs font-bold transition-all border ${
                              isOccupied 
                                ? "bg-red-500/10 border-red-500/20 text-red-400/50 cursor-not-allowed line-through" 
                                : isSelected
                                ? "bg-cyan-500 text-gray-950 border-cyan-500 shadow"
                                : "bg-gray-950 border-gray-800 text-gray-300 hover:border-cyan-500/50"
                            } disabled:opacity-40`}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input type="text" placeholder="Vaše ime i prezime" value={clientName} onChange={(e) => setClientName(e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white" />
                    <input type="text" placeholder="Kontakt telefon" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white" />
                  </div>

                  <input type="email" placeholder="E-mail adresa" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white" />

                  <button type="submit" className="w-full py-3.5 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold text-sm rounded-xl transition-all shadow-lg">
                    Potvrdi i zakaži termin 🚀
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {showMyTerminiModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-950 border border-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6 pb-3 border-b border-gray-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>📅</span>
                <span>Moji zakazani termini</span>
              </h3>
              <button onClick={() => setShowMyTerminiModal(false)} className="text-gray-400 hover:text-white text-sm bg-gray-900 px-3 py-1.5 rounded-xl border border-gray-800">
                ✕ Zatvori
              </button>
            </div>

            {myReservations.length > 0 ? (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {myReservations.map(res => (
                  <div key={res.id} className="bg-gray-900 p-4 rounded-xl border border-gray-800 flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-sm text-white">{res.partnerName}</h4>
                        <p className="text-xs text-cyan-400 font-medium">{res.packageName} ({res.price})</p>
                      </div>
                      <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded font-bold">Aktivno</span>
                    </div>
                    <div className="text-xs text-gray-300 bg-gray-950 p-2.5 rounded-xl border border-gray-800 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Datum i vrijeme:</span>
                        <strong className="text-white">{res.date} u {res.time}h</strong>
                      </div>
                    </div>
                    <div className="flex justify-end pt-1">
                      <button onClick={() => cancelReservation(res.id)} className="px-3 py-1 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/30 text-xs font-bold rounded-xl transition-all">
                        Otkaži termin ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-400 text-sm py-10">Trenutno nemate zakazanih termina.</p>
            )}
          </div>
        </div>
      )}

      <Footer t={{ rights: "Sva prava zadržana.", privacy: "Politika privatnosti" }} brandName="AI Jaran" onOpenPrivacy={() => {}} />
    </main>
  );
}