// Kategorije kataloga i raspoređivanje firmi u njih. Firma ima slobodno upisanu djelatnost
// (stari zapisi) ili slug kategorije (novi zapisi); oboje se ovdje mapira na kategoriju.

export type CatalogCategory = {
  slug: string;
  title: string;
  short: string;
  description: string;
  icon: 'car' | 'sun' | 'home' | 'sparkles' | 'scissors' | 'building' | 'ball' | 'heart';
  image: string;
  keywords: string[];
  en: { title: string; short: string; description: string };
};

export const CATALOG_CATEGORIES: CatalogCategory[] = [
  {
    slug: 'beauty-saloni',
    title: 'Frizeri i Beauty Saloni',
    short: 'Frizer / beauty salon',
    description: 'Zakazivanje termina za šišanje, njegu lica, tretmane i kozmetičke usluge bez gužve na telefonu.',
    icon: 'scissors',
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
    keywords: ['frizer', 'beauty', 'salon', 'kozmet', 'nokt', 'barber', 'brij', 'šminka', 'sminka', 'masaž', 'masaz', 'trepav'],
    en: { title: 'Hairdressers & Beauty Salons', short: 'Hairdresser / beauty salon', description: 'Book haircuts, facials, treatments and beauty services without phone hassle.' },
  },
  {
    slug: 'dubinsko-ciscenje',
    title: 'Dubinsko čišćenje i Autopraonice',
    short: 'Dubinsko čišćenje / autopraonica',
    description: 'Dubinsko pranje, autopraonice, detailing i keramička zaštita uz automatsko vođenje termina.',
    icon: 'car',
    image: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=800&q=80',
    keywords: ['dubinsk', 'autopraon', 'praonica', 'detailing', 'auto ', 'vozil', 'pranje'],
    en: { title: 'Deep Cleaning & Car Washes', short: 'Deep cleaning / car wash', description: 'Deep cleaning, car washes, detailing and ceramic coating with automatic scheduling.' },
  },
  {
    slug: 'solarni-sistemi',
    title: 'Solarni sistemi i elektroinstalacije',
    short: 'Solarni sistemi / elektro',
    description: 'Solarne elektrane, elektroinstalacije i energetska rješenja: pregled usluga i slanje upita.',
    icon: 'sun',
    image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=800&q=80',
    keywords: ['solar', 'elektro', 'energet', 'instalac'],
    en: { title: 'Solar Systems & Electrical', short: 'Solar systems / electrical', description: 'Solar power plants, electrical installations and energy solutions: browse services and send an inquiry.' },
  },
  {
    slug: 'agencije-za-ciscenje',
    title: 'Agencije za čišćenje',
    short: 'Čišćenje stanova i prostora',
    description: 'Raspored čišćenja stambenih i poslovnih objekata, redovno ili generalno čišćenje.',
    icon: 'sparkles',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80',
    keywords: ['čišćenj', 'ciscenj', 'cistac', 'čistač', 'higijen'],
    en: { title: 'Cleaning Agencies', short: 'Home and office cleaning', description: 'Scheduling for residential and business cleaning, regular or deep cleaning.' },
  },
  {
    slug: 'vile-apartmani',
    title: 'Vile i Apartmani',
    short: 'Apartmani / smještaj',
    description: 'Rezervacije noćenja i upiti gostiju na jednom mjestu.',
    icon: 'home',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
    keywords: ['apartman', 'vila', 'smještaj', 'smjestaj', 'noćenj', 'nocenj', 'hostel', 'hotel'],
    en: { title: 'Villas & Apartments', short: 'Apartments / accommodation', description: 'Overnight stays and guest inquiries in one place.' },
  },
  {
    slug: 'sport-i-rekreacija',
    title: 'Sport i rekreacija',
    short: 'Sportski tereni / rekreacija',
    description: 'Mali fudbal, padel, tenis i drugi tereni: izaberi slobodan termin i rezerviši bez poziva.',
    icon: 'ball',
    image: 'https://images.unsplash.com/photo-1630420598913-44208d36f9af?auto=format&fit=crop&w=800&q=80',
    keywords: ['teren', 'fudbal', 'futsal', 'padel', 'tenis', 'sportsk', 'rekreac', 'balon', 'kuglan', 'bowling', 'squash', 'košark', 'kosark'],
    en: { title: 'Sports & Recreation', short: 'Sports courts / recreation', description: 'Five-a-side football, padel, tennis and other courts: pick a free slot and book without calling.' },
  },
  {
    slug: 'zdravlje-i-terapije',
    title: 'Zdravlje i terapije',
    short: 'Fizioterapija / zdravlje',
    description: 'Fizioterapija, stomatolozi, psiholozi, nutricionisti i terapije: zakazivanje pregleda i tretmana.',
    icon: 'heart',
    image: 'https://images.unsplash.com/photo-1768507423533-b87b62769758?auto=format&fit=crop&w=800&q=80',
    keywords: ['fizio', 'terap', 'stomatol', 'zubar', 'dental', 'dentist', 'ordinac', 'klinik', 'psiholog', 'nutricion', 'logoped', 'ortoped', 'kiropr', 'rehabil'],
    en: { title: 'Health & Therapy', short: 'Physiotherapy / health', description: 'Physiotherapy, dentists, psychologists, nutritionists and therapies: book check-ups and treatments.' },
  },
  {
    slug: 'ostale-usluge',
    title: 'Ostale usluge',
    short: 'Ostalo',
    description: 'Servisi, radionice, savjetovanja i sve ostale firme koje rade po terminima.',
    icon: 'building',
    image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=80',
    keywords: [],
    en: { title: 'Other Services', short: 'Other', description: 'Repair shops, workshops, consulting and any other business that works by appointment.' },
  },
];

export const categoryBySlug = (slug: string) => CATALOG_CATEGORIES.find((c) => c.slug === slug);

// Slug kategorije za upisanu djelatnost; nepoznato ide u "Ostale usluge".
export function categoryOf(value: unknown): string {
  const raw = String(value ?? '').trim().toLocaleLowerCase('bs');
  if (!raw) return 'ostale-usluge';
  const direct = CATALOG_CATEGORIES.find((c) => c.slug === raw || c.title.toLocaleLowerCase('bs') === raw);
  if (direct) return direct.slug;
  const byKeyword = CATALOG_CATEGORIES.find((c) => c.keywords.some((k) => raw.includes(k)));
  return byKeyword ? byKeyword.slug : 'ostale-usluge';
}

export const categoryLabel = (value: unknown, lang: 'bs' | 'en' = 'bs') => {
  const raw = String(value ?? '').trim();
  const known = categoryBySlug(raw);
  return known ? (lang === 'en' ? known.en.short : known.short) : raw;
};

// Naslov, kratki naziv i opis kategorije na izabranom jeziku.
export const categoryText = (cat: CatalogCategory, lang: 'bs' | 'en') =>
  lang === 'en' ? cat.en : { title: cat.title, short: cat.short, description: cat.description };
