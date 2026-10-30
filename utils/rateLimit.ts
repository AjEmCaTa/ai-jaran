import type { NextRequest } from 'next/server';

// Ograničenje broja zahtjeva po IP adresi (klizni prozor, u memoriji instance).
// Napomena: serverless instance su međusobno odvojene, pa ovo je prva linija odbrane protiv zloupotrebe
// (spam formi, brute-force). Jači, zajednički limit postavlja se u Vercel Firewall-u.

type Bucket = { hits: number[] };
const buckets = new Map<string, Bucket>();
const MAX_KEYS = 5000;

export function clientIp(request: Pick<NextRequest, 'headers'>): string {
  const fwd = request.headers.get('x-forwarded-for');
  const ip = (fwd ? fwd.split(',')[0] : request.headers.get('x-real-ip') || '').trim();
  return ip || 'unknown';
}

export type RateResult = { allowed: boolean; retryAfterSec: number };

export function checkRateLimit(key: string, limit: number, windowMs: number, now: number = Date.now()): RateResult {
  const bucket = buckets.get(key) || { hits: [] };
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);
  if (bucket.hits.length >= limit) {
    const retryAfterSec = Math.max(1, Math.ceil((bucket.hits[0] + windowMs - now) / 1000));
    buckets.set(key, bucket);
    return { allowed: false, retryAfterSec };
  }
  bucket.hits.push(now);
  buckets.set(key, bucket);
  if (buckets.size > MAX_KEYS) {
    // Čišćenje starih ključeva da memorija ne raste bez granice.
    for (const [k, b] of buckets) {
      if (b.hits.length === 0 || now - b.hits[b.hits.length - 1] >= windowMs) buckets.delete(k);
      if (buckets.size <= MAX_KEYS / 2) break;
    }
  }
  return { allowed: true, retryAfterSec: 0 };
}

export function resetRateLimits() {
  buckets.clear();
}
