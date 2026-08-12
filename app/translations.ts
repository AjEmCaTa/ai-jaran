export const translations = {
  bs: {
    nav: {
      brandName: "AI Jaran",
    },
    hero: {
      badge: "TVOJ NOVI DIGITALNI RADNIK",
      titleMain: "Upoznaj",
      titleHighlight: "AI JARANA",
      description: "Automatizuj zakazivanje termina uz AI radnika i predstavi svoj biznis (autopraonicu, vilu, salon) u našem katalogu pred hiljadama novih klijenata.",
      ctaPrimary: "Isprobaj besplatno 🚀",
      ctaSecondary: "Kako radi?",
      catalogCta: "📦 Ubaci svoj biznis u katalog",
    },
    features: {
      titleMain: "Šta nudi",
      titleHighlight: "AI JARAN?",
      items: [
        {
          title: "AI Radnik 24/7",
          desc: "Tvoj digitalni Jaran radi bez pauze, odgovara na upite i vodi razgovore sa klijentima u bilo koje doba dana i noći.",
        },
        {
          title: "Pametne Rezervacije",
          desc: "Klijenti samostalno biraju termine, a sistem ih automatski upisuje u tvoj kalendar, eliminišući mogućnost duplih zakazivanja.",
        },
        {
          title: "Katalog za Biznise",
          desc: "Tvoj biznis postaje dio ekskluzivne mreže gdje te hiljade novih klijenata lako pronalaze i rezervišu tvoje usluge.",
        },
        {
          title: "Sve kategorije biznisa",
          desc: "Autopraonice, vile, restorani ili saloni – sistem se u potpunosti konfiguriše prema specifičnim potrebama tvoje djelatnosti.",
        },
      ],
    },
    benefits: {
      titleMain: "Zašto baš",
      titleHighlight: "AI JARAN?",
      items: [
        {
          title: "Čuva ti leđa 24/7",
          desc: "Jaran radi i odgovara klijentima dok ti odmaraš ili vodiš poslove na terenu.",
        },
        {
          title: "Priča kao čovjek",
          desc: "Prirodan ton komunikacije i domaći duh bez ikakvog osjećaja robotike.",
        },
        {
          title: "Trenutna brzina",
          desc: "Rješava upite u sekundi, osiguravajući da nijedan potencijalni klijent ne čeka.",
        },
        {
          title: "Pametne rezervacije",
          desc: "Automatski dogovara termine i upisuje ih direktno u tvoj kalendar bez greške.",
        },
      ],
    },
    chatDemo: {
      titleMain: "Kako",
      titleHighlight: "AI Jaran",
      titleSuffix: "radi u pozadini",
      description: "Pogledaj kako sistem automatski preuzima upit, provjerava termine i rješava rezervaciju bez tvog prisustva.",
      steps: [
        {
          title: "1. Klijent šalje poruku",
          subtitle: "Instagram DM",
          content: "Zdravo! Imate li slobodan termin za vikendicu ove subote?",
          badge: "Nova poruka stigla"
        },
        {
          title: "2. AI Jaran obrađuje upit",
          subtitle: "Baza & Dostupnost",
          content: "Provjeravam kalendar... Subota je slobodna! Cijena je 250 KM.",
          badge: "AI analizira bazu"
        },
        {
          title: "3. Automatska potvrda i termin",
          subtitle: "Google Calendar & Telegram",
          content: "Termin uspješno rezervisan! Obavještenje poslato na Telegram vlasniku.",
          badge: "Završeno automatski"
        }
      ],
      footerRealtime: "Automatizacija u realnom vremenu"
    },
    comparison: {
      title: "Razlika koja",
      titleHighlight: "donosi novac",
      subtitle: "Pogledaj kako izgleda vođenje posla bez sistema i sa Jaranom u ekipi.",
      oldBadge: "Stari način (Bez Jarana)",
      oldTitle: "Gubljenje klijenata i živaca",
      old1: "Poruke u 23:00 ostaju nepročitane, klijent ujutro odustane i ode kod konkurencije.",
      old2: "Vječito kuckanje iste cijene, lokacije i slobodnih termina po sto puta dnevno.",
      old3: "Dupla rezervacija istog termina jer se zaboravilo upisati u svesku ili Excel.",
      old4: "Zveči telefon dok si na terenu ili odmaraš s porodicom.",
      newBadge: "Novi način (Sa AI Jaranom)",
      newTitle: "Automatizovan biznis 24/7",
      new1: "Instant odgovor u sekundi, bez obzira je li 3 ujutro ili subota popodne.",
      new2: "Jaran samostalno vodi razgovor prema tvojoj bazi znanja i cjenovniku.",
      new3: "Termin se automatski upisuje u kalendar, a tebi stiže čista notifikacija.",
      new4: "Ti imaš punu kontrolu i slobodno vrijeme za ono što je stvarno bitno.",
    },
    pricing: {
      titleMain: "Investiraj u svog",
      titleHighlight: "DIGITALNOG RADNIKA",
      subtitle: "Brza izrada i spajanje sa tvojim kalendarom za samo 2 do 3 radna dana. Uslovi i obim posla dogovaraju se direktno.",
      popularBadge: "NAJTRAŽENIJI PAKET",
      priceModel: "Model saradnje",
      priceValue: "Po dogovoru",
      plans: [
        {
          name: "Starter Jaran",
          badge: "Mali biznis / Samostalni radnik",
          description: "Idealno za pojedince i male obrte. Jaran preuzima Instagram DM, samostalno dogovara termine i upisuje ih u tvoj kalendar.",
          features: [
            "Povezivanje na Instagram DM i tvoj kalendar",
            "Automatsko odgovaranje na upite i cijene 24/7",
            "Direktno zakazivanje termina bez tvog uplitanja",
            "Telegram obavijesti u realnom vremenu o svakoj rezervaciji",
            "Gotovo i pušteno u rad za 2 do 3 radna dana",
            "Fleksibilan dogovor i avansno pokretanje izrade",
          ],
          buttonText: "Zatraži Starter",
          popular: false,
          value: "Starter Jaran (Mali biznis)",
        },
        {
          name: "Business Jaran",
          badge: "Srednji biznis (2-3 zaposlenika)",
          description: "Za salone, servise i biznise sa više usluga. Moćniji AI sistem koji upravlja rasporedom i šalje precizne notifikacije tvojoj ekipi.",
          features: [
            "Napredna Instagram DM automatizacija",
            "Pametna baza podataka sa svim cijenama i uslugama",
            "Sinhronizacija sa kalendarom cijelog tima",
            "Telegram obavijesti i detaljan pregled rezervacija",
            "Prioritetno postavljanje i podešavanje (2-3 dana)",
            "Prilagođeni uslovi i siguran dogovor saradnje",
          ],
          buttonText: "Zatraži Business",
          popular: true,
          value: "Business Jaran (Srednji biznis)",
        },
        {
          name: "Pro System Jaran",
          badge: "Veći sistemi i kompanije",
          description: "Kompletno prilagođeno rješenje za veće obime posla, više kanala i specifične poslovne integracije sa tvojim internim alatima.",
          features: [
            "Multi-kanalna AI podrška i custom integracije",
            "Povezivanje sa naprednim kalendarima i bazama",
            "Telegram sistem obavještavanja za cijeli tim",
            "Namjenski server za maksimalnu brzinu i stabilnost",
            "Dugoročna tehnička podrška i dorade",
            "Individualna ponuda i uslovi realizacije",
          ],
          buttonText: "Zatraži Custom Ponudu",
          popular: false,
          value: "Pro System Jaran (Veći sistemi)",
        },
      ],
    },
    faq: {
      title: "Često postavljana pitanja",
      items: [
        { 
          q: "Kako AI Jaran uči o mom biznisu?", 
          a: "Tvoj Jaran dobija pristup tvojim cjenovnicima, uslugama i radnom vremenu. Na osnovu toga automatski odgovara klijentima i usklađuje termine." 
        },
        { 
          q: "Da li ja moram ručno odgovarati na poruke?", 
          a: "Ne. Jaran potpuno samostalno vodi razgovor u Instagram DM-u, dogovara termine i upisuje ih direktno u tvoj kalendar bez tvog uplitanja." 
        },
        { 
          q: "Šta se dešava kada se termin zakazuje?", 
          a: "Kada klijent potvrdi termin, Jaran ga upisuje u kalendar, a tebi odmah stiže čista obavijest na mobitel da znaš tačno vrijeme." 
        },
        { 
          q: "Koliko traje podešavanje i puštanje u rad?", 
          a: "Kompletno podešavanje, učenje baze i spajanje sa tvojim kalendarom traje između 2 i 3 radna dana." 
        },
        { 
          q: "Postoje li ikakvi mjesečni troškovi ili pretplate?", 
          a: "Ne. Izrada i postavljanje sistema je jednokratna investicija, čime izbjegavaš bilo kakve mjesečne naknade i komplikacije." 
        },
      ],
    },
    footer: {
      rights: "Sva prava zadržana. Razvijeno za moderne biznise.",
      features: "Mogućnosti",
      pricing: "Cijene",
      privacy: "Politika privatnosti",
    },
    privacy: {
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
    },
    cookie: {
      cookieTitle: "Politika kolačića i privatnosti",
      cookieDesc: "Koristimo minimalne kolačiće za rad stranice i analizu. Vaši podaci s kontakt forme koriste se isključivo za dogovor i komunikaciju.",
      cookieBtn: "Prihvatam",
    },
    contactModal: {
      modalTitle: "Uglavi svog Jarana",
      modalSubtitle: "Unesi podatke i naš tim će ti se javiti u najkraćem roku za podešavanje sistema.",
      successTitle: "Uspješno poslano!",
      successDesc: "Podaci su spremljeni, a obavještenje je poslano.",
      labelName: "Ime ili naziv biznisa",
      placeholderName: "Npr. Salon ljepote Ana",
      labelPhone: "Broj telefona (WhatsApp/Viber)",
      placeholderPhone: "Npr. 061 123 456",
      labelEmail: "Email adresa (opcionalno)",
      placeholderEmail: "Npr. info@biznis.com",
      labelPackage: "Izaberi paket",
      opt1: "Starter Jaran (Mali biznis)",
      opt2: "Business Jaran (Srednji biznis)",
      opt3: "Pro System Jaran (Veći sistemi)",
      opt4: "Samo želim pitati nešto",
      labelMessage: "Kratka poruka (opcionalno)",
      placeholderMessage: "Napiši ako imaš nekih specifičnih želja...",
      loadingBtn: "Slanje...",
      submitBtn: "Pošalji zahtjev jaranu",
    },
  },
  en: {
    nav: {
      brandName: "AI Buddy",
    },
    hero: {
      badge: "YOUR NEW DIGITAL WORKER",
      titleMain: "Meet",
      titleHighlight: "AI BUDDY",
      description: "Automate appointment scheduling with an AI worker and feature your business (car wash, villa, salon) in our directory to thousands of new clients.",
      ctaPrimary: "Try for free 🚀",
      ctaSecondary: "How it works?",
      catalogCta: "📦 Add Your Business to Directory",
    },
    features: {
      titleMain: "What does",
      titleHighlight: "AI BUDDY offer?",
      items: [
        {
          title: "AI Worker 24/7",
          desc: "Your digital Buddy works without breaks, answering queries and chatting with clients anytime.",
        },
        {
          title: "Smart Bookings",
          desc: "Clients pick slots, and the system automatically logs them into your calendar, preventing double bookings.",
        },
        {
          title: "Business Directory",
          desc: "Your business becomes part of an exclusive network where thousands of new clients find and book your services.",
        },
        {
          title: "All Business Categories",
          desc: "Car washes, villas, restaurants, or salons – the system is fully configured to your specific business needs.",
        },
      ],
    },
    benefits: {
      titleMain: "Why choose",
      titleHighlight: "AI BUDDY?",
      items: [
        {
          title: "Backs you up 24/7",
          desc: "Works and replies to clients while you rest or handle field work.",
        },
        {
          title: "Speaks like a human",
          desc: "Natural communication tone and local vibe without any robotic feeling.",
        },
        {
          title: "Instant speed",
          desc: "Resolves inquiries in seconds, ensuring no potential client is left waiting.",
        },
        {
          title: "Smart bookings",
          desc: "Automatically schedules appointments and logs them directly into your calendar flawlessly.",
        },
      ],
    },
    chatDemo: {
      titleMain: "How",
      titleHighlight: "AI Buddy",
      titleSuffix: "works behind the scenes",
      description: "See how the system automatically handles inquiries, checks availability, and secures bookings without your presence.",
      steps: [
        {
          title: "1. Client sends a message",
          subtitle: "Instagram DM",
          content: "Hello! Do you have a free spot for the cottage this Saturday?",
          badge: "New message received"
        },
        {
          title: "2. AI Buddy processes query",
          subtitle: "Database & Availability",
          content: "Checking calendar... Saturday is available! Price is 250 KM.",
          badge: "AI analyzing database"
        },
        {
          title: "3. Automatic confirmation",
          subtitle: "Google Calendar & Telegram",
          content: "Slot successfully booked! Notification sent to owner's Telegram.",
          badge: "Completed automatically"
        }
      ],
      footerRealtime: "Real-time automation"
    },
    comparison: {
      title: "The difference that",
      titleHighlight: "brings profit",
      subtitle: "See what running a business looks like without a system versus having Buddy on your team.",
      oldBadge: "Old way (Without Buddy)",
      oldTitle: "Losing clients and nerves",
      old1: "Messages at 11 PM remain unread, the client gives up in the morning and goes to the competition.",
      old2: "Constantly typing the same price, location, and available slots a hundred times a day.",
      old3: "Double booking the same slot because someone forgot to write it down in a notebook or Excel.",
      old4: "Phone ringing constantly while you're in the field or resting with family.",
      newBadge: "New way (With AI Buddy)",
      newTitle: "Automated business 24/7",
      new1: "Instant reply in seconds, whether it's 3 AM or Saturday afternoon.",
      new2: "Buddy independently manages the conversation based on your knowledge base and price list.",
      new3: "Appointments are automatically booked in the calendar, and you receive a clean notification.",
      new4: "You have full control and free time for what truly matters.",
    },
    pricing: {
      titleMain: "Invest in your",
      titleHighlight: "DIGITAL WORKER",
      subtitle: "Quick setup and integration with your calendar in just 2 to 3 working days. Terms and scope are agreed upon directly.",
      popularBadge: "MOST POPULAR PLAN",
      priceModel: "Partnership model",
      priceValue: "Upon agreement",
      plans: [
        {
          name: "Starter Buddy",
          badge: "Small business / Freelancer",
          description: "Ideal for individuals and small businesses. Buddy takes over Instagram DM, independently negotiates slots, and logs them into your calendar.",
          features: [
            "Instagram DM and calendar integration",
            "24/7 automated inquiry and pricing replies",
            "Direct appointment booking without your intervention",
            "Real-time Telegram notifications for every booking",
            "Ready and launched in 2 to 3 working days",
            "Flexible agreement and advance start for development",
          ],
          buttonText: "Request Starter",
          popular: false,
          value: "Starter Buddy (Small business)",
        },
        {
          name: "Business Buddy",
          badge: "Medium business (2-3 employees)",
          description: "For salons, services, and multi-service businesses. A more powerful AI system that manages schedules and sends precise notifications to your team.",
          features: [
            "Advanced Instagram DM automation",
            "Smart database with all prices and services",
            "Team-wide calendar synchronization",
            "Telegram notifications and detailed booking overview",
            "Priority setup and configuration (2-3 days)",
            "Tailored terms and secure partnership agreement",
          ],
          buttonText: "Request Business",
          popular: true,
          value: "Business Buddy (Medium business)",
        },
        {
          name: "Pro System Buddy",
          badge: "Larger systems & enterprises",
          description: "Fully custom solution for higher work volumes, multiple channels, and specific business integrations with your internal tools.",
          features: [
            "Multi-channel AI support and custom integrations",
            "Advanced calendar and database connectivity",
            "Telegram notification system for the whole team",
            "Dedicated server for maximum speed and stability",
            "Long-term technical support and updates",
            "Individual offer and implementation terms",
          ],
          buttonText: "Request Custom Offer",
          popular: false,
          value: "Pro System Buddy (Enterprise)",
        },
      ],
    },
    faq: {
      title: "Frequently Asked Questions",
      items: [
        { 
          q: "How does AI Buddy learn about my business?", 
          a: "Your Buddy gets access to your price lists, services, and working hours. Based on that, it automatically replies to clients and coordinates schedules." 
        },
        { 
          q: "Do I have to reply to messages manually?", 
          a: "No. Buddy independently manages conversations in Instagram DMs, negotiates appointments, and logs them directly into your calendar without your intervention." 
        },
        { 
          q: "What happens when an appointment is booked?", 
          a: "When a client confirms the slot, Buddy logs it into the calendar, and a clean notification immediately arrives on your phone so you know the exact time." 
        },
        { 
          q: "How long does setup and launch take?", 
          a: "Complete setup, database training, and calendar integration take between 2 and 3 working days." 
        },
        { 
          q: "Are there any monthly fees or subscriptions?", 
          a: "No. Creating and setting up the system is a one-time investment, avoiding any monthly fees and complications." 
        },
      ],
    },
    footer: {
      rights: "All rights reserved. Developed for modern businesses.",
      features: "Features",
      pricing: "Pricing",
      privacy: "Privacy Policy",
    },
    privacy: {
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
    },
    cookie: {
      cookieTitle: "Cookie and Privacy Policy",
      cookieDesc: "We use minimal cookies for site functionality and analytics. Your contact form data is used exclusively for communication and agreements.",
      cookieBtn: "Accept",
    },
    contactModal: {
      modalTitle: "Hook up your Buddy",
      modalSubtitle: "Enter your details and our team will contact you shortly to set up the system.",
      successTitle: "Successfully sent!",
      successDesc: "Data has been saved and notification has been sent.",
      labelName: "Name or business name",
      placeholderName: "E.g. Beauty Salon Ana",
      labelPhone: "Phone number (WhatsApp/Viber)",
      placeholderPhone: "E.g. +387 61 123 456",
      labelEmail: "Email address (optional)",
      placeholderEmail: "E.g. info@business.com",
      labelPackage: "Select package",
      opt1: "Starter Buddy (Small business)",
      opt2: "Business Buddy (Medium business)",
      opt3: "Pro System Buddy (Enterprise)",
      opt4: "I just want to ask something",
      labelMessage: "Short message (optional)",
      placeholderMessage: "Write if you have any specific requests...",
      loadingBtn: "Sending...",
      submitBtn: "Send request to buddy",
    },
  },
};