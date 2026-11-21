// Crta QR poster na canvas (A4, 150 dpi) i pakuje ga u PDF, bez dodatnih biblioteka.
// Razlog: window.print() ne radi u aplikaciji dodanoj na početni ekran iPhonea.

export type PosterInput = {
  dark: boolean;
  logoUrl: string;
  category: string;
  name: string;
  city: string;
  headline: string;
  shortLink: string;
  qr: HTMLCanvasElement;
};

const W = 1240;
const H = 1754;
const DISPLAY = '"Bricolage Grotesque", "Manrope", system-ui, sans-serif';
const SANS = '"Manrope", system-ui, -apple-system, sans-serif';

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth || !line) line = next;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function spaced(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, spacing: number) {
  // Razmak između slova (ručno, jer letterSpacing ne radi u svim preglednicima).
  const chars = [...text];
  const total = chars.reduce((sum, c) => sum + ctx.measureText(c).width, 0) + spacing * (chars.length - 1);
  let cx = x - total / 2;
  ctx.textAlign = 'left';
  for (const c of chars) {
    ctx.fillText(c, cx, y);
    cx += ctx.measureText(c).width + spacing;
  }
  ctx.textAlign = 'center';
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export async function drawPoster(input: PosterInput): Promise<HTMLCanvasElement> {
  if (document.fonts?.ready) await document.fonts.ready.catch(() => undefined);
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas nije dostupan.');

  const { dark } = input;
  // Pozadina
  ctx.fillStyle = dark ? '#05070f' : '#ffffff';
  ctx.fillRect(0, 0, W, H);
  if (dark) {
    const g1 = ctx.createRadialGradient(W * 0.85, 0, 0, W * 0.85, 0, W * 0.8);
    g1.addColorStop(0, 'rgba(124,92,246,0.35)');
    g1.addColorStop(1, 'rgba(124,92,246,0)');
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, W, H);
    const g2 = ctx.createRadialGradient(0, H, 0, 0, H, W * 0.8);
    g2.addColorStop(0, 'rgba(37,99,235,0.35)');
    g2.addColorStop(1, 'rgba(37,99,235,0)');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, W, H);
  }

  const cx = W / 2;
  const contentW = W * 0.82;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // GORE: logo, djelatnost, naziv, grad
  let y = H * 0.09;
  const logo = input.logoUrl ? await loadImage(input.logoUrl) : null;
  if (logo && logo.naturalWidth > 0) {
    const lh = 170;
    const lw = Math.min(contentW * 0.7, (logo.naturalWidth / logo.naturalHeight) * lh);
    const realH = (logo.naturalHeight / logo.naturalWidth) * lw;
    ctx.drawImage(logo, cx - lw / 2, y, lw, realH);
    y += realH + 50;
  }
  ctx.fillStyle = dark ? '#a9bcff' : '#2563eb';
  ctx.font = `700 30px ${SANS}`;
  y += 30;
  spaced(ctx, input.category.toUpperCase(), cx, y, 9);

  ctx.fillStyle = dark ? '#f4f5f8' : '#0b0f1a';
  let nameSize = 118;
  ctx.font = `700 ${nameSize}px ${DISPLAY}`;
  let nameLines = wrap(ctx, input.name, contentW);
  while (nameLines.length > 3 && nameSize > 70) {
    nameSize -= 8;
    ctx.font = `700 ${nameSize}px ${DISPLAY}`;
    nameLines = wrap(ctx, input.name, contentW);
  }
  y += 40;
  for (const line of nameLines) {
    y += nameSize * 1.02;
    ctx.fillText(line, cx, y);
  }
  if (input.city) {
    ctx.fillStyle = dark ? '#98a1b5' : '#5b6475';
    ctx.font = `400 38px ${SANS}`;
    y += 58;
    ctx.fillText(input.city, cx, y);
  }
  const topEnd = y;

  // DOLE: traka
  const footerY = H - H * 0.075;
  ctx.fillStyle = dark ? '#7d869b' : '#9ca3af';
  ctx.font = `600 29px ${SANS}`;
  ctx.fillText('Bez poziva   ·   Slobodni termini uživo   ·   POSLO ONE', cx, footerY);

  // SREDINA: natpis, QR, uputa, link (QR se smanji ako je naziv dugačak)
  const headlineSize = 74;
  const fixedH = headlineSize + 60 + 55 + 38 + 22 + 30;
  const space = footerY - 90 - (topEnd + 90);
  const box = Math.max(380, Math.min(contentW * 0.64, space - fixedH));
  const midH = fixedH + box;
  let my = topEnd + 90 + Math.max(0, (space - midH) / 2);

  ctx.fillStyle = dark ? '#f4f5f8' : '#0b0f1a';
  ctx.font = `600 ${headlineSize}px ${DISPLAY}`;
  my += headlineSize;
  ctx.fillText(input.headline, cx, my, contentW);
  my += 60;

  ctx.fillStyle = '#ffffff';
  roundRect(ctx, cx - box / 2, my, box, box, box * 0.08);
  ctx.fill();
  if (!dark) {
    ctx.strokeStyle = '#e5e7ef';
    ctx.lineWidth = 5;
    ctx.stroke();
  }
  const pad = box * 0.08;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(input.qr, cx - box / 2 + pad, my + pad, box - pad * 2, box - pad * 2);
  ctx.imageSmoothingEnabled = true;
  my += box + 55;

  ctx.fillStyle = dark ? '#cbd2e0' : '#374151';
  ctx.font = `600 38px ${SANS}`;
  ctx.fillText('Skeniraj kamerom mobitela', cx, my);
  my += 22 + 30;
  ctx.fillStyle = dark ? '#7d869b' : '#6b7280';
  ctx.font = `400 30px ${SANS}`;
  ctx.fillText(input.shortLink, cx, my, contentW);

  return canvas;
}

// Jedna stranica A4 sa JPEG slikom preko cijele stranice.
export async function canvasToPdf(canvas: HTMLCanvasElement): Promise<Blob> {
  const jpegBlob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Slika nije napravljena.'))), 'image/jpeg', 0.95),
  );
  const jpeg = new Uint8Array(await jpegBlob.arrayBuffer());
  const enc = new TextEncoder();
  const pageW = 595.28;
  const pageH = 841.89;
  const content = `q ${pageW} 0 0 ${pageH} 0 0 cm /Im0 Do Q`;

  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let length = 0;
  const push = (part: string | Uint8Array) => {
    const bytes = typeof part === 'string' ? enc.encode(part) : part;
    chunks.push(bytes);
    length += bytes.length;
  };
  const obj = (n: number, body: string) => {
    offsets[n] = length;
    push(`${n} 0 obj\n${body}\nendobj\n`);
  };

  push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
  obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
  obj(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  obj(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`);
  offsets[4] = length;
  push(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);
  push(jpeg);
  push('\nendstream\nendobj\n');
  obj(5, `<< /Length ${content.length} >>\nstream\n${content}\nendstream`);

  const xref = length;
  let table = 'xref\n0 6\n0000000000 65535 f \n';
  for (let n = 1; n <= 5; n += 1) table += `${String(offsets[n]).padStart(10, '0')} 00000 n \n`;
  push(`${table}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);

  return new Blob(chunks as BlobPart[], { type: 'application/pdf' });
}
