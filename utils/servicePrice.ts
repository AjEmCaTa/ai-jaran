export const PRICE_ON_REQUEST_LABEL = 'Na upit';

export type ServicePriceFields = { price: number | null; price_on_request: boolean };

// Fiksna cijena traži broj >= 0; "Na upit" ne traži cijenu (čuva se null).
export function parseServicePrice(body: Record<string, unknown>): ServicePriceFields | null {
  if (body.price_on_request === true) return { price: null, price_on_request: true };
  if (body.price_on_request != null && body.price_on_request !== false) return null;
  if (body.price == null || (typeof body.price === 'string' && !body.price.trim())) return null;
  const price = Number(typeof body.price === 'string' ? body.price.replace(',', '.') : body.price);
  if (!Number.isFinite(price) || price < 0) return null;
  return { price, price_on_request: false };
}

export function formatServicePrice(service: { price?: number | string | null; price_on_request?: boolean | null }): string {
  if (service.price_on_request) return PRICE_ON_REQUEST_LABEL;
  if (service.price == null || service.price === '') return '';
  const price = Number(service.price);
  return Number.isFinite(price) ? `${price.toLocaleString('bs-BA')} KM` : '';
}
