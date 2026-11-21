// Slika se prije slanja smanji (najduža strana do `maxSide` px) i pretvori u WEBP, ili JPG ako
// preglednik ne zna WEBP. Oblik slike ostaje isti: uspravna, položena ili kvadrat.
export async function shrinkImage(file: File, maxSide = 1920): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('decode'));
      el.src = url;
    });
    const w = img.naturalWidth || 1600;
    const h = img.naturalHeight || 1200;
    const scale = Math.min(1, maxSide / Math.max(w, h));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(w * scale));
    canvas.height = Math.max(1, Math.round(h * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const webp = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/webp', 0.84));
    if (webp && webp.type === 'image/webp') return webp;
    const jpg = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.86));
    if (jpg) return jpg;
    throw new Error('encode');
  } finally {
    URL.revokeObjectURL(url);
  }
}
