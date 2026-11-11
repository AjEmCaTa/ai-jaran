// Početni sadržaj automatskih nizova. Upisuje se u bazu samo ako niz još ne postoji,
// a nakon toga ga admin uređuje u panelu (i mora ga odobriti prije slanja).

export type SequenceAudience = 'trial' | 'lead';

export type DefaultStep = {
  delay_days: number;
  enabled: boolean;
  subject: string;
  preheader: string;
  heading: string;
  body: string;
  cta_label: string;
  cta_url: string;
  note?: string;
};

export type DefaultSequence = { key: string; name: string; description: string; audience: SequenceAudience; steps: DefaultStep[] };

export const AUDIENCE_INFO: Record<SequenceAudience, { label: string; who: string; reason: string }> = {
  trial: {
    label: 'Nove firme (30 dana besplatno)',
    who: 'Svaka firma koja se registruje na POSLO ONE. Niz staje kad firma plati paket ili kad prođe 30 dana.',
    reason: 'ste registrovali firmu na POSLO ONE',
  },
  lead: {
    label: 'Upiti sa sajta',
    who: 'Svako ko ostavi email u formi za upit na poslo.one. Niz staje čim registruje firmu.',
    reason: 'ste nam poslali upit na poslo.one',
  },
};

export const DEFAULT_SEQUENCES: DefaultSequence[] = [
  {
    key: 'trial_onboarding',
    name: 'Dobrodošlica za nove firme',
    description: 'Vodi novu firmu kroz prve korake i podsjeća je pred kraj besplatnog perioda.',
    audience: 'trial',
    steps: [
      {
        delay_days: 0,
        enabled: true,
        subject: '{{firma}} je na POSLO ONE, evo prva 3 koraka',
        preheader: 'Za 10 minuta možete primiti prvu online rezervaciju.',
        heading: 'Dobrodošli u POSLO ONE',
        body:
          'Pozdrav {{ime}},\n\nhvala što ste registrovali **{{firma}}**. Vaš panel je aktivan i prvih 30 dana je besplatno.\n\nDa vam klijenti počnu zakazivati sami, uradite ova tri koraka:\n- Dodajte usluge i cijene\n- Postavite radno vrijeme\n- Podijelite svoj link na Instagramu i WhatsAppu\n\nAko negdje zapne, samo odgovorite na ovaj mejl ili nazovite 060 30 50 153. Postavimo vam sve zajedno.',
        cta_label: 'Otvori moj panel',
        cta_url: 'https://poslo.one/dashboard',
      },
      {
        delay_days: 2,
        enabled: true,
        subject: 'Kako doći do prve online rezervacije',
        preheader: 'Jedan link u opisu profila radi umjesto vas.',
        heading: 'Vaš link radi 24 sata dnevno',
        body:
          'Pozdrav {{ime}},\n\nnajviše rezervacija dolazi kad je link vidljiv tamo gdje vas klijenti već traže:\n- U opisu Instagram profila\n- Kao automatski odgovor na WhatsApp poruke\n- U Google profilu firme\n\nKlijent otvori link, vidi slobodne termine i zakaže bez poziva. Vi dobijete obavijest.',
        cta_label: 'Kopiraj moj link',
        cta_url: 'https://poslo.one/dashboard',
      },
      {
        delay_days: 5,
        enabled: true,
        subject: 'Zalijepite ovo na vrata i klijenti zakazuju sami',
        preheader: 'Vaš QR poster je već spreman za print.',
        heading: 'QR poster za vašu radnju',
        body:
          'Pozdrav {{ime}},\n\nu panelu vas čeka gotov QR poster s nazivom {{firma}}. Odštampajte ga i stavite na vrata, pult ili ogledalo.\n\nKlijent skenira kamerom mobitela i odmah vidi slobodne termine, čak i kad ste zauzeti i ne možete se javiti na telefon.',
        cta_label: 'Preuzmi QR poster',
        cta_url: 'https://poslo.one/dashboard/qr-poster',
      },
      {
        delay_days: 10,
        enabled: true,
        subject: 'Više Google recenzija, bez moljenja',
        preheader: 'POSLO ONE može sam zamoliti klijenta za recenziju.',
        heading: 'Neka klijenti rade marketing za vas',
        body:
          'Pozdrav {{ime}},\n\ndvije stvari koje vlasnici najviše vole:\n- **Google recenzije:** kad označite termin kao završen, klijent dobije mejl s linkom za vašu recenziju.\n- **Povratak klijenata:** nakon par sedmica klijent dobije podsjetnik da zakaže ponovo.\n\nOboje uključite jednom u Podacima o firmi i radi samo.',
        cta_label: 'Uključi u panelu',
        cta_url: 'https://poslo.one/dashboard/settings',
      },
      {
        delay_days: 25,
        enabled: false,
        subject: 'Još 5 dana besplatnog perioda za {{firma}}',
        preheader: 'Izaberite paket da sve nastavi raditi bez prekida.',
        heading: 'Besplatni period se bliži kraju',
        body:
          'Pozdrav {{ime}},\n\nza 5 dana ističe vaših 30 dana besplatnog korištenja.\n\nDa vam link, rezervacije i podsjetnici nastave raditi, izaberite paket:\n- **Starter 15 KM mjesečno:** online zakazivanje, obavijesti i panel za termine\n- **Pro 50 KM mjesečno:** sve iz Startera, plus sami uređujete usluge, cijene, radno vrijeme i godišnji odmor\n\nPlaćanje je karticom, a otkazati možete u bilo kojem trenutku.',
        cta_label: 'Izaberi paket',
        cta_url: 'https://poslo.one/dashboard/paket',
        note: 'Uključite tek kad plaćanje karticom pređe na pravi (Live) način.',
      },
      {
        delay_days: 29,
        enabled: false,
        subject: 'Sutra ističe besplatni period',
        preheader: 'Jedan klik i {{firma}} nastavlja primati rezervacije.',
        heading: 'Sutra je zadnji besplatni dan',
        body:
          'Pozdrav {{ime}},\n\nsutra ističe besplatni period za {{firma}}. Izaberite paket i sve nastavlja raditi kao do sada, bez ikakvog podešavanja.\n\nAko vam treba više vremena ili imate pitanje, odgovorite na ovaj mejl.',
        cta_label: 'Izaberi paket',
        cta_url: 'https://poslo.one/dashboard/paket',
        note: 'Uključite tek kad plaćanje karticom pređe na pravi (Live) način.',
      },
    ],
  },
  {
    key: 'lead_followup',
    name: 'Praćenje upita sa sajta',
    description: 'Ljudima koji su ostavili upit pokazuje kako POSLO ONE radi i poziva ih da probaju.',
    audience: 'lead',
    steps: [
      {
        delay_days: 1,
        enabled: true,
        subject: 'Pogledajte kako POSLO ONE izgleda u praksi',
        preheader: 'Kratak demo: od linka do potvrđenog termina.',
        heading: 'Hvala na upitu',
        body:
          'Pozdrav {{ime}},\n\nhvala što ste se javili. Dok vam se ne javimo lično, pogledajte kako izgleda kad klijent zakazuje sam:\n- Otvori vaš link i vidi slobodne termine\n- Izabere uslugu i vrijeme\n- Vi dobijete obavijest, a klijent podsjetnik dan prije\n\nBez poziva, bez poruka i bez sveske.',
        cta_label: 'Pogledaj demo',
        cta_url: 'https://poslo.one/demo',
      },
      {
        delay_days: 3,
        enabled: true,
        subject: 'Probajte 30 dana besplatno, bez kartice',
        preheader: 'Registracija traje minut i panel se odmah otvori.',
        heading: 'Panel za jedan minut',
        body:
          'Pozdrav {{ime}},\n\nnajbrže ćete vidjeti da li vam POSLO ONE odgovara ako ga probate:\n- Registracija traje jedan minut\n- Panel se otvori odmah\n- Prvih 30 dana je besplatno, bez kartice\n\nAko želite, postavimo vam usluge i radno vrijeme zajedno, preko telefona.',
        cta_label: 'Registruj firmu',
        cta_url: 'https://poslo.one/registracija',
      },
      {
        delay_days: 7,
        enabled: true,
        subject: 'Imate li pitanje o POSLO ONE?',
        preheader: 'Odgovorite na ovaj mejl, javljamo se isti dan.',
        heading: 'Tu smo ako treba pomoć',
        body:
          'Pozdrav {{ime}},\n\nsamo da provjerim da li vam je nešto ostalo nejasno. Najčešća pitanja su:\n- Koliko košta? Starter je 15 KM, a Pro 50 KM mjesečno, uz 30 dana besplatno.\n- Moraju li klijenti instalirati aplikaciju? Ne, zakazuju preko obične stranice.\n- Ko postavlja sve? Možete sami za par minuta, ili mi umjesto vas.\n\nOdgovorite na ovaj mejl ili nazovite 060 30 50 153.',
        cta_label: 'Registruj firmu',
        cta_url: 'https://poslo.one/registracija',
      },
      {
        delay_days: 21,
        enabled: true,
        subject: 'Šta je novo u POSLO ONE',
        preheader: 'QR poster, Google recenzije i klijenti koji se vraćaju sami.',
        heading: 'Novo u POSLO ONE',
        body:
          'Pozdrav {{ime}},\n\nod vašeg upita dodali smo dosta toga:\n- **QR poster** za vrata ili pult\n- **Google recenzije** koje klijent ostavi nakon termina\n- **Podsjetnik za povratak** klijentima nakon par sedmica\n- **Neradni dani** kad idete na odmor\n\nSve to dobijate odmah, a prvih 30 dana je besplatno.',
        cta_label: 'Probaj besplatno',
        cta_url: 'https://poslo.one/registracija',
      },
    ],
  },
];
