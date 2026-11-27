import type { MetadataRoute } from 'next';

// Javne stranice su otvorene za pretraživače; paneli, prijave i API nisu.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard', '/master-panel', '/nalog', '/prijava', '/promijeni-lozinku', '/nova-lozinka', '/zaboravljena-lozinka', '/odjava', '/app', '/profil'],
      },
    ],
    sitemap: 'https://poslo.one/sitemap.xml',
  };
}
