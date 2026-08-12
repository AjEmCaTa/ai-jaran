"use client";

import { useState, useLayoutEffect } from "react";
import { translations } from "./translations";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Features from "../components/Features";
import ChatDemo from "../components/ChatDemo";
import Comparison from "../components/Comparison";
import Pricing from "../components/Pricing";
import FAQ from "../components/FAQ";
import Footer from "../components/Footer";
import Background from "../components/Background";
import ContactModal from "../components/ContactModal";
import CookieBanner from "../components/CookieBanner";
import PrivacyModal from "../components/PrivacyModal";

export default function Home() {
  const [lang, setLang] = useState<"BS" | "EN">("BS");
  const t = translations[lang === "BS" ? "bs" : "en"];

  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>("all");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("Opšta pitanja / Konsultacije");
  const [heroKey, setHeroKey] = useState(0);

  // Stanja za prijavu novog biznisa u katalog (slobodan opis)
  const [isRegisterBusinessOpen, setIsRegisterBusinessOpen] = useState(false);
  const [regBizName, setRegBizName] = useState("");
  const [regBizPhone, setRegBizPhone] = useState("");
  const [regBizDesc, setRegBizDesc] = useState("");
  const [regBizSuccess, setRegBizSuccess] = useState(false);

  // Stanja za rezervacije
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<"basic" | "premium">("basic");
  
  // Današnji datum inicijalno
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(7);
  const [selectedDate, setSelectedDate] = useState<string>("2026-08-07");

  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientCar, setClientCar] = useState("");
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [myAppointments, setMyAppointments] = useState<any[]>([]);

  // Zauzeti termini po danima
  const [bookedSlots, setBookedSlots] = useState<Record<string, string[]>>({
    "2026-08-07": ["14:00"],
    "2026-08-08": ["12:00"]
  });

  useLayoutEffect(() => {
    if (isCatalogOpen) {
      window.scrollTo(0, 0);
    }
  }, [isCatalogOpen]);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const monthNames = [
    "januar", "februar", "mart", "april", "maj", "juni", 
    "juli", "avgust", "septembar", "oktobar", "novembar", "decembar"
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const openContact = (planName: string = "Opšta pitanja / Konsultacije") => {
    setSelectedPlan(planName);
    setIsContactOpen(true);
  };

  const cities = [
    { id: "mostar", name: "Mostar" },
  ];

  const allTimeSlots = ["09:00", "10:30", "12:00", "13:30", "15:00", "16:30", "18:00"];

  const isSlotBlocked = (slot: string) => {
    const dayBookings = bookedSlots[selectedDate] || [];
    if (dayBookings.includes(slot)) return true;

    const currentIndex = allTimeSlots.indexOf(slot);
    for (let i = 0; i < currentIndex; i++) {
      const prevSlot = allTimeSlots[i];
      if (dayBookings.includes(prevSlot)) {
        const diff = currentIndex - i;
        if (diff <= 3) return true; 
      }
    }
    return false;
  };

  const handleRegisterBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regBizName || !regBizPhone) return;

    try {
      await fetch('/api/send-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regBizName,
          phone: regBizPhone,
          email: "Prijava novog biznisa u katalog",
          package: `Katalog Partner (Slobodan opis)`,
          message: `🚀 Novi zahtjev za katalog!\nNaziv: ${regBizName}\nTelefon: ${regBizPhone}\nOpis biznisa: ${regBizDesc || "Nije uneseno"}`
        })
      });
    } catch (error) {
      console.error("Greška pri slanju na Telegram:", error);
    }

    setRegBizSuccess(true);
    setTimeout(() => {
      setRegBizSuccess(false);
      setIsRegisterBusinessOpen(false);
      setRegBizName("");
      setRegBizPhone("");
      setRegBizDesc("");
    }, 2500);
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTimeSlot || !clientName || !clientPhone) return;

    const packageNameText = selectedPackage === "basic" 
      ? (lang === "BS" ? "Basic Pranje (20-25 KM)" : "Basic Wash (20-25 KM)")
      : (lang === "BS" ? "Premium Dubinsko (120-150 KM)" : "Premium Deep Clean (120-150 KM)");

    try {
      await fetch('/api/send-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: clientName,
          phone: clientPhone,
          email: "Zakazivanje termina kroz katalog",
          package: `Dubinsko Ćatić - ${packageNameText}`,
          message: `📅 Datum: ${selectedDate} | ⏰ Vrijeme: ${selectedTimeSlot} | 🚗 Vozilo: ${clientCar || "Nije navedeno"}`
        })
      });
    } catch (error) {
      console.error("Greška pri slanju na Telegram:", error);
    }

    const currentDayBookings = bookedSlots[selectedDate] || [];
    const currentIndex = allTimeSlots.indexOf(selectedTimeSlot);
    const slotsToBlock = [selectedTimeSlot];
    
    const blockCount = selectedPackage === "premium" ? 3 : 1;
    for (let i = 1; i <= blockCount; i++) {
      if (allTimeSlots[currentIndex + i]) {
        slotsToBlock.push(allTimeSlots[currentIndex + i]);
      }
    }

    setBookedSlots({
      ...bookedSlots,
      [selectedDate]: [...new Set([...currentDayBookings, ...slotsToBlock])]
    });

    const newAppointment = {
      id: Date.now(),
      service: "Dubinsko Ćatić",
      packageName: packageNameText,
      city: "Mostar",
      date: selectedDate,
      time: selectedTimeSlot,
      name: clientName,
      phone: clientPhone,
      car: clientCar
    };
    setMyAppointments(prev => [...prev, newAppointment]);

    setBookingSuccess(true);
    setTimeout(() => {
      setBookingSuccess(false);
      setIsBookingOpen(false);
      setSelectedTimeSlot(null);
      setClientName("");
      setClientPhone("");
      setClientCar("");
    }, 2500);
  };

  const handleCancelAppointment = (id: number) => {
    setMyAppointments(prev => prev.filter(app => app.id !== id));
    alert(lang === "BS" ? "Termin je uspješno otkazan." : "Appointment successfully cancelled.");
  };

  return (
    <main className="relative min-h-screen bg-[#030712] text-white overflow-x-hidden font-sans">
      
      {isCatalogOpen ? null : <Background />}

      <Navbar 
        lang={lang}
        setLang={setLang}
        brandName={t.nav.brandName}
        onOpenContact={() => openContact("Opšta pitanja / Konsultacije")} 
        onResetHero={() => { 
          setIsCatalogOpen(false); 
          setSelectedCategory(null); 
          setSelectedCity("all"); 
          setHeroKey(prev => prev + 1); 
        }}
        onOpenCatalog={() => { 
          setIsCatalogOpen(true); 
          setSelectedCategory(null); 
          setSelectedCity("all"); 
        }}
      />

      {isCatalogOpen ? (
        <div className="pt-28 pb-16 px-6 md:px-12 w-full min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0b1633] via-[#030712] to-[#030712] relative z-20">
          <div className="max-w-6xl md:max-w-7xl mx-auto">
            {!selectedCategory ? (
              <div className="flex flex-col items-center justify-center py-12">
                <h1 className="text-3xl md:text-5xl font-extrabold mb-4 text-center tracking-tight">
                  {lang === "BS" ? "Katalog Biznisa" : "Business Directory"}
                </h1>
                <p className="text-gray-400 mb-8 text-center max-w-xl text-base md:text-lg">
                  {lang === "BS" ? "Izaberi nišu i istraži aktivne partnere i usluge." : "Choose a niche and explore active partners and services."}
                </p>

                <div className="mb-12 w-full max-w-4xl bg-gradient-to-r from-blue-900/30 via-indigo-900/30 to-blue-900/30 border border-blue-500/30 rounded-3xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {lang === "BS" ? "🚀 Želiš svoj biznis u našem katalogu?" : "🚀 Want your business in our directory?"}
                    </h3>
                    <p className="text-gray-300 text-sm max-w-xl">
                      {lang === "BS" 
                        ? "Bilo čime da se baviš, predstavi svoj biznis pred hiljadama novih klijenata uz AI sistem za rezervacije. Prijavi se ispod!"
                        : "No matter your industry, feature your business to thousands of new clients with AI booking. Register below!"}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsRegisterBusinessOpen(true)}
                    className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition shadow-lg shadow-blue-600/30 cursor-pointer shrink-0"
                  >
                    {lang === "BS" ? "Prijavi svoj biznis" : "Register Business"}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
                  <button 
                    onClick={() => {
                      setSelectedCategory('autopraonice');
                      window.scrollTo(0, 0);
                    }}
                    className="p-8 md:p-10 bg-blue-600/10 border border-blue-500/30 rounded-3xl font-semibold hover:bg-blue-600/20 transition text-left cursor-pointer flex flex-col gap-3 group"
                  >
                    <span className="text-2xl group-hover:translate-x-1 transition-transform">🧼 {lang === "BS" ? "Dubinsko čišćenje / Autopraonice" : "Deep Cleaning / Car Wash"}</span>
                    <span className="text-sm text-gray-400 font-normal">{lang === "BS" ? "Zakazivanje termina i čišćenje vozila" : "Appointment scheduling and vehicle cleaning"}</span>
                  </button>

                  <button 
                    onClick={() => {
                      setSelectedCategory('restorani');
                      window.scrollTo(0, 0);
                    }}
                    className="p-8 md:p-10 bg-amber-600/10 border border-amber-500/30 rounded-3xl font-semibold hover:bg-amber-600/20 transition text-left cursor-pointer flex flex-col gap-3 group"
                  >
                    <span className="text-2xl group-hover:translate-x-1 transition-transform">🍽️ {lang === "BS" ? "Restorani / Kafići" : "Restaurants / Cafes"}</span>
                    <span className="text-sm text-gray-400 font-normal">{lang === "BS" ? "Rezervacije stolova i meni" : "Table reservations and menu"}</span>
                  </button>

                  <button 
                    onClick={() => {
                      setSelectedCategory('vile');
                      window.scrollTo(0, 0);
                    }}
                    className="p-8 md:p-10 bg-purple-600/10 border border-purple-500/30 rounded-3xl font-semibold hover:bg-purple-600/20 transition text-left cursor-pointer flex flex-col gap-3 group"
                  >
                    <span className="text-2xl group-hover:translate-x-1 transition-transform">🏡 {lang === "BS" ? "Vile s bazenom / Vikendice" : "Villas / Cottages"}</span>
                    <span className="text-sm text-gray-400 font-normal">{lang === "BS" ? "Iznajmljivanje i smještaj" : "Rental and accommodation"}</span>
                  </button>

                  <button 
                    onClick={() => {
                      setSelectedCategory('frizerski');
                      window.scrollTo(0, 0);
                    }}
                    className="p-8 md:p-10 bg-pink-600/10 border border-pink-500/30 rounded-3xl font-semibold hover:bg-pink-600/20 transition text-left cursor-pointer flex flex-col gap-3 group"
                  >
                    <span className="text-2xl group-hover:translate-x-1 transition-transform">💇‍♂️ {lang === "BS" ? "Frizerski / Saloni ljepote" : "Barbers / Salons"}</span>
                    <span className="text-sm text-gray-400 font-normal">{lang === "BS" ? "Uređivanje i termini" : "Styling and appointments"}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col py-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                  <button 
                    onClick={() => { 
                      setSelectedCategory(null); 
                      setSelectedCity("all"); 
                      setIsDropdownOpen(false); 
                      window.scrollTo(0, 0);
                    }}
                    className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition text-sm cursor-pointer flex items-center gap-2 text-gray-300"
                  >
                    ← {lang === "BS" ? "Nazad na kategorije" : "Back to categories"}
                  </button>

                  <button
                    onClick={() => setIsManageModalOpen(true)}
                    className="px-5 py-2.5 bg-blue-600/10 border border-blue-500/30 hover:bg-blue-600/20 text-blue-400 rounded-xl text-sm font-semibold transition cursor-pointer flex items-center gap-2"
                  >
                    📅 {lang === "BS" ? "Moji zakazani termini" : "My Appointments"}
                  </button>
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 md:p-10 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative">
                  <div>
                    <h2 className="text-3xl md:text-4xl font-bold capitalize mb-2 text-white">
                      {selectedCategory === 'autopraonice' && (lang === "BS" ? "Dubinsko čišćenje & Autopraonice" : "Deep Cleaning & Car Wash")}
                      {selectedCategory === 'restorani' && (lang === "BS" ? "Restorani i Kafići" : "Restaurants & Cafes")}
                      {selectedCategory === 'vile' && (lang === "BS" ? "Vile s bazenom i Vikendice" : "Villas & Cottages")}
                      {selectedCategory === 'frizerski' && (lang === "BS" ? "Frizerski i Saloni Ljepote" : "Barbers & Salons")}
                    </h2>
                    <p className="text-gray-400 text-base">
                      {lang === "BS" ? "Pregledaj dostupne partnere i filtriraj po lokaciji." : "Browse available partners and filter by location."}
                    </p>
                  </div>

                  <div className="w-full md:w-auto flex flex-col gap-1.5 relative">
                    <label className="text-xs text-gray-400 font-medium">
                      {lang === "BS" ? "Filtriraj po gradu:" : "Filter by city:"}
                    </label>
                    
                    <div className="relative">
                      <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="bg-[#0b1329] border border-white/10 text-white text-sm rounded-xl px-5 py-3 flex items-center justify-between gap-6 focus:outline-none focus:border-blue-500 transition cursor-pointer min-w-[220px]"
                      >
                        <span>
                          {selectedCity === "all" 
                            ? (lang === "BS" ? "🌐 Svi gradovi" : "🌐 All Cities") 
                            : `📍 ${cities.find(c => c.id === selectedCity)?.name}`}
                        </span>
                        <span className={`text-xs transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}>▼</span>
                      </button>

                      {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-full bg-[#0b1329] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-20">
                          <button
                            onClick={() => { setSelectedCity("all"); setIsDropdownOpen(false); }}
                            className={`w-full text-left px-4 py-3 text-sm transition hover:bg-white/5 cursor-pointer flex items-center gap-2 ${
                              selectedCity === "all" ? "text-blue-400 font-semibold bg-white/5" : "text-gray-300"
                            }`}
                          >
                            🌐 {lang === "BS" ? "Svi gradovi" : "All Cities"}
                          </button>
                          {cities.map((city) => (
                            <button
                              key={city.id}
                              onClick={() => { setSelectedCity(city.id); setIsDropdownOpen(false); }}
                              className={`w-full text-left px-4 py-3 text-sm transition hover:bg-white/5 cursor-pointer flex items-center gap-2 ${
                                selectedCity === city.id ? "text-blue-400 font-semibold bg-white/5" : "text-gray-300"
                              }`}
                            >
                              📍 {city.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {selectedCategory === 'autopraonice' && (selectedCity === 'all' || selectedCity === 'mostar') ? (
                    <div className="p-8 md:p-10 bg-blue-500/10 border border-blue-500/20 rounded-3xl flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-xl md:text-2xl font-semibold text-blue-400">🚗 Dubinsko Ćatić</h3>
                          <span className="text-xs bg-blue-500/20 border border-blue-500/30 px-3 py-1 rounded-full text-blue-300">Mostar</span>
                        </div>
                        <p className="text-base text-gray-300 mb-6">
                          {lang === "BS" 
                            ? "Profesionalno pranje, dubinsko čišćenje automobila, sjedišta i namještaja uz izbor paketa i zakazivanje termina." 
                            : "Professional car wash, deep cleaning of seats and furniture with package selection and scheduling."}
                        </p>
                        
                        <div className="flex items-center gap-2 mb-8 text-sm text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-2xl w-fit">
                          <span>🏷️ Basic: 20-25 KM | Premium: 120-150 KM</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => setIsBookingOpen(true)}
                        className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-2xl text-base transition cursor-pointer text-center shadow-lg shadow-blue-600/20"
                      >
                        {lang === "BS" ? "Zakaži termin" : "Book appointment"}
                      </button>
                    </div>
                  ) : (
                    <div className="col-span-full text-gray-500 italic py-16 text-center bg-white/[0.01] border border-white/5 rounded-3xl text-base">
                      {lang === "BS" ? "Nema pronađenih biznisa za izabrani grad..." : "No businesses found for the selected city..."}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <Hero 
            t={t.hero}
            animationKey={heroKey}
            lang={lang}
            onStartFree={() => openContact("Jaran Starter (50 KM/mj)")}
            onCatalogJoin={() => {
              setIsCatalogOpen(true);
              setSelectedCategory(null);
              setSelectedCity("all");
            }}
            onHowItWorks={() => {
              document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" });
            }}
          />

          <Features t={t.features} />
          <Comparison t={t.comparison} />

          <div id="demo">
            <ChatDemo t={t.chatDemo} />
          </div>

          <Pricing t={t.pricing} onSelectPlan={openContact} />
          <FAQ t={t.faq} />
        </>
      )}

      {!isCatalogOpen && (
        <button
          onClick={() => {
            setIsCatalogOpen(true);
            setSelectedCategory(null);
            setSelectedCity("all");
          }}
          className="fixed bottom-6 right-6 z-40 p-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-full shadow-2xl shadow-blue-600/50 transition-transform hover:scale-110 cursor-pointer flex items-center justify-center border border-white/20"
          title="Otvori katalog"
        >
          <span className="text-2xl">🚀</span>
        </button>
      )}

      {isRegisterBusinessOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0b1329] border border-white/10 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative">
            <button 
              onClick={() => setIsRegisterBusinessOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-white cursor-pointer"
            >
              ✕
            </button>

            <h3 className="text-xl font-bold mb-1 text-white">
              {lang === "BS" ? "Prijavi svoj biznis u katalog" : "Register Business in Directory"}
            </h3>
            <p className="text-xs text-gray-400 mb-6">
              {lang === "BS" ? "opiši svoj biznis svojim riječima, a naš tim će te kontaktirati." : "Describe your business in your own words, and our team will contact you."}
            </p>

            {regBizSuccess ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500 text-emerald-400 rounded-full flex items-center justify-center text-2xl mb-4">
                  ✓
                </div>
                <h4 className="text-lg font-bold text-white mb-1">
                  {lang === "BS" ? "Prijava uspješno poslana!" : "Registration Successfully Sent!"}
                </h4>
                <p className="text-sm text-gray-400">
                  {lang === "BS" ? "Uskoro te kontaktiramo." : "We will contact you soon."}
                </p>
              </div>
            ) : (
              <form onSubmit={handleRegisterBusiness} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-gray-300 font-medium">
                    {lang === "BS" ? "Naziv biznisa:" : "Business Name:"}
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder={lang === "BS" ? "Npr. Autopraonica / Salon / Vila" : "E.g. Car Wash / Salon / Villa"}
                    value={regBizName}
                    onChange={(e) => setRegBizName(e.target.value)}
                    className="bg-[#030712] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-gray-300 font-medium">
                    {lang === "BS" ? "Broj telefona (Viber):" : "Phone Number:"}
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder="+387 61..."
                    value={regBizPhone}
                    onChange={(e) => setRegBizPhone(e.target.value)}
                    className="bg-[#030712] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-gray-300 font-medium">
                    {lang === "BS" ? "Opiši svoj biznis (usluge, lokacija...):" : "Describe your business (services, location...):"}
                  </label>
                  <textarea 
                    rows={3}
                    placeholder={lang === "BS" ? "Npr. Bavimo se... Nalazimo se u..." : "E.g. We provide... Located in..."}
                    value={regBizDesc}
                    onChange={(e) => setRegBizDesc(e.target.value)}
                    className="bg-[#030712] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-blue-600/30 cursor-pointer mt-2"
                >
                  {lang === "BS" ? "Pošalji prijavu za katalog" : "Submit Directory Request"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {isBookingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0b1329] border border-white/10 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsBookingOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-white cursor-pointer"
            >
              ✕
            </button>

            <h3 className="text-xl font-bold mb-1 text-white">
              {lang === "BS" ? "Zakaži termin: Dubinsko Ćatić" : "Book Appointment: Dubinsko Ćatić"}
            </h3>
            <p className="text-xs text-gray-400 mb-6">
              {lang === "BS" ? "Izaberi paket usluge, datum i slobodan sat." : "Choose your service package, date and time slot."}
            </p>

            {bookingSuccess ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500 text-emerald-400 rounded-full flex items-center justify-center text-2xl mb-4">
                  ✓
                </div>
                <h4 className="text-lg font-bold text-white mb-1">
                  {lang === "BS" ? "Uspješno zakazano!" : "Successfully Booked!"}
                </h4>
                <p className="text-sm text-gray-400">
                  {lang === "BS" ? "Vidimo se u dogovoreno vrijeme." : "See you at the scheduled time."}
                </p>
              </div>
            ) : (
              <form onSubmit={handleConfirmBooking} className="flex flex-col gap-5">
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-gray-300 font-medium">
                    {lang === "BS" ? "Izaberi paket usluge:" : "Select service package:"}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedPackage("basic")}
                      className={`p-3 rounded-2xl border text-left transition flex flex-col gap-1 cursor-pointer ${
                        selectedPackage === "basic"
                          ? "bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/10"
                          : "bg-[#030712] border-white/10 text-gray-400 hover:bg-white/5"
                      }`}
                    >
                      <span className="font-bold text-sm text-white">🧼 Basic Paket</span>
                      <span className="text-xs text-emerald-400 font-semibold">20 - 25 KM</span>
                      <span className="text-[10px] text-gray-400">{lang === "BS" ? "Pranje (2h)" : "Wash (2h)"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedPackage("premium")}
                      className={`p-3 rounded-2xl border text-left transition flex flex-col gap-1 cursor-pointer ${
                        selectedPackage === "premium"
                          ? "bg-purple-600/20 border-purple-500 text-white shadow-lg shadow-purple-500/10"
                          : "bg-[#030712] border-white/10 text-gray-400 hover:bg-white/5"
                      }`}
                    >
                      <span className="font-bold text-sm text-white">✨ Premium Paket</span>
                      <span className="text-xs text-emerald-400 font-semibold">120 - 150 KM</span>
                      <span className="text-[10px] text-gray-400">{lang === "BS" ? "Dubinsko (4-5h)" : "Deep clean (4-5h)"}</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2 bg-[#030712] border border-white/10 rounded-2xl p-4">
                  
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold capitalize text-white">
                      {monthNames[currentMonth]} {currentYear}
                    </span>
                    <div className="flex gap-1">
                      <button 
                        type="button" 
                        onClick={handlePrevMonth}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition cursor-pointer text-xs"
                      >
                        ▲
                      </button>
                      <button 
                        type="button" 
                        onClick={handleNextMonth}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition cursor-pointer text-xs"
                      >
                        ▼
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-gray-400 mb-1">
                    <span>po</span>
                    <span>ut</span>
                    <span>sr</span>
                    <span>če</span>
                    <span>pe</span>
                    <span>su</span>
                    <span>ne</span>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center text-xs">
                    {Array.from({ length: getFirstDayOfMonth(currentYear, currentMonth) }).map((_, index) => (
                      <div key={`empty-${index}`} />
                    ))}

                    {Array.from({ length: getDaysInMonth(currentYear, currentMonth) }).map((_, index) => {
                      const dayNum = index + 1;
                      const formattedDay = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
                      const formattedMonth = (currentMonth + 1) < 10 ? `0${currentMonth + 1}` : `${currentMonth + 1}`;
                      const dateString = `${currentYear}-${formattedMonth}-${formattedDay}`;
                      
                      const isSelected = selectedDate === dateString;

                      return (
                        <button
                          key={dateString}
                          type="button"
                          onClick={() => setSelectedDate(dateString)}
                          className={`py-2 rounded-xl font-medium transition cursor-pointer flex items-center justify-center ${
                            isSelected 
                              ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-600/40" 
                              : "text-gray-300 hover:bg-white/10"
                          }`}
                        >
                          {dayNum}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="text-xs text-blue-400 font-medium text-center">
                  {lang === "BS" ? "Izabrani datum:" : "Selected date:"} <span className="font-bold text-white">{selectedDate}</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-gray-300 font-medium">
                    {lang === "BS" ? "Slobodni termini (sati):" : "Available time slots:"}
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {allTimeSlots.map((slot) => {
                      const isBlocked = isSlotBlocked(slot);
                      const isSelected = selectedTimeSlot === slot;

                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={isBlocked}
                          onClick={() => setSelectedTimeSlot(slot)}
                          className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition text-center ${
                            isBlocked 
                              ? "bg-red-500/10 border border-red-500/20 text-red-400/60 opacity-60 cursor-not-allowed line-through" 
                              : isSelected 
                              ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-105" 
                              : "bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 cursor-pointer"
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-gray-300 font-medium">
                      {lang === "BS" ? "Tvoje ime i prezime:" : "Your Full Name:"}
                    </label>
                    <input 
                      type="text"
                      required
                      placeholder="Harun Ćatić"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="bg-[#030712] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-gray-300 font-medium">
                      {lang === "BS" ? "Broj telefona:" : "Phone Number:"}
                    </label>
                    <input 
                      type="text"
                      required
                      placeholder="+387 61..."
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="bg-[#030712] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-gray-300 font-medium">
                    {lang === "BS" ? "Model vozila (opcionalno):" : "Car Model (optional):"}
                  </label>
                  <input 
                    type="text"
                    placeholder="Golf 5 / Ford C-Max"
                    value={clientCar}
                    onChange={(e) => setClientCar(e.target.value)}
                    className="bg-[#030712] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={!selectedTimeSlot}
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition shadow-lg ${
                    selectedTimeSlot 
                      ? "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 cursor-pointer" 
                      : "bg-gray-700 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  {lang === "BS" ? "Potvrdi rezervaciju termina" : "Confirm Appointment"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {isManageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#090d16] border border-white/10 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative max-h-[80vh] overflow-y-auto">
            <button 
              onClick={() => setIsManageModalOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-white cursor-pointer"
            >
              ✕
            </button>

            <h3 className="text-xl font-bold mb-1 text-white">
              {lang === "BS" ? "Moji zakazani termini" : "My Appointments"}
            </h3>
            <p className="text-xs text-gray-400 mb-6">
              {lang === "BS" ? "Pregledaj ili otkaži svoje aktivne termine." : "View or cancel your active appointments."}
            </p>

            {myAppointments.length === 0 ? (
              <div className="py-12 text-center text-gray-500 italic text-sm">
                {lang === "BS" ? "Trenutno nemaš aktivnih rezervacija u sesiji." : "No active bookings in session."}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {myAppointments.map((app) => (
                  <div key={app.id} className="p-4 bg-white/[0.02] border border-white/10 rounded-2xl flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-blue-400 text-sm">{app.service} ({app.city})</h4>
                        <p className="text-xs text-emerald-400 font-medium mt-0.5">{app.packageName}</p>
                        <p className="text-xs text-gray-300 mt-1">👤 {app.name} | 📞 {app.phone}</p>
                        {app.car && <p className="text-xs text-gray-400">🚗 {app.car}</p>}
                      </div>
                      <span className="text-xs bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded-full border border-blue-500/30">
                        {app.date} u {app.time}
                      </span>
                    </div>

                    <button
                      onClick={() => handleCancelAppointment(app.id)}
                      className="self-end px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-xs font-semibold transition cursor-pointer"
                    >
                      {lang === "BS" ? "Otkaži termin" : "Cancel appointment"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      <Footer 
        t={t.footer} 
        brandName={t.nav.brandName} 
        onOpenPrivacy={() => setIsPrivacyOpen(true)} 
      />

      <ContactModal 
        isOpen={isContactOpen} 
        onClose={() => setIsContactOpen(false)} 
        defaultSubject={selectedPlan}
        t={t.contactModal}
      />

      <PrivacyModal 
        isOpen={isPrivacyOpen} 
        onClose={() => setIsPrivacyOpen(false)} 
        t={t.privacy}
      />

      <CookieBanner 
        t={t.cookie} 
        onOpenPrivacy={() => setIsPrivacyOpen(true)} 
      />
    </main>
  );
}