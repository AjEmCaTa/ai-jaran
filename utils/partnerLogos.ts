// Logotipi firmi po slug-u. Fajl mora postojati u public/partners/ prije nego što se
// putanja ovdje upiše; PartnerLogo ima fallback (inicijali) ako se slika ne učita.
export const PARTNER_LOGOS: Record<string, string> = {
  'dubinsko-catic': '/partners/dubinsko-catic.jpg',
  'sun-solution-mostar': '/partners/sun-solution.jpg',
};

export function partnerInitials(name: string) {
  const words = name
    .replace(/\bd\.?\s?o\.?\s?o\.?\b/gi, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return (words[0] || 'PO').slice(0, 2).toUpperCase();
}
