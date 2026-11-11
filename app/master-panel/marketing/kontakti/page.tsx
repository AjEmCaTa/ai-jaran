"use client";

import { useCallback, useEffect, useState } from "react";
import Icon from "../../../dashboard/_components/icons";
import { CONTACT_STATUSES, LEGAL_BASES, MARKETING_CATEGORIES, categoryLabel, isSendable } from "../../../../utils/marketingContacts";
import { adminFetch } from "../../_lib/admin";
import { Badge, Modal, Notice, PageHeader, StatCard, btnGhost, btnPrimary, cardCls, inputCls } from "../../_lib/ui";
import { BASIS_TONE, STATUS_TONE, fmtDate, type Contact, type Stats } from "../../_lib/marketing";
import ContactForm from "./ContactForm";
import ImportWizard from "./ImportWizard";

type ListResponse = { contacts: Contact[]; total: number; page: number; pageSize: number; stats: Stats };
type Quick = "" | "sendable" | "cold" | "unsubscribed" | "problematic";

const basisLabel = (id: string) => LEGAL_BASES.find((b) => b.id === id)?.label || id;
const statusLabel = (id: string) => CONTACT_STATUSES.find((s) => s.id === id)?.label || id;

export default function ContactsPage() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [flash, setFlash] = useState("");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [quick, setQuick] = useState<Quick>("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Contact | "new" | null>(null);
  const [importing, setImporting] = useState(false);

  // Pretraga kreće kad korisnik prestane kucati.
  useEffect(() => {
    const t = setTimeout(() => { setSearch(q.trim()); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const p = new URLSearchParams({ page: String(page) });
    if (search) p.set("q", search);
    if (quick === "sendable") p.set("basis", "sendable");
    if (quick === "cold") p.set("basis", "cold");
    if (quick === "unsubscribed") p.set("status", "unsubscribed");
    if (quick === "problematic") p.set("status", "problematic");
    if (category) p.set("category", category);
    if (city.trim()) p.set("city", city.trim());
    try {
      setData(await adminFetch<ListResponse>(`/api/master/marketing/contacts?${p}`));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [page, search, quick, category, city]);

  useEffect(() => { load(); }, [load]);

  const pick = (v: Quick) => { setQuick((cur) => (cur === v ? "" : v)); setPage(1); };
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const s = data?.stats;
  const filtered = !!(search || quick || category || city.trim());

  const saved = (c: Contact) => {
    setEditing(null);
    setFlash(`Sačuvano: ${c.company_name || c.email}`);
    load();
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <PageHeader
        title="Kontakti"
        text="Baza firmi kojima se obraćamo. Svaki kontakt ima pravni osnov, a mejlovi kasnije idu samo onima koji ga imaju."
        actions={
          <>
            <button onClick={() => setImporting(true)} className={btnGhost}>
              <Icon name="download" className="h-4 w-4 rotate-180" />
              Uvezi CSV
            </button>
            <button onClick={() => setEditing("new")} className={btnPrimary}>
              <Icon name="plus" className="h-4 w-4" />
              Dodaj kontakt
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Svi kontakti" value={s?.total ?? "–"} active={quick === ""} onClick={() => pick("")} />
        <StatCard label="Mogu primati mejlove" value={s?.sendable ?? "–"} tone="green" active={quick === "sendable"} onClick={() => pick("sendable")} />
        <StatCard label="Hladni kontakti" value={s?.cold ?? "–"} tone="gray" hint="Samo evidencija" active={quick === "cold"} onClick={() => pick("cold")} />
        <StatCard label="Odjavljeni" value={s?.unsubscribed ?? "–"} tone="amber" active={quick === "unsubscribed"} onClick={() => pick("unsubscribed")} />
        <StatCard label="Neispravni ili spam" value={s?.problematic ?? "–"} tone="red" active={quick === "problematic"} onClick={() => pick("problematic")} />
      </div>

      <div className={`${cardCls} p-3 sm:p-4`}>
        <div className="grid gap-2 sm:grid-cols-[1fr_200px_180px]">
          <div className="relative">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Pretraga: firma, vlasnik, email, telefon" className={`${inputCls} pl-3`} aria-label="Pretraga kontakata" />
          </div>
          <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className={inputCls} aria-label="Djelatnost">
            <option value="">Sve djelatnosti</option>
            {MARKETING_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <input value={city} onChange={(e) => { setCity(e.target.value); setPage(1); }} placeholder="Grad" className={inputCls} aria-label="Grad" />
        </div>
      </div>

      {flash && <Notice tone="ok">{flash}</Notice>}
      {error && <Notice tone="error">{error}</Notice>}

      <div className={`${cardCls} overflow-hidden`}>
        {loading && !data ? (
          <p className="px-6 py-16 text-center text-sm text-slate-500">Učitavanje kontakata...</p>
        ) : data && data.contacts.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-medium text-white">{filtered ? "Nema kontakata za ovaj filter" : "Baza je još prazna"}</p>
            <p className="mt-1 text-sm text-slate-500">{filtered ? "Promijenite pretragu ili filtere." : "Uvezite CSV iz Excela ili dodajte prvi kontakt ručno."}</p>
            {!filtered && (
              <div className="mt-5 flex justify-center gap-2">
                <button onClick={() => setImporting(true)} className={btnGhost}>Uvezi CSV</button>
                <button onClick={() => setEditing("new")} className={btnPrimary}>Dodaj kontakt</button>
              </div>
            )}
          </div>
        ) : data ? (
          <>
            {/* Računar: tabela */}
            <table className="hidden w-full text-left text-sm md:table">
              <thead className="border-b border-white/[0.06] text-xs text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Firma</th>
                  <th className="px-3 py-3 font-medium">Email</th>
                  <th className="px-3 py-3 font-medium">Djelatnost · grad</th>
                  <th className="px-3 py-3 font-medium">Osnov</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Dodano</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {data.contacts.map((c) => (
                  <tr key={c.id} onClick={() => { setFlash(""); setEditing(c); }} className="cursor-pointer transition hover:bg-white/[0.03]">
                    <td className="max-w-[220px] px-5 py-3">
                      <p className="truncate font-medium text-white">{c.company_name || "Bez naziva"}</p>
                      <p className="truncate text-xs text-slate-500">{c.owner_name || " "}</p>
                    </td>
                    <td className="max-w-[220px] truncate px-3 py-3 text-slate-300">{c.email}</td>
                    <td className="px-3 py-3 text-xs text-slate-400">{[categoryLabel(c.category), c.city].filter(Boolean).join(" · ") || "–"}</td>
                    <td className="px-3 py-3"><Badge tone={BASIS_TONE[c.legal_basis]}>{basisLabel(c.legal_basis)}</Badge></td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        <Badge tone={STATUS_TONE[c.status]}>{statusLabel(c.status)}</Badge>
                        {c.replied_at && <Badge tone="blue">Odgovorio</Badge>}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right text-xs text-slate-500">{fmtDate(c.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobitel: kartice */}
            <ul className="divide-y divide-white/[0.05] md:hidden">
              {data.contacts.map((c) => (
                <li key={c.id}>
                  <button onClick={() => { setFlash(""); setEditing(c); }} className="w-full px-4 py-3.5 text-left">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-white">{c.company_name || c.email}</p>
                        <p className="truncate text-xs text-slate-400">{c.company_name ? c.email : c.owner_name}</p>
                      </div>
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${isSendable(c) ? "bg-emerald-400" : c.legal_basis === "cold" ? "bg-slate-500" : "bg-amber-400"}`} />
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <Badge tone={BASIS_TONE[c.legal_basis]}>{basisLabel(c.legal_basis)}</Badge>
                      {c.status !== "active" && <Badge tone={STATUS_TONE[c.status]}>{statusLabel(c.status)}</Badge>}
                      {(c.category || c.city) && <span className="text-[11px] text-slate-500">{[categoryLabel(c.category), c.city].filter(Boolean).join(" · ")}</span>}
                    </div>
                  </button>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-3 text-xs text-slate-400 sm:px-5">
              <span>{data.total} {filtered ? "pronađeno" : "ukupno"}{loading ? " · učitavam..." : ""}</span>
              {pages > 1 && (
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded-lg border border-white/10 px-3 py-1.5 hover:bg-white/5 disabled:opacity-40">Nazad</button>
                  <span>{page} / {pages}</span>
                  <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page >= pages} className="rounded-lg border border-white/10 px-3 py-1.5 hover:bg-white/5 disabled:opacity-40">Naprijed</button>
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>

      {editing && (
        <Modal title={editing === "new" ? "Novi kontakt" : editing.company_name || editing.email} onClose={() => setEditing(null)} wide>
          <ContactForm
            contact={editing === "new" ? null : editing}
            onSaved={saved}
            onDeleted={() => { setEditing(null); setFlash("Kontakt je obrisan."); load(); }}
            onClose={() => setEditing(null)}
          />
        </Modal>
      )}
      {importing && (
        <Modal title="Uvoz kontakata iz CSV-a" onClose={() => setImporting(false)} wide>
          <ImportWizard onDone={() => { setFlash(""); load(); }} onClose={() => setImporting(false)} />
        </Modal>
      )}
    </div>
  );
}
