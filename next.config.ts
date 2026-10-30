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
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
