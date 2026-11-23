// Supabase ponekad kratko odbije ispravan ključ s greškom "JWT issued at future" (PGRST303),
// kad se satovi servera za trenutak ne slažu. Tada zahtjev ponovimo, umjesto da posjetilac dobije praznu stranicu.
export const retryFetch: typeof fetch = async (input, init) => {
  for (let attempt = 0; ; attempt += 1) {
    const res = await fetch(input, init);
    if (res.status !== 401 || attempt >= 2) return res;
    const body = await res.clone().text().catch(() => '');
    if (!body.includes('PGRST303') && !body.includes('issued at future')) return res;
    await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
  }
};
