import type { NextConfig } from "next";

// Zaštitna zaglavlja za sve odgovore. HSTS (HTTPS-only) već postavlja Vercel.
// Content-Security-Policy se namjerno uvodi zasebno (Google Analytics i inline skripte traže pažljivo testiranje).
const securityHeaders = [
  // Preglednik ne "pogađa" tip datoteke (blokira napade s podmetnutim sadržajem).
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Stranicu ne mogu ugraditi tuđi sajtovi (zaštita od "clickjackinga").
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Ne otkriva pune adrese stranica drugim sajtovima.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Isključuje funkcije uređaja koje aplikacija ne koristi.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false, // ne otkriva da je sajt rađen u Next.js
  // Stari linkovi firmi (prije skraćivanja) i dalje vode na istu firmu.
  async redirects() {
    // Produkcija ima i automatske *.vercel.app adrese (npr. posloone-git-main-...). Sve takve posjete
    // šaljemo na glavnu domenu poslo.one, da prijava, Google i kolačići uvijek rade na jednom mjestu.
    // Preview verzije (VERCEL_ENV=preview) i /api (cron, webhookovi) se NE preusmjeravaju.
    const toMainDomain = process.env.VERCEL_ENV === 'production'
      ? [{ source: '/:path((?!api/|_next/).*)', has: [{ type: 'host' as const, value: '(?<host>.+\\.vercel\\.app)' }], destination: 'https://poslo.one/:path*', permanent: false }]
      : [];
    return [
      ...toMainDomain,
      { source: "/katalog/apartman-stone-mostar-2629", destination: "/katalog/apartman-stone-mostar", permanent: true },
      { source: "/katalog/gradnja-mostar", destination: "/katalog/binor-gradnja", permanent: true },
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
