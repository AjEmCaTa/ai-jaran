import HomeClient from "../components/home/HomeClient";
import { getCatalogBusinesses } from "../utils/catalogData";

// Početna odmah prikazuje firme i djelatnosti (isti podaci kao stranice firmi), osvježava se svakih 60 s.
export const revalidate = 60;

export default async function Home() {
  const businesses = await getCatalogBusinesses();
  return <HomeClient businesses={businesses || []} retry={!businesses} />;
}
