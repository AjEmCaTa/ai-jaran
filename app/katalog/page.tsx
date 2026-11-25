import { redirect } from 'next/navigation';

// Katalog je sada na početnoj (djelatnosti i firme). Stara adresa vodi tamo.
// Stranice firmi i kategorija (/katalog/<slug>) ostaju iste: na njih vode QR posteri i linkovi firmi.
export default function KatalogPage() {
  redirect('/#djelatnosti');
}
