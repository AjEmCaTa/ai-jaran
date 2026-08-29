'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import Background from '../../../components/Background';

export default function CategoryPartnersPage() {
  const params = useParams();
  const slug = params?.slug as string;

  // Provjeravamo da li je izabrana kategorija za dubinsko čišćenje
  const isDubinskoCategory =
    slug === 'dubinsko-ciscenje' || slug === 'dubinsko-catic' || slug === 'dubinsko';

  return (
    <main className="relative min-h-screen bg-[#030712] text-white overflow-x-hidden font-sans">
      <Background />
      <Navbar brandName="AI Jaran" onOpenContact={() => {}} onResetHero={() => {}} onOpenCatalog={() => {}} />

      <div className="pt-32 pb-20 px-4 max-w-7xl mx-auto">
        <Link 
          href="/katalog" 
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-blue-400 bg-[#0b0f19] px-4 py-2.5 rounded-xl border border-white/10 mb-8 transition-colors shadow-sm"
        >
          ← Nazad na sve kategorije kataloga
        </Link>

        {isDubinskoCategory ? (
          <div className="space-y-8">
            {/* Naslov kategorije */}
            <div>
              <span className="text-xs font-bold text-blue-400 uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                Kategorija Partnera
              </span>
              <h1 className="text-3xl md:text-5xl font-black text-white mt-3 mb-2 tracking-tight">
                Dubinsko čišćenje & Detailing
              </h1>
              <p className="text-sm text-gray-400 max-w-xl">
                Izaberite pouzdanog partnera za pranje i održavanje vašeg vozila ili namještaja.
              </p>
            </div>

            {/* LISTA BIZNISA (Kartice) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
              
              {/* Kartica: Dubinsko Ćatić sa Okruglim Profilnim Logom */}
              <div className="bg-[#0b0f19] border border-white/10 hover:border-blue-500/80 rounded-3xl p-6 transition-all duration-300 hover:scale-[1.01] shadow-2xl flex flex-col justify-between group">
                
                <div>
                  {/* BADGOVI NA VRHU */}
                  <div className="flex items-center justify-between gap-2 mb-6">
                    <span className="px-3 py-1 text-[10px] font-bold bg-blue-600/20 text-blue-400 rounded-full border border-blue-500/30 uppercase tracking-wider">
                      Preporučeni Partner 🌟
                    </span>
                    <span className="px-2.5 py-1 text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30">
                      🟢 Otvoreno
                    </span>
                  </div>

                  {/* ZAGLAVLJE KARTICE: OKRUGLI LOGO + NASLOV */}
                  <div className="flex items-center gap-4 mb-5">
                    {/* Okrugli okvir logotipa */}
                    <div className="relative shrink-0 w-16 h-16 rounded-full overflow-hidden border-2 border-blue-500/40 bg-white p-0.5 shadow-lg shadow-blue-500/10 group-hover:border-blue-400 transition-colors">
                      <img 
                        src="/partners/dubinsko-catic.jpg" 
                        alt="Dubinsko Ćatić Logo" 
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>

                    <div>
                      <h3 className="text-2xl font-extrabold text-white group-hover:text-blue-400 transition-colors leading-tight">
                        Dubinsko Ćatić
                      </h3>
                      <span className="text-[11px] font-medium text-blue-400/90">
                        Auto detailing & čišćenje
                      </span>
                    </div>
                  </div>

                  {/* OPIS BIZNISA */}
                  <p className="text-xs text-gray-400 leading-relaxed mb-6">
                    Profesionalno dubinsko pranje sjedišta, tepiha, krovnih tapacirunga, te kompletno unutarnje i vanjsko pranje vozila.
                  </p>

                  {/* INFORMACIJE O BIZNISU */}
                  <div className="space-y-2 text-xs text-gray-300 border-t border-white/5 pt-4 mb-6">
                    <p className="flex items-center gap-2">
                      <span className="text-blue-400">📍</span> Vrapčići, Mostar
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-blue-400">📞</span> 060 30 50 153
                    </p>
                    <p className="flex items-center gap-2 text-gray-400">
                      <span className="text-blue-400">🕒</span> Pon – Sub: 07:00 – 17:00
                    </p>
                  </div>
                </div>

                {/* DUGME NA DNU KARTICE */}
                <Link
                  href="/katalog/dubinsko-catic"
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-2xl text-center transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                >
                  Pogledaj ponudu i zakaži termin →
                </Link>

              </div>

            </div>
          </div>
        ) : (
          <div className="text-center py-24 bg-[#0b0f19] border border-white/10 rounded-3xl p-8 max-w-2xl mx-auto shadow-2xl">
            <span className="text-5xl mb-4 block">🚀</span>
            <h2 className="text-3xl font-extrabold text-white mb-3">Uskoro stižu partneri!</h2>
            <p className="text-gray-400 max-w-md mx-auto text-sm mb-6">
              Sveobuhvatna automatizacija i mreža partnera za ovu djelatnost su u fazi pripreme.
            </p>
            <Link 
              href="/katalog" 
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg inline-block"
            >
              Vrati se nazad na katalog
            </Link>
          </div>
        )}
      </div>

      <Footer t={{ rights: "Sva prava zadržana.", privacy: "Politika privatnosti" }} brandName="AI Jaran" onOpenPrivacy={() => {}} />
    </main>
  );
}