import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import SiteShell from "../components/site/SiteShell";

export const metadata: Metadata = {
  metadataBase: new URL("https://poslo.one"),
  title: "POSLO ONE – online zakazivanje termina za male firme",
  description:
    "POSLO ONE – online zakazivanje termina za male firme u BiH. Klijenti zakazuju sami, ti dobiješ obavijest. 30 dana besplatno.",
  manifest: "/manifest.json",
  openGraph: {
    title: "POSLO ONE – online zakazivanje termina za male firme",
    description: "Klijenti zakazuju sami, a ti dobiješ obavijest. Za frizere, salone, auto-praonice, apartmane i druge male firme u BiH. 30 dana besplatno.",
    url: "https://poslo.one",
    siteName: "POSLO ONE",
    locale: "bs_BA",
    type: "website",
    images: [{ url: "/poslo.one.png", width: 1254, height: 1254, alt: "POSLO ONE" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "POSLO ONE",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#030712",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="bs"
      data-scroll-behavior="smooth"
      className="antialiased"
      suppressHydrationWarning
    >
      <head>
        {/* Ako je izabran engleski, sakrij sadržaj na tren dok se tekst ne prebaci (bez bljeska bosanskog). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var l=localStorage.getItem('poslo_one_lang');if(l!=='bs'&&l!=='en'){var n=((navigator.languages&&navigator.languages[0])||navigator.language||'').slice(0,2).toLowerCase();l=(n===''||['bs','hr','sr','sh','sl','mk','me','cn'].indexOf(n)>=0)?'bs':'en'}if(l==='en'){var d=document.documentElement;d.classList.add('lang-pending');d.lang='en';setTimeout(function(){d.classList.remove('lang-pending')},1500)}}catch(e){}`,
          }}
        />
        {/* Aplikacija (Play Store / instalirana): html.app-mode prije prvog prikaza, bez treptaja. Web stranica ostaje ista. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var d=document.documentElement,ss=window.sessionStorage,a=ss.getItem('poslo_app')==='1'||/[?&]source=(pwa|twa)/.test(location.search)||location.pathname==='/app'||document.referrer.indexOf('android-app://')===0||(window.matchMedia&&(matchMedia('(display-mode: standalone)').matches||matchMedia('(display-mode: fullscreen)').matches));if(a){ss.setItem('poslo_app','1');d.classList.add('app-mode')}}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-screen bg-[#030712] text-white">
        <SiteShell>{children}</SiteShell>

        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-SSML2RS1LZ"
          strategy="afterInteractive"
        />

        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-SSML2RS1LZ');
          `}
        </Script>

        {/* Service Worker */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.log('SW registration failed: ', err);
                  });
                });
              }
            `,
          }}
        />
        {/* Vercel Web Analytics (radi kad je uključen u Vercel projektu) */}
        <Script src="/_vercel/insights/script.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}