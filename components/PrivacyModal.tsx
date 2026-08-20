"use client";

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: "BS" | "EN";
  t?: any;
}

export default function PrivacyModal({ isOpen, onClose, lang = "BS", t }: PrivacyModalProps) {
  const content = t || (lang === "EN" ? {
    title: "Privacy Policy and Terms of Use",
    sec1Title: "1. Data Collection and Security",
    sec1Desc: "All data you provide through contact forms, inquiries, or business listings (such as names, phone numbers, email addresses, and business specifics) is used exclusively for establishing direct communication, delivering requested services, and maintaining the business directory. Your data is stored securely and never shared with unauthorized third parties.",
    sec2Title: "2. Platform Functionality",
    sec2Desc: "AI Jaran provides communication automation solutions, custom AI agents, calendar integrations, and a business directory catalog. Each solution is tailored to the specific operational needs of businesses following direct consultations.",
    sec3Title: "3. Payment and Cooperation",
    sec3Desc: "Payment for services and packages is handled simply and transparently — through direct agreement and transfer (bank/wire transfer), without complicated card inputs or hidden fees. All details and terms of cooperation are defined in direct contact before work begins.",
    sec4Title: "4. User Rights and Transparency",
    sec4Desc: "You retain the right to request access, modification, or complete deletion of your personal or business data from our records at any time by reaching out through the contact form.",
    sec5Title: "5. Contact",
    sec5Desc: "For any questions regarding privacy, terms of use, or platform functionality, you can contact us directly via the contact form or available communication channels.",
    closeBtn: "I Understand",
  } : {
    title: "Politika privatnosti i uslovi korištenja",
    sec1Title: "1. Prikupljanje i sigurnost podataka",
    sec1Desc: "Svi podaci koje unesete putem kontakt formi, upita ili unosa u katalog biznisa (poput imena, broja telefona, email adrese i detalja o poslovanju) koriste se isključivo u svrhu uspostavljanja direktne komunikacije, pružanja usluga i održavanja kataloga. Vaši podaci se čuvaju na sigurnom mjestu i nikada se ne ustupaju niti dijele trećim licima.",
    sec2Title: "2. Funkcionalnost platforme",
    sec2Desc: "AI Jaran pruža rješenja za automatizaciju komunikacije, izradu prilagođenih AI agenata, integraciju kalendara i katalog poslovnih subjekata. Svako rješenje se prilagođava potrebama biznisa kroz direktne konsultacije i dogovore.",
    sec3Title: "3. Plaćanje i saradnja",
    sec3Desc: "Plaćanje usluga i paketa vrši se jednostavno i transparentno — dogovorom i direktnim transferom (žiralno / uplatom), bez komplikovanih unosa kartica ili skrivenih troškova. Sve detalje i način saradnje definišemo u direktnom kontaktu prije početka rada.",
    sec4Title: "4. Vaša prava i transparentnost",
    sec4Desc: "U svakom trenutku imate pravo zatražiti uvid, izmjenu ili potpuno brisanje vaših ličnih ili poslovnih podataka iz naše baze slanjem zahtjeva kroz kontakt formu.",
    sec5Title: "5. Kontakt",
    sec5Desc: "Za sva pitanja u vezi sa privatnošću, uslovima korištenja ili radom platforme, možete nas kontaktirati direktno putem kontakt forme ili dostupnih komunikacionih kanala.",
    closeBtn: "Razumijem",
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
      <div className="relative flex flex-col w-full max-w-3xl max-h-[85vh] bg-[#030712] border border-white/10 rounded-2xl md:rounded-3xl shadow-2xl text-gray-300 overflow-hidden">
        
        {/* Fiksno zaglavlje */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-[#030712]">
          <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
            {content.title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer text-base flex items-center justify-center h-10 w-10"
          >
            ✕
          </button>
        </div>

        {/* Scrollabilni sadržaj */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 text-xs md:text-sm leading-relaxed">
          <div>
            <h3 className="text-white font-semibold text-sm md:text-base mb-1.5">{content.sec1Title}</h3>
            <p>{content.sec1Desc}</p>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm md:text-base mb-1.5">{content.sec2Title}</h3>
            <p>{content.sec2Desc}</p>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm md:text-base mb-1.5">{content.sec3Title}</h3>
            <p>{content.sec3Desc}</p>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm md:text-base mb-1.5">{content.sec4Title}</h3>
            <p>{content.sec4Desc}</p>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm md:text-base mb-1.5">{content.sec5Title}</h3>
            <p>{content.sec5Desc}</p>
          </div>
        </div>

        {/* Fiksno dno */}
        <div className="px-6 py-4 bg-[#030712] border-t border-white/5 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all shadow-lg shadow-blue-600/20 cursor-pointer text-xs md:text-sm"
          >
            {content.closeBtn}
          </button>
        </div>

      </div>
    </div>
  );
}