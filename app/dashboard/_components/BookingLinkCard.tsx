'use client';

import { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Icon from './icons';

const btn =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-[calc(var(--po-radius)*0.7)] border border-white/10 bg-white/[0.04] px-3.5 text-sm font-medium text-slate-200 transition hover:border-blue-500/40 hover:bg-white/[0.07]';

export default function BookingLinkCard({
  link,
  onSave,
  className = '',
}: {
  link: string;
  onSave: (link: string) => void;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);
  const isEditing = editing || !link;

  const save = () => {
    let value = draft.trim();
    if (!value) return;
    if (!/^https?:\/\//i.test(value)) value = `https://${value}`;
    onSave(value);
    setEditing(false);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard nije dostupan */
    }
  };

  const downloadQr = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'poslo-qr-kod.svg';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section
      className={`min-w-0 rounded-[var(--po-radius)] border border-white/[0.07] bg-gray-900/70 p-[var(--po-pad)] backdrop-blur ${className}`}
      aria-label="Link za rezervacije"
    >
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
          <Icon name="link" className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-white">Link za rezervacije</h3>
          <p className="mt-0.5 text-xs text-slate-400">
            Podijelite ga na Instagramu i WhatsAppu ili odštampajte QR kod za radnju.
          </p>
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <label className="block text-xs font-medium text-slate-300">
            Zalijepite link na kojem klijenti zakazuju termin
            <input
              type="url"
              inputMode="url"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && save()}
              placeholder="https://poslo.one/..."
              className="mt-2 w-full rounded-[calc(var(--po-radius)*0.6)] border border-gray-700 bg-gray-950 px-3 py-2.5 text-base text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 sm:text-sm"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={save}
              disabled={!draft.trim()}
              className="rounded-[calc(var(--po-radius)*0.7)] bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:opacity-50"
            >
              Sačuvaj link
            </button>
            {link && (
              <button type="button" onClick={() => setEditing(false)} className={btn}>
                Odustani
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="truncate rounded-[calc(var(--po-radius)*0.6)] border border-white/10 bg-gray-950/70 px-3 py-2.5 text-sm text-blue-300">
            {link}
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={copy} className={btn}>
              <Icon name={copied ? 'check' : 'copy'} className="h-4 w-4 text-blue-400" />
              {copied ? 'Kopirano' : 'Kopiraj'}
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Zakažite termin online: ${link}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={btn}
            >
              <Icon name="message" className="h-4 w-4 text-emerald-400" />
              WhatsApp
            </a>
            <button type="button" onClick={() => setShowQr((v) => !v)} aria-expanded={showQr} className={btn}>
              <Icon name="qr" className="h-4 w-4 text-blue-400" />
              {showQr ? 'Sakrij QR' : 'QR kod'}
            </button>
            <button
              type="button"
              onClick={() => {
                setDraft(link);
                setEditing(true);
              }}
              className="px-2 text-xs font-medium text-slate-400 underline-offset-4 hover:text-white hover:underline"
            >
              Promijeni link
            </button>
          </div>

          {showQr && (
            <div className="flex flex-wrap items-center gap-4">
              <div ref={qrRef} className="rounded-xl bg-white p-2">
                <QRCodeSVG value={link} size={168} marginSize={1} bgColor="#ffffff" fgColor="#0a0e18" />
              </div>
              <div className="space-y-2">
                <p className="max-w-[16rem] text-xs text-slate-400">
                  Odštampajte ga i stavite na izlog, vizit-kartu ili račun. Klijent skenira telefonom i odmah zakazuje.
                </p>
                <button type="button" onClick={downloadQr} className={btn}>
                  Preuzmi QR (SVG)
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}