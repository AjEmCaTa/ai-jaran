"use client";

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrivacyModal({
  isOpen,
  onClose,
}: PrivacyModalProps) {
  if (!isOpen) return null;

  const content = {
    title: "Politika privatnosti i uslovi korištenja",

    sec1Title: "1. Prikupljanje i sigurnost podataka",
    sec1Desc:
      "Svi podaci koje unesete putem kontakt formi, upita ili unosa u katalog biznisa (poput imena, broja telefona, email adrese i detalja o poslovanju) koriste se isključivo u svrhu uspostavljanja direktne komunikacije, pružanja usluga i održavanja kataloga. Vaši podaci se čuvaju na sigurnom mjestu i nikada se ne ustupaju niti dijele trećim licima.",

    sec2Title: "2. Funkcionalnost platforme",
    sec2Desc:
      "POSLO ONE pruža rješenja za automatizaciju komunikacije, izradu prilagođenih AI agenata, integraciju kalendara i katalog poslovnih subjekata. Svako rješenje se prilagođava potrebama biznisa kroz direktne konsultacije i dogovore.",

    sec3Title: "3. Plaćanje i saradnja",
    sec3Desc:
      "Plaćanje usluga i paketa vrši se jednostavno i transparentno — dogovorom i direktnim transferom (žiralno / uplatom), bez komplikovanih unosa kartica ili skrivenih troškova. Sve detalje i način saradnje definišemo u direktnom kontaktu prije početka rada.",

    sec4Title: "4. Vaša prava i transparentnost",
    sec4Desc:
      "U svakom trenutku imate pravo zatražiti uvid, izmjenu ili potpuno brisanje vaših ličnih ili poslovnih podataka iz naše baze slanjem zahtjeva kroz kontakt formu.",

    sec5Title: "5. Kontakt",
    sec5Desc:
      "Za sva pitanja u vezi sa privatnošću, uslovima korištenja ili radom platforme, možete nas kontaktirati direktno putem kontakt forme ili dostupnih komunikacionih kanala.",

    closeBtn: "Razumijem",
  };

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
            <h3 className="text-white font-semibold text-sm md:text-base mb-1.5">
              {content.sec1Title}
            </h3>
            <p>{content.sec1Desc}</p>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm md:text-base mb-1.5">
              {content.sec2Title}
            </h3>
            <p>{content.sec2Desc}</p>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm md:text-base mb-1.5">
              {content.sec3Title}
            </h3>
            <p>{content.sec3Desc}</p>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm md:text-base mb-1.5">
              {content.sec4Title}
            </h3>
            <p>{content.sec4Desc}</p>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm md:text-base mb-1.5">
              {content.sec5Title}
            </h3>
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