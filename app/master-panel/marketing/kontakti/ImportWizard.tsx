"use client";

import { useMemo, useState } from "react";
import Icon from "../../../dashboard/_components/icons";
import {
  CONTACT_FIELDS, LEGAL_BASES, MAX_IMPORT_ROWS, categoryLabel, guessMapping, parseCsv, prepareImport, type ContactField, type LegalBasis,
} from "../../../../utils/marketingContacts";
import { adminFetch } from "../../_lib/admin";
import { Notice, btnGhost, btnPrimary, inputCls, labelCls } from "../../_lib/ui";

type Check = { newCount: number; existingCount: number; existing: string[]; invalid: number; duplicatesInFile: number };
type Result = { inserted: number; duplicates: number; invalid: number };

const SAMPLE =
  "email;naziv firme;ime vlasnika;djelatnost;grad;telefon;web;napomena;oznake\n" +
  "info@primjer-salon.ba;Salon Primjer;Ana Anić;Frizerski salon;Mostar;061 000 000;primjer-salon.ba;Upoznali na sajmu;sajam\n";

// Fajl iz Excela je često u Windows-1250 kodnoj stranici; ako UTF-8 ne prođe, čita se tako.
async function readText(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const utf = new TextDecoder("utf-8").decode(buf);
  if (!utf.includes("�")) return utf;
  try {
    return new TextDecoder("windows-1250").decode(buf);
  } catch {
    return utf;
  }
}

const today = () => new Date().toISOString().slice(0, 10);

export default function ImportWizard({ onDone, onClose }: { onDone: () => void; onClose: () => void }) {
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<ContactField, number> | null>(null);
  const [basis, setBasis] = useState<LegalBasis | "">("");
  const [source, setSource] = useState("");
  const [consentAt, setConsentAt] = useState(today());
  const [check, setCheck] = useState<Check | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [drag, setDrag] = useState(false);

  const header = rows[0] || [];
  const body = useMemo(() => rows.slice(1), [rows]);
  const prepared = useMemo(() => (mapping ? prepareImport(body, mapping) : null), [body, mapping]);

  const load = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    setCheck(null);
    if (file.size > 5 * 1024 * 1024) return setError("Fajl je veći od 5 MB. Podijelite ga na manje dijelove.");
    const parsed = parseCsv(await readText(file));
    if (parsed.length < 2) return setError("Fajl nema redova s podacima. Prvi red mora biti zaglavlje (nazivi kolona).");
    if (parsed.length - 1 > MAX_IMPORT_ROWS) return setError(`Fajl ima ${parsed.length - 1} redova. Najviše je ${MAX_IMPORT_ROWS} po uvozu.`);
    const m = guessMapping(parsed[0]);
    setFileName(file.name);
    setRows(parsed);
    setMapping(m);
  };

  const ready = !!prepared && prepared.valid.length > 0 && mapping!.email >= 0 && !!basis && source.trim().length > 1 && (basis !== "consent" || !!consentAt);

  const send = async (dryRun: boolean) => {
    if (!prepared || !ready) return;
    setBusy(dryRun ? "check" : "import");
    setError("");
    try {
      const res = await adminFetch<Check & Result>("/api/master/marketing/import", {
        method: "POST",
        body: { dryRun, fileName, legalBasis: basis, source: source.trim(), consentAt: basis === "consent" ? consentAt : null, contacts: prepared.valid },
      });
      if (dryRun) setCheck(res);
      else {
        setResult(res);
        onDone();
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
    }
  };

  const downloadSample = () => {
    const url = URL.createObjectURL(new Blob(["﻿" + SAMPLE], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "poslo-one-kontakti-primjer.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (result) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
          <Icon name="check" className="h-7 w-7" />
        </div>
        <p className="font-display text-2xl font-bold text-white">Uvezeno {result.inserted} kontakata</p>
        <p className="text-sm text-slate-400">
          {result.duplicates} preskočeno jer već postoje ili se ponavljaju, {result.invalid} neispravnih. Postojeći kontakti nisu mijenjani.
        </p>
        <button onClick={onClose} className={btnPrimary}>Gotovo</button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {!mapping ? (
        <>
          <label
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); load(e.dataTransfer.files?.[0]); }}
            className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[var(--po-radius)] border-2 border-dashed px-6 py-12 text-center transition ${drag ? "border-blue-400 bg-blue-500/10" : "border-white/10 hover:border-white/20"}`}
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-300">
              <Icon name="download" className="h-6 w-6 rotate-180" />
            </span>
            <span className="text-sm font-semibold text-white">Izaberite CSV fajl ili ga prevucite ovdje</span>
            <span className="text-xs text-slate-500">Iz Excela: Datoteka → Spremi kao → CSV. Prvi red su nazivi kolona.</span>
            <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => load(e.target.files?.[0])} />
          </label>
          <button type="button" onClick={downloadSample} className="text-xs font-medium text-blue-300 hover:text-blue-200">
            Preuzmi primjer CSV fajla
          </button>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-sm">
            <span className="min-w-0 truncate"><span className="font-medium text-white">{fileName}</span> <span className="text-slate-500">· {body.length} redova</span></span>
            <button type="button" onClick={() => { setMapping(null); setRows([]); setCheck(null); }} className="shrink-0 text-xs text-slate-400 hover:text-white">Drugi fajl</button>
          </div>

          <div>
            <p className="text-xs font-semibold text-white">1. Kolone</p>
            <p className="mt-1 text-xs text-slate-500">Prepoznao sam kolone po nazivima. Provjerite i ispravite ako treba.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {CONTACT_FIELDS.map((field) => (
                <label key={field.id} className={labelCls}>
                  {field.label}{field.id === "email" && <span className="text-red-300"> *</span>}
                  <select
                    value={mapping[field.id]}
                    onChange={(e) => { setMapping({ ...mapping, [field.id]: Number(e.target.value) }); setCheck(null); }}
                    className={`${inputCls} mt-1.5`}
                  >
                    <option value={-1}>Nema</option>
                    {header.map((h, i) => <option key={i} value={i}>{h || `Kolona ${i + 1}`}</option>)}
                  </select>
                </label>
              ))}
            </div>
          </div>

          {prepared && (
            <div className="overflow-x-auto rounded-xl border border-white/[0.07]">
              <table className="w-full min-w-[560px] text-left text-xs">
                <thead className="bg-white/[0.03] text-slate-400">
                  <tr><th className="px-3 py-2">Email</th><th className="px-3 py-2">Firma</th><th className="px-3 py-2">Vlasnik</th><th className="px-3 py-2">Djelatnost</th><th className="px-3 py-2">Grad</th></tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05] text-slate-200">
                  {prepared.valid.slice(0, 5).map((c) => (
                    <tr key={c.email}><td className="px-3 py-2">{c.email}</td><td className="px-3 py-2">{c.company_name}</td><td className="px-3 py-2">{c.owner_name}</td><td className="px-3 py-2">{categoryLabel(c.category)}</td><td className="px-3 py-2">{c.city}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {prepared && (prepared.invalid.length > 0 || prepared.duplicates.length > 0) && (
            <details className="rounded-xl border border-amber-500/20 bg-amber-500/[0.05] px-4 py-3 text-xs text-amber-100">
              <summary className="cursor-pointer font-medium">
                {prepared.invalid.length} neispravnih i {prepared.duplicates.length} ponovljenih redova neće biti uvezeno
              </summary>
              <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-amber-100/80">
                {[...prepared.invalid, ...prepared.duplicates].slice(0, 100).map((r) => (
                  <li key={`${r.line}-${r.email}`}>Red {r.line}: {r.email || "(prazno)"} · {r.reason}</li>
                ))}
              </ul>
            </details>
          )}

          <fieldset className="space-y-3">
            <legend className="text-xs font-semibold text-white">2. Pravni osnov za sve kontakte iz ovog fajla</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {LEGAL_BASES.map((b) => (
                <label key={b.id} className={`flex cursor-pointer gap-3 rounded-xl border p-3 text-sm transition ${basis === b.id ? "border-blue-500/60 bg-blue-500/10" : "border-white/[0.07] hover:border-white/15"}`}>
                  <input type="radio" name="import-basis" checked={basis === b.id} onChange={() => { setBasis(b.id); setCheck(null); }} className="mt-0.5 accent-blue-500" />
                  <span><span className="block font-medium text-white">{b.label}</span><span className="block text-xs text-slate-400">{b.hint}</span></span>
                </label>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={labelCls}>
                Izvor kontakata <span className="text-red-300">*</span>
                <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="npr. Google Maps Mostar, sajam, forma na sajtu" className={`${inputCls} mt-1.5`} />
              </label>
              {basis === "consent" && (
                <label className={labelCls}>
                  Datum pristanka
                  <input type="date" value={consentAt} max={today()} onChange={(e) => setConsentAt(e.target.value)} className={`${inputCls} mt-1.5`} />
                </label>
              )}
            </div>
          </fieldset>

          {check && (
            <Notice tone="info">
              <b>{check.newCount}</b> novih kontakata će biti dodano. {check.existingCount > 0 && <>{check.existingCount} već postoji u bazi i neće biti promijenjeno. </>}
              {check.invalid + check.duplicatesInFile > 0 && <>{check.invalid + check.duplicatesInFile} redova se preskače.</>}
            </Notice>
          )}
          {error && <Notice tone="error">{error}</Notice>}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className={btnGhost}>Odustani</button>
            {!check ? (
              <button type="button" onClick={() => send(true)} disabled={!ready || !!busy} className={btnPrimary}>
                {busy === "check" ? "Provjeravam..." : `Provjeri ${prepared?.valid.length || 0} kontakata`}
              </button>
            ) : (
              <button type="button" onClick={() => send(false)} disabled={!!busy || check.newCount === 0} className={btnPrimary}>
                {busy === "import" ? "Uvozim..." : `Uvezi ${check.newCount} kontakata`}
              </button>
            )}
          </div>
        </>
      )}
      {!mapping && error && <Notice tone="error">{error}</Notice>}
    </div>
  );
}
