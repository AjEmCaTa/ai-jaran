"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "../_lib/admin";
import { Badge, Modal, Notice, PageHeader, btnGhost, btnPrimary, cardCls, inputCls, labelCls, type Tone } from "../_lib/ui";

type Firm = {
  id: string;
  name: string | null;
  owner_email: string | null;
  plan: string | null;
  plan_until: string | null;
  billing_status: string | null;
  billing_provider: string | null;
  created_at: string | null;
  reference: string;
};

const BANK_FIELDS: { key: string; label: string; placeholder: string }[] = [
  { key: "recipient", label: "Primalac (ime i prezime ili naziv obrta/firme)", placeholder: "npr. Harun Ćatić" },
  { key: "address", label: "Adresa primaoca", placeholder: "Ulica i broj, 88000 Mostar" },
  { key: "account", label: "Broj računa (16 cifara)", placeholder: "npr. 1234567890123456" },
  { key: "bank", label: "Banka", placeholder: "npr. UniCredit Bank d.d. Mostar" },
  { key: "iban", label: "IBAN (za uplate iz inostranstva)", placeholder: "BA39 ..." },
  { key: "swift", label: "SWIFT / BIC", placeholder: "npr. UNCRBA22" },
];

const PROVIDER: Record<string, string> = { free: "Trajno besplatno", dodo: "Kartica (Dodo)", bank: "Uplatnica", lemonsqueezy: "Lemon Squeezy", paypal: "PayPal" };
const STATUS: Record<string, { label: string; tone: Tone }> = {
  active: { label: "Aktivna", tone: "green" },
  pending: { label: "Čeka potvrdu", tone: "amber" },
  bank_pending: { label: "Čeka uplatu", tone: "amber" },
  cancelled: { label: "Otkazana", tone: "gray" },
  suspended: { label: "Neuspjela naplata", tone: "red" },
  expired: { label: "Istekla", tone: "red" },
};

const fmt = (iso: string | null) => {
  if (!iso) return "–";
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}.`;
};

export default function MasterBillingPage() {
  const [bank, setBank] = useState<Record<string, string>>({});
  const [firms, setFirms] = useState<Firm[] | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState<Firm | null>(null);
  const [form, setForm] = useState({ plan: "starter", months: 1 });
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<"bank" | "all">("bank");

  const load = useCallback(async () => {
    try {
      const data = await adminFetch<{ bank: Record<string, string>; firms: Firm[] }>("/api/master/billing");
      setBank(data.bank);
      setFirms(data.firms);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveBank = async () => {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await adminFetch("/api/master/billing", { method: "PUT", body: bank });
      setNotice("Podaci za uplatnicu su sačuvani. Firme ih vide na stranici Paket čim izaberu uplatnicu.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const confirmPayment = async () => {
    if (!confirming) return;
    setBusy(true);
    setError("");
    try {
      const res = await adminFetch<{ planUntil: string }>("/api/master/billing", {
        method: "POST",
        body: { businessId: confirming.id, plan: form.plan, months: form.months },
      });
      setNotice(`Uplata za „${confirming.name}” je potvrđena. Paket vrijedi do ${fmt(res.planUntil)}`);
      setConfirming(null);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const bankReady = Boolean(bank.recipient && (bank.account || bank.iban));
  const shown = (firms || []).filter((f) => filter === "all" || f.billing_provider === "bank");

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <PageHeader title="Plaćanja" text="Podaci za uplatnicu i ručna potvrda uplata. Kartične pretplate (Dodo) se ažuriraju same." />
      {error && <Notice tone="error">{error}</Notice>}
      {notice && <Notice tone="ok">{notice}</Notice>}

      <section className={`${cardCls} p-5`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-white">Podaci za uplatnicu</h2>
            <p className="mt-1 text-xs text-slate-400">
              {bankReady ? "Uplatnica je uključena za firme." : "Dok ne upišete primaoca i broj računa (ili IBAN), opcija uplatnice se firmama ne prikazuje."}
            </p>
          </div>
          <Badge tone={bankReady ? "green" : "gray"}>{bankReady ? "Uključeno" : "Isključeno"}</Badge>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {BANK_FIELDS.map((f) => (
            <label key={f.key} className="space-y-1.5">
              <span className={labelCls}>{f.label}</span>
              <input
                className={inputCls}
                value={bank[f.key] || ""}
                placeholder={f.placeholder}
                maxLength={200}
                onChange={(e) => setBank((b) => ({ ...b, [f.key]: e.target.value }))}
              />
            </label>
          ))}
        </div>
        <div className="mt-5 flex justify-end">
          <button type="button" className={btnPrimary} disabled={saving || !firms} onClick={saveBank}>
            {saving ? "Spremam..." : "Sačuvaj podatke"}
          </button>
        </div>
      </section>

      <section className={`${cardCls} p-5`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold text-white">Firme</h2>
          <div className="flex gap-2">
            <button type="button" className={filter === "bank" ? btnPrimary : btnGhost} onClick={() => setFilter("bank")}>Uplatnica</button>
            <button type="button" className={filter === "all" ? btnPrimary : btnGhost} onClick={() => setFilter("all")}>Sve firme</button>
          </div>
        </div>

        {!firms ? (
          <div className="mt-4 h-24 animate-pulse rounded-lg bg-white/5" />
        ) : shown.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">{filter === "bank" ? "Još nijedna firma nije izabrala uplatnicu." : "Nema firmi."}</p>
        ) : (
          <div className="mt-4 divide-y divide-white/[0.06]">
            {shown.map((f) => {
              const st = f.billing_status ? STATUS[f.billing_status] : null;
              return (
                <div key={f.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{f.name || "Bez naziva"}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {f.owner_email || "–"} · Poziv na broj <span className="font-mono text-slate-200">{f.reference}</span>
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <Badge tone="blue">{f.plan === "starter" ? "Starter" : "Pro"}</Badge>
                      {f.billing_provider && <Badge tone="gray">{PROVIDER[f.billing_provider] || f.billing_provider}</Badge>}
                      {st && <Badge tone={st.tone}>{st.label}</Badge>}
                      <span className="text-[11px] text-slate-500">Vrijedi do {fmt(f.plan_until)}</span>
                    </div>
                  </div>
                  {f.billing_provider !== "dodo" && f.billing_provider !== "free" && (
                    <button
                      type="button"
                      className={btnGhost}
                      onClick={() => {
                        setForm({ plan: f.plan === "pro" ? "pro" : "starter", months: 1 });
                        setConfirming(f);
                      }}
                    >
                      Potvrdi uplatu
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {confirming && (
        <Modal title={`Potvrdi uplatu: ${confirming.name || ""}`} onClose={() => !busy && setConfirming(null)}>
          <div className="space-y-4">
            <p className="text-sm text-slate-300">
              Provjerite da je uplata s pozivom na broj <span className="font-mono text-white">{confirming.reference}</span> stigla na račun. Paket se produžava od {fmt(confirming.plan_until && Date.parse(confirming.plan_until) > Date.now() ? confirming.plan_until : new Date().toISOString())}.
            </p>
            <label className="block space-y-1.5">
              <span className={labelCls}>Paket</span>
              <select className={inputCls} value={form.plan} onChange={(e) => setForm((v) => ({ ...v, plan: e.target.value }))}>
                <option value="starter">Starter · 15 KM/mjesečno</option>
                <option value="pro">Pro · 50 KM/mjesečno</option>
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className={labelCls}>Broj plaćenih mjeseci</span>
              <select className={inputCls} value={form.months} onChange={(e) => setForm((v) => ({ ...v, months: Number(e.target.value) }))}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {m} {m === 1 ? "mjesec" : m < 5 ? "mjeseca" : "mjeseci"} · {(form.plan === "pro" ? 50 : 15) * m} KM
                  </option>
                ))}
              </select>
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" className={btnGhost} disabled={busy} onClick={() => setConfirming(null)}>Odustani</button>
              <button type="button" className={btnPrimary} disabled={busy} onClick={confirmPayment}>{busy ? "Spremam..." : "Potvrdi uplatu"}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
