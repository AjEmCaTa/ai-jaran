'use client';

import { useEffect, useRef, useState } from 'react';
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { canvasToPdf, drawPoster } from './posterPdf';
import { businessLogo } from '../../../utils/partnerLogos';
import { useBusiness } from '../_lib/business-context';
import Icon from '../_components/icons';
import { categoryLabel } from '../../../utils/catalog';

const LINK_KEY = 'poslo-booking-link';

type Variant = 'light' | 'dark';

const PRINT_CSS = `
@page { size: A4 portrait; margin: 0; }
@media print {
  html, body { background: #fff !important; }
  body * { visibility: hidden !important; }
  #qr-poster, #qr-poster * { visibility: visible !important; }
  #qr-poster { position: fixed !important; inset: 0 !important; width: 210mm !important; height: 297mm !important; max-width: none !important; margin: 0 !important; border-radius: 0 !important; box-shadow: none !important; transform: none !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`;

export default function QrPosterPage() {
  const { business } = useBusiness();
  const [variant, setVariant] = useState<Variant>('light');
  const [headline, setHeadline] = useState('Zakaži termin online');
  const [link, setLink] = useState('');
  const qrCanvas = useRef<HTMLCanvasElement>(null);
  const [pdf, setPdf] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    let saved = '';
    try {
      saved = window.localStorage.getItem(`${LINK_KEY}:${business.id}`) || '';
    } catch {
      /* privatni mod */
    }
    setLink(saved || (business.slug ? `${window.location.origin}/katalog/${business.slug}` : ''));
  }, [business.id, business.slug]);

  const dark = variant === 'dark';
  const shortLink = link.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const category = categoryLabel(business.category) || 'Online rezervacije';
  const logo = businessLogo(business.logo_url, business.slug);

  // PDF se pripremi unaprijed, da dugme odmah otvori dijeljenje (iPhone traži da se to desi odmah nakon dodira).
  useEffect(() => {
    if (!link) return;
    setPdf(null);
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        if (!qrCanvas.current) return;
        const canvas = await drawPoster({
          dark,
          logoUrl: logo,
          category,
          name: business.name || 'Vaša firma',
          city: business.city || '',
          headline,
          shortLink,
          qr: qrCanvas.current,
        });
        const blob = await canvasToPdf(canvas);
        if (!cancelled) setPdf(blob);
      } catch (err) {
        console.error('Poster PDF nije napravljen:', err);
      }
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [link, dark, headline, shortLink, category, logo, business.name, business.city]);

  const fileName = `qr-poster-${business.slug || 'poslo-one'}.pdf`;

  const download = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  const savePdf = async () => {
    if (!pdf) return;
    setNote('');
    const file = new File([pdf], fileName, { type: 'application/pdf' });
    const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
    if (nav.canShare?.({ files: [file] })) {
      try {
        setBusy(true);
        await navigator.share({ files: [file], title: 'QR poster' });
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
      } finally {
        setBusy(false);
      }
    }
    download(pdf);
    setNote('PDF je preuzet. Otvorite ga i odštampajte ili pošaljite u štampariju.');
  };

  return (
    <div className="mx-auto min-w-0 max-w-5xl space-y-5 pb-12">
      <style>{PRINT_CSS}</style>

      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">QR poster</h2>
        <p className="mt-1 text-sm text-slate-400">
          Odštampajte i zalijepite na vrata, pult ili ogledalo. Klijent skenira kamerom i odmah zakaže.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* POSTER (A4) */}
        <div className="flex justify-center rounded-[var(--po-radius)] border border-white/[0.07] bg-gray-900/70 p-4 sm:p-8">
          <div
            id="qr-poster"
            className="relative flex aspect-[210/297] w-full max-w-[460px] flex-col items-center justify-between overflow-hidden rounded-lg px-[9%] py-[10%] text-center shadow-2xl"
            style={{
              background: dark
                ? 'radial-gradient(80% 50% at 85% 0%, rgba(124,92,246,.35), transparent 70%), radial-gradient(80% 50% at 0% 100%, rgba(37,99,235,.35), transparent 70%), #05070f'
                : '#ffffff',
              color: dark ? '#f4f5f8' : '#0b0f1a',
            }}
          >
            <div className="w-full">
              {logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="" className="mx-auto mb-[5%] h-[clamp(48px,13vw,84px)] w-auto max-w-[70%] object-contain" />
              )}
              <p className="text-[clamp(9px,2.2vw,12px)] font-bold uppercase tracking-[0.3em]" style={{ color: dark ? '#a9bcff' : '#2563eb' }}>
                {categoryLabel(business.category) || 'Online rezervacije'}
              </p>
              <p className="mt-[4%] break-words font-display text-[clamp(26px,7vw,44px)] font-bold leading-[1.02] tracking-tight">
                {business.name || 'Vaša firma'}
              </p>
              {business.city && (
                <p className="mt-[2%] text-[clamp(10px,2.4vw,14px)]" style={{ color: dark ? '#98a1b5' : '#5b6475' }}>
                  {business.city}
                </p>
              )}
            </div>

            <div className="flex w-full flex-col items-center">
              <p className="font-display text-[clamp(18px,4.6vw,28px)] font-semibold tracking-tight">{headline}</p>
              <div
                className="mt-[6%] rounded-[8%] p-[5%]"
                style={{ background: '#ffffff', border: dark ? 'none' : '2px solid #e5e7ef', width: '64%' }}
              >
                {link ? (
                  <QRCodeSVG value={link} size={512} marginSize={0} bgColor="#ffffff" fgColor="#0b0f1a" level="M" style={{ width: '100%', height: 'auto', display: 'block' }} />
                ) : (
                  <div className="aspect-square w-full animate-pulse rounded bg-gray-200" />
                )}
              </div>
              <p className="mt-[5%] text-[clamp(10px,2.4vw,14px)] font-semibold" style={{ color: dark ? '#cbd2e0' : '#374151' }}>
                Skeniraj kamerom mobitela
              </p>
              <p className="mt-[1.5%] max-w-full break-all text-[clamp(8px,2vw,11px)]" style={{ color: dark ? '#7d869b' : '#6b7280' }}>
                {shortLink}
              </p>
            </div>

            <div className="flex w-full items-center justify-center gap-2 text-[clamp(8px,1.9vw,11px)] font-semibold tracking-wide" style={{ color: dark ? '#7d869b' : '#9ca3af' }}>
              <span>Bez poziva</span>
              <span aria-hidden="true">·</span>
              <span>Slobodni termini uživo</span>
              <span aria-hidden="true">·</span>
              <span>POSLO ONE</span>
            </div>
          </div>
        </div>

        {/* POSTAVKE POSTERA */}
        <div className="space-y-4 rounded-[var(--po-radius)] border border-white/[0.07] bg-gray-900/70 p-[var(--po-pad)]">
          <div>
            <p className="mb-2 text-xs font-medium text-slate-300">Stil</p>
            <div className="flex rounded-full border border-white/10 p-0.5 text-xs">
              {(['light', 'dark'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVariant(v)}
                  aria-pressed={variant === v}
                  className={`flex-1 rounded-full px-3 py-1.5 font-medium transition ${variant === v ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  {v === 'light' ? 'Svijetli (štedi boju)' : 'Tamni'}
                </button>
              ))}
            </div>
          </div>

          <label className="block text-xs font-medium text-slate-300">
            Glavni natpis
            <input
              type="text"
              maxLength={40}
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="mt-2 w-full rounded-[calc(var(--po-radius)*0.6)] border border-gray-700 bg-gray-950 px-3 py-2.5 text-base text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 sm:text-sm"
            />
          </label>

          <div className="rounded-lg bg-white/[0.03] p-3 text-xs text-slate-400">
            QR vodi na: <span className="break-all text-slate-200">{shortLink || 'link se učitava...'}</span>
            <p className="mt-1">Link mijenjate na kontrolnoj ploči u kartici „Link za rezervacije”.</p>
          </div>

          <button
            type="button"
            onClick={savePdf}
            disabled={!pdf || busy}
            className="flex w-full items-center justify-center gap-2 rounded-[calc(var(--po-radius)*0.7)] bg-blue-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:opacity-50"
          >
            <Icon name="download" className="h-4 w-4" />
            {pdf ? 'Sačuvaj ili štampaj PDF' : 'Pripremam PDF...'}
          </button>
          {note && <p role="status" className="text-xs text-emerald-300">{note}</p>}
          <p className="text-[11px] leading-relaxed text-slate-500">
            Na telefonu se otvori meni za dijeljenje: izaberite Štampaj, Sačuvaj u Fajlove ili pošaljite PDF u štampariju. Poster je A4.
          </p>
          <button
            type="button"
            onClick={() => window.print()}
            disabled={!link}
            className="hidden w-full text-center text-xs font-medium text-slate-400 underline-offset-4 hover:text-white hover:underline disabled:opacity-50 lg:block"
          >
            Štampaj direktno sa računara
          </button>
          {/* Skriveni QR u visokoj rezoluciji za PDF */}
          {link && (
            <div aria-hidden="true" className="hidden">
              <QRCodeCanvas ref={qrCanvas} value={link} size={1024} marginSize={0} bgColor="#ffffff" fgColor="#0b0f1a" level="M" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
