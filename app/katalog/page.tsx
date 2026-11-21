import KatalogClient from './KatalogClient';
import { getCatalogBusinesses } from '../../utils/catalogData';

// Katalog se sastavi na serveru (osvježava se svakih 60 s), pa stranica stiže gotova.
export const revalidate = 60;

export default async function KatalogPage() {
  const businesses = (await getCatalogBusinesses()) || [];
  return <KatalogClient businesses={businesses} />;
}
