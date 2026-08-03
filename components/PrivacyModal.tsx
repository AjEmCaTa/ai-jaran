"use client";

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: "BS" | "EN";
  t?: any;
}

export default function PrivacyModal({ isOpen, onClose, lang = "BS", t }: PrivacyModalProps) {
  // Fallback objekat ako t nije proslijeđen
  const content = t || (lang === "EN" ? {
    title: "Privacy Policy and Terms of Cooperation",
    sec1Title: "1. Security and Protection of Your Data",
    sec1Desc: "All data you enter via the contact form or demo system (such as name, phone number, and business specifics) is used exclusively for establishing direct communication and agreeing on system implementation. Your data is stored securely and encrypted, forwarded exclusively to us via secure channels (Telegram notifications), and is never transferred, sold, or shared with third parties.",
    sec2Title: "2. How the Service and Realization Work",
    sec2Desc: "AI Buddy provides communication automation solutions, calendar integration, and smart appointment scheduling for your clients. Each project is tailored to the specific needs of your business. After you express interest in a certain package or solution, we contact you to define all details before the system goes live.",
    sec3Title: "3. Prices, Advance Payment, and Terms of Cooperation",
    sec3Desc: "Prices and implementation terms are formed flexibly according to the requirements and scope of work agreed upon with each client individually. Work initiation and system development are usually based on the payment of an agreed advance. Given that each system and AI agent are completely manually configured and tailored to your business, refunds after the start of realization and launch are not possible. Final terms are defined directly through consultation, ensuring maximum fair cooperation and no hidden costs.",
    sec4Title: "4. Transparency and Contact",
    sec4Desc: "At any time, you can request insight, modification, or deletion of your data from our database by sending an inquiry through the contact form. We are here to answer your every question and simplify your business.",
    closeBtn: "I Understand",
  } : {
    title: "Politika privatnosti i uslovi saradnje",
    sec1Title: "1. Sigurnost i zaštita vaših podataka",
    sec1Desc: "Svi podaci koje unesete putem kontakt forme ili demo sistema (poput imena, broja telefona i specifičnosti vašeg biznisa) koriste se isključivo u svrhu uspostavljanja direktne komunikacije i dogovora oko implementacije sistema. Vaši podaci se čuvaju na sigurnom i šifriranom mjestu, proslijeđuju se isključivo nama putem sigurnih kanala (Telegram obavještenja) i nikada se ne ustupaju, ne prodaju niti dijele trećim licima.",
    sec2Title: "2. Kako funkcioniše usluga i realizacija",
    sec2Desc: "AI Jaran pruža rješenja za automatizaciju komunikacije, integraciju kalendara i pametno zakazivanje termina za vaše klijente. Svaki projekat se prilagođava specifičnim potrebama vašeg poslovanja. Nakon što iskažete interesovanje za određeni paket ili rješenje, stupamo u kontakt s vama kako bismo definisali sve detalje prije nego što sistem bude pušten u rad.",
    sec3Title: "3. Cijene, avansno plaćanje i uslovi saradnje",
    sec3Desc: "Cijene i uslovi implementacije formiraju se fleksibilno u skladu sa zahtjevima i obimom posla dogovorenim sa svakim klijentom posebno. Početak rada na projektu i izrada sistema obično se baziraju na uplati dogovorenog avansa. S obzirom na to da se svaki sistem i AI agent u potpunosti ručno konfigurišu i prilagođavaju vašem biznisu, povrat novca nakon početka realizacije i puštanja u rad nije moguć. Konačni uslovi definišu se direktno kroz konsultacije, uz maksimalnu fer saradnju i bez skrivenih troškova.",
    sec4Title: "4. Transparentnost i kontakt",
    sec4Desc: "U svakom trenutku možete zatražiti uvid, izmjenu ili brisanje vaših podataka iz naše baze slanjem upita kroz kontakt formu. Tu smo da odgovorimo na svako vaše pitanje i pojednostavimo vaše poslovanje.",
    closeBtn: "Razumijem",
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto bg-[#0b0f19] border border-white/10 rounded-3xl p-8 shadow-2xl text-gray-300">
        {/* Dugme za zatvaranje */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-white p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
        >
          ✕
        </button>

        <h2 className="text-2xl font-extrabold text-white mb-6 tracking-tight">
          {content.title}
        </h2>

        <div className="space-y-6 text-sm leading-relaxed">
          <div>
            <h3 className="text-white font-semibold text-base mb-2">{content.sec1Title}</h3>
            <p>{content.sec1Desc}</p>
          </div>

          <div>
            <h3 className="text-white font-semibold text-base mb-2">{content.sec2Title}</h3>
            <p>{content.sec2Desc}</p>
          </div>

          <div>
            <h3 className="text-white font-semibold text-base mb-2">{content.sec3Title}</h3>
            <p>{content.sec3Desc}</p>
          </div>

          <div>
            <h3 className="text-white font-semibold text-base mb-24 md:mb-6">{content.sec4Title}</h3>
            <p>{content.sec4Desc}</p>
          </div>
        </div>

        <div className="sticky bottom-0 pt-4 bg-[#0b0f19] border-t border-white/5 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all shadow-lg shadow-blue-600/20 cursor-pointer"
          >
            {content.closeBtn}
          </button>
        </div>
      </div>
    </div>
  );
}