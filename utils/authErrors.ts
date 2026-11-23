// Supabase vraća greške na engleskom; korisniku prikazujemo jasnu poruku na njegovom jeziku.
type Lang = 'bs' | 'en';

const RULES: { match: RegExp; bs: string; en: string }[] = [
  {
    match: /invalid login credentials/i,
    bs: 'Pogrešan e-mail ili lozinka. Ako ste se registrovali preko Googlea, kliknite „Nastavi s Googleom”. Lozinku možete i obnoviti preko „Zaboravili ste lozinku?”.',
    en: 'Wrong email or password. If you signed up with Google, use “Continue with Google”. You can also reset your password via “Forgot password?”.',
  },
  {
    match: /already registered|already been registered|user already exists/i,
    bs: 'Ovaj e-mail već ima nalog. Prijavite se, ili kliknite „Nastavi s Googleom” ako ste se tako registrovali.',
    en: 'This email already has an account. Log in, or use “Continue with Google” if you signed up that way.',
  },
  {
    match: /email not confirmed/i,
    bs: 'E-mail još nije potvrđen. Otvorite link koji smo vam poslali na e-mail, pa se prijavite.',
    en: 'Your email is not confirmed yet. Open the link we sent you, then log in.',
  },
  {
    match: /password should be at least|password is too short|weak password/i,
    bs: 'Lozinka mora imati najmanje 6 znakova.',
    en: 'The password must have at least 6 characters.',
  },
  {
    match: /same password|different from the old/i,
    bs: 'Nova lozinka mora biti drugačija od stare.',
    en: 'The new password must be different from the old one.',
  },
  {
    match: /rate limit|too many|for security purposes/i,
    bs: 'Previše pokušaja. Sačekajte minut pa pokušajte ponovo.',
    en: 'Too many attempts. Wait a minute and try again.',
  },
  {
    match: /invalid format|valid email|unable to validate email/i,
    bs: 'E-mail adresa nije ispravna.',
    en: 'The email address is not valid.',
  },
  {
    match: /expired|invalid.*(token|link)|otp/i,
    bs: 'Link je istekao ili je već iskorišten. Zatražite novi.',
    en: 'The link has expired or was already used. Request a new one.',
  },
  {
    match: /failed to fetch|network|load failed/i,
    bs: 'Nema veze sa serverom. Provjerite internet i pokušajte ponovo.',
    en: 'Could not reach the server. Check your internet and try again.',
  },
];

export function authErrorText(err: unknown, lang: Lang, fallback: string) {
  const msg = err instanceof Error ? err.message : typeof err === 'string' ? err : '';
  const rule = RULES.find((r) => r.match.test(msg));
  return rule ? rule[lang] : fallback;
}
