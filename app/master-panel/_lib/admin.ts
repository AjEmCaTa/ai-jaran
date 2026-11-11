"use client";

import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"
);

export async function adminHeaders(json = false): Promise<Record<string, string> | null> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return null;
  return json ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { Authorization: `Bearer ${token}` };
}

// Poziv admin API-ja; vraća JSON ili baca grešku s porukom servera.
export async function adminFetch<T = unknown>(url: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const headers = await adminHeaders(init.body !== undefined);
  if (!headers) throw new Error("Prijavite se ponovo.");
  const res = await fetch(url, {
    method: init.method || "GET",
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as { error?: string }).error || "Nešto nije uspjelo. Pokušajte ponovo.");
  return json as T;
}
