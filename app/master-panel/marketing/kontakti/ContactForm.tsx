"use client";

import { useState } from "react";
import { LEGAL_BASES, MARKETING_CATEGORIES } from "../../../../utils/marketingContacts";
import { adminFetch } from "../../_lib/admin";
import { Badge, Notice, btnGhost, btnPrimary, inputCls, labelCls } from "../../_lib/ui";
import { STATUS_TONE, fmtDate, fmtDateTime, type Contact } from "../../_lib/marketing";
import { CONTACT_STATUSES } from "../../../../utils/marketingContacts";
import { personalPitch } from "../../../../utils/marketingEmail";

const today = () => new Date().toISOString().slice(0, 10);

// Dodavanje novog ili uređivanje postojećeg kontakta.
export default function ContactForm({ contact, onSaved, onDeleted, onClose }: {
  contact: Contact | null;
  onSaved: (c: Contact) => void;
  onDeleted: (id: string) => void;
  onClose: () => void;
}) {
  const [f, setF] = useState({
    email: contact?.email || "",
    company_name: contact?.company_name || "",
    owner_name: contact?.owner_name || "",
    category: contact?.category || "",
    city: contact?.city || "",
    phone: contact?.phone || "",
    website: contact?.website || "",
    notes: contact?.notes || "",
    tags: (contact?.tags || []).join(", "),
    legal_basis: contact?.legal_basis || "cold",
    consent_source: contact?.consent_source || "",
    consent_at: contact?.consent_at ? contact.consent_at.slice(0, 10) : today(),
  });
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }));

  const save = async () => {
    setBusy("save");
    setError("");
    try {
      const payload = {
        ...f,
        consent_at: f.legal_basis === "consent" ? f.consent_at : contact?.consent_at || null,
        consent_source: f.legal_basis === "consent" ? f.consent_source : contact?.consent_source || null,
      };
      const res = contact
        ? await adminFetch<{ contact: Contact }>("/api/master/marketing/contacts", { method: "PATCH", body: { id: contact.id, ...payload, email: undefined } })
        : await adminFetch<{ contact: Contact }>("/api/master/marketing/contacts", { method: "POST", body: payload });
      onSaved(res.contact);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  };

  const action = async (body: Record<string, unknown>, key: string) => {
    if (!contact) return;
    setBusy(key);
    setError("");
    try {
      const res = await adminFetch<{ contact: Contact }>("/api/master/marketing/contacts", { method: "PATCH", body: { id: contact.id, ...body } });
      onSaved(res.contact);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  };

  const remove = async () => {
    if (!contact) return;
    setBusy("delete");
    try {
      await adminFetch(`/api/master/marketing/contacts?id=${contact.id}`, { method: "DELETE" });
      onDeleted(contact.id);
    } catch (e) {
      setError((e as Error).message);
      setBusy("");
    }
  };

  const basis = LEGAL_BASES.find((b) => b.id === f.legal_basis);

  return (
    <div className="space-y-5">
      {contact && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <Badge tone={STATUS_TONE[contact.status]}>{CONTACT_STATUSES.find((s) => s.id === contact.status)?.label}</Badge>
          {contact.replied_at && <Badge tone="blue">Odgovorio {fmtDate(contact.replied_at)}</Badge>}
          <span>Dodano {fmtDateTime(contact.created_at)}</span>
        </div>
      )}

      {contact && contact.status === "active" && (() => {
        const pitch = personalPitch(contact);
        const gmail = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(contact.email)}&su=${encodeURIComponent(pitch.subject)}&body=${encodeURIComponent(pitch.body)}`;
        const mailto = `mailto:${contact.email}?subject=${encodeURIComponent(pitch.subject)}&body=${encodeURIComponent(pitch.body)}`;
        return (
          <div className="rounded-[calc(var(--po-radius)*0.8)] border border-blue-500/25 bg-blue-500/[0.06] p-4">
            <p className="text-sm font-semibold text-white">Piši lično</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              Otvara gotovu, personalizovanu poruku u vašem mejlu. Šaljete je vi, ručno, jednom kontaktu. Ovo nije automatsko slanje.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href={gmail} target="_blank" rel="noopener noreferrer" onClick={() => action({ contacted: true }, "contacted")} className={btnPrimary}>Otvori u Gmailu</a>
              <a href={mailto} onClick={() => action({ contacted: true }, "contacted")} className={btnGhost}>Drugi mejl program</a>
            </div>
            {contact.last_contacted_at && <p className="mt-2 text-[11px] text-slate-500">Zadnji kontakt: {fmtDate(contact.last_contacted_at)}</p>}
          </div>
        );
      })()}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={`${labelCls} sm:col-span-2`}>
          Email adresa
          <input type="email" value={f.email} onChange={set("email")} disabled={!!contact} placeholder="info@firma.ba" className={`${inputCls} mt-1.5 disabled:opacity-60`} />
        </label>
        <label className={labelCls}>
          Naziv firme
          <input value={f.company_name} onChange={set("company_name")} className={`${inputCls} mt-1.5`} />
        </label>
        <label className={labelCls}>
          Ime vlasnika
          <input value={f.owner_name} onChange={set("owner_name")} className={`${inputCls} mt-1.5`} />
        </label>
        <label className={labelCls}>
          Djelatnost
          <select value={f.category} onChange={set("category")} className={`${inputCls} mt-1.5`}>
            <option value="">Nije izabrano</option>
            {MARKETING_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </label>
        <label className={labelCls}>
          Grad
          <input value={f.city} onChange={set("city")} className={`${inputCls} mt-1.5`} />
        </label>
        <label className={labelCls}>
          Telefon
          <input value={f.phone} onChange={set("phone")} className={`${inputCls} mt-1.5`} />
        </label>
        <label className={labelCls}>
          Web ili Instagram
          <input value={f.website} onChange={set("website")} className={`${inputCls} mt-1.5`} />
        </label>
        <label className={`${labelCls} sm:col-span-2`}>
          Oznake <span className="text-slate-500">(odvojene zarezom)</span>
          <input value={f.tags} onChange={set("tags")} placeholder="npr. mostar, sajam" className={`${inputCls} mt-1.5`} />
        </label>
        <label className={`${labelCls} sm:col-span-2`}>
          Napomena
          <textarea value={f.notes} onChange={set("notes")} rows={2} className={`${inputCls} mt-1.5 resize-y`} />
        </label>
      </div>

      <fieldset className="space-y-3 rounded-[calc(var(--po-radius)*0.8)] border border-white/[0.07] bg-white/[0.02] p-4">
        <legend className="px-1 text-xs font-semibold text-white">Pravni osnov za kontakt</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {LEGAL_BASES.map((b) => (
            <label key={b.id} className={`flex cursor-pointer gap-3 rounded-xl border p-3 text-sm transition ${f.legal_basis === b.id ? "border-blue-500/60 bg-blue-500/10" : "border-white/[0.07] hover:border-white/15"}`}>
              <input type="radio" name="basis" value={b.id} checked={f.legal_basis === b.id} onChange={set("legal_basis")} className="mt-0.5 accent-blue-500" />
              <span>
                <span className="block font-medium text-white">{b.label}</span>
                <span className="block text-xs text-slate-400">{b.hint}</span>
              </span>
            </label>
          ))}
        </div>
        {f.legal_basis === "consent" && (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelCls}>
              Kako je pristao
              <input value={f.consent_source} onChange={set("consent_source")} placeholder="npr. prijava na sajmu, lično" className={`${inputCls} mt-1.5`} />
            </label>
            <label className={labelCls}>
              Datum pristanka
              <input type="date" value={f.consent_at} max={today()} onChange={set("consent_at")} className={`${inputCls} mt-1.5`} />
            </label>
          </div>
        )}
        {basis && !basis.sendable && <p className="text-xs text-slate-400">Hladnim kontaktima sistem ne dozvoljava slanje mejlova. Ostaju samo u evidenciji.</p>}
      </fieldset>

      {error && <Notice tone="error">{error}</Notice>}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {contact && contact.status === "active" && (
            <button type="button" onClick={() => action({ status: "unsubscribed" }, "unsub")} disabled={!!busy} className={btnGhost}>
              {busy === "unsub" ? "..." : "Odjavi s liste"}
            </button>
          )}
          {contact && (
            <button type="button" onClick={() => action({ replied: !contact.replied_at }, "replied")} disabled={!!busy} className={btnGhost}>
              {busy === "replied" ? "..." : contact.replied_at ? "Poništi „odgovorio”" : "Označi da je odgovorio"}
            </button>
          )}
          {contact && !confirmDelete && (
            <button type="button" onClick={() => setConfirmDelete(true)} className="rounded-[calc(var(--po-radius)*0.7)] px-3 py-2.5 text-sm font-medium text-red-300 hover:bg-red-500/10">
              Obriši
            </button>
          )}
          {contact && confirmDelete && (
            <button type="button" onClick={remove} disabled={!!busy} className="rounded-[calc(var(--po-radius)*0.7)] bg-red-500/90 px-3 py-2.5 text-sm font-semibold text-white hover:bg-red-500">
              {busy === "delete" ? "Brišem..." : "Potvrdi brisanje (trajno)"}
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className={btnGhost}>Zatvori</button>
          <button type="button" onClick={save} disabled={!!busy || (!contact && !f.email.trim())} className={btnPrimary}>
            {busy === "save" ? "Čuvam..." : contact ? "Sačuvaj izmjene" : "Dodaj kontakt"}
          </button>
        </div>
      </div>
    </div>
  );
}
