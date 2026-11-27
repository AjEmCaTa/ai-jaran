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
      // Tamna pozadina od prvog bajta: na sporim telefonima nema bijelog ekrana dok se CSS ne učita.
      style={{ backgroundColor: "#030712" }}
      suppressHydrationWarning
    >
      <head>
        {/* Ako je izabran engleski, sakrij sadržaj na tren dok se tekst ne prebaci (bez bljeska bosanskog). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var l=localStorage.getItem('poslo_one_lang');if(l!=='bs'&&l!=='en'){var n=((navigator.languages&&navigator.languages[0])||navigator.language||'').slice(0,2).toLowerCase();l=(n===''||['bs','hr','sr','sh','sl','mk','me','cn'].indexOf(n)>=0)?'bs':'en'}if(l==='en'){var d=document.documentElement;d.classList.add('lang-pending');d.lang='en';setTimeout(function(){d.classList.remove('lang-pending')},1500)}}catch(e){}`,
          }}
        />
        {/* Prije prvog prikaza: html.app-ui = izgled aplikacije (telefon ili instalirana), html.app-mode = instalirana aplikacija (obavezna prijava, bez kupovine). Računar ostaje stara stranica. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{(function(){var d=document.documentElement,ss=window.sessionStorage,mm=window.matchMedia,c=d.classList;function inst(){return ss.getItem('poslo_app')==='1'||/[?&]source=(pwa|twa)/.test(location.search)||location.pathname==='/app'||document.referrer.indexOf('android-app://')===0||(!!mm&&(mm('(display-mode: standalone)').matches||mm('(display-mode: fullscreen)').matches))}function apply(){var e=document.documentElement;c=e.classList;if(inst()){ss.setItem('poslo_app','1');if(!c.contains('app-mode'))c.add('app-mode');if(!c.contains('app-ui'))c.add('app-ui')}else if(mm){var w=mm('(max-width: 1023px)').matches;if(w!==c.contains('app-ui'))c.toggle('app-ui',w)}}window.__posloApplyMode=apply;apply();if(mm){var q=mm('(max-width: 1023px)');q.addEventListener&&q.addEventListener('change',apply)}if(window.MutationObserver)new MutationObserver(apply).observe(d,{attributes:true,attributeFilter:['class']});var nb;window.addEventListener('popstate',function(){document.documentElement.classList.add('nav-back');clearTimeout(nb);nb=setTimeout(function(){document.documentElement.classList.remove('nav-back')},900)})})()}catch(e){}`,
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