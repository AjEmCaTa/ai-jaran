// Čista logika registracije biznisa (bez vanjskih importa, testabilna s `node --test`).
// Server sam određuje status ('pending'), business_id i vezu profila; klijent to nikad ne šalje.

export type RegistrationInput = {
  ownerName: string;
  businessName: string;
  email: string;
  password: string;
  phone: string | null;
  city: string | null;
  category: string | null;
};

export type RegistrationResult =
  | { ok: true; value: RegistrationInput }
  | { ok: false; error: string };

export const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[čć]/g, 'c')
    .replace(/š/g, 's')
    .replace(/ž/g, 'z')
    .replace(/đ/g, 'dj')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(value: unknown, min: number, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.replace(/[\u0000-\u001F\u007F]+/g, ' ').trim();
  return trimmed.length >= min && trimmed.length <= max ? trimmed : null;
}

function optionalText(value: unknown, max: number): string | null | undefined {
  if (value === undefined || value === null || value === '') return null;
  const parsed = text(value, 1, max);
  return parsed === null ? undefined : parsed;
}

export function parseRegistration(body: unknown): RegistrationResult {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Zahtjev nije važeći.' };
  const b = body as Record<string, unknown>;

  const ownerName = text(b.ownerName, 2, 80);
  if (!ownerName) return { ok: false, error: 'Unesite ime i prezime.' };

  const businessName = text(b.businessName, 2, 100);
  if (!businessName || !slugify(businessName)) return { ok: false, error: 'Unesite naziv biznisa.' };

  const email = typeof b.email === 'string' ? b.email.trim().toLowerCase() : '';
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) return { ok: false, error: 'Unesite ispravnu email adresu.' };

  const password = typeof b.password === 'string' ? b.password : '';
  if (password.length < 6 || password.length > 72) return { ok: false, error: 'Lozinka mora imati između 6 i 72 znaka.' };

  const phone = optionalText(b.phone, 30);
  const city = optionalText(b.city, 80);
  const category = optionalText(b.category, 80);
  if (phone === undefined || city === undefined || category === undefined) {
    return { ok: false, error: 'Provjerite telefon, grad i djelatnost.' };
  }

  return { ok: true, value: { ownerName, businessName, email, password, phone, city, category } };
}

// Jedinstveni slug: osnova + nasumični sufiks (kao i ranije), s ponovnim pokušajem kod kolizije.
export function buildSlug(businessName: string, random: () => number = Math.random) {
  const base = slugify(businessName).slice(0, 60) || 'biznis';
  return base + '-' + Math.floor(random() * 10000);
}
