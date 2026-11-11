"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Icon, { type IconName } from "../../dashboard/_components/icons";
import { adminFetch } from "../_lib/admin";
import { Badge, Notice, PageHeader, StatCard, btnPrimary, cardCls } from "../_lib/ui";
import { ACTION_LABELS, fmtDate, fmtDateTime, type Stats } from "../_lib/marketing";
import { LEGAL_BASES } from "../../../utils/marketingContacts";

type Activity = { id: number; actor: string; action: string; details: Record<string, unknown>; created_at: string };
type Import = { id: string; file_name: string | null; legal_basis: string; source: string | null; total_rows: number; inserted: number; duplicates: number; invalid: number; created_at: string };

const STEPS: { title: string; text: string; icon: IconName; href?: string; done?: boolean }[] = [
  { title: "Kontakti i baza", text: "Uvoz iz CSV-a, pravni osnov, segmenti po djelatnosti i gradu.", icon: "users", href: "/master-panel/marketing/kontakti", done: true },
  { title: "Editor mejlova", text: "Mejlovi u POSLO ONE stilu, personalizacija i test slanje.", icon: "mail" },
  { title: "Kampanje", text: "Odobravanje, zakazivanje, dnevni limit i zaštita od duplog slanja.", icon: "calendar" },
  { title: "Analitika", text: "Isporuka, otvaranja, klikovi, odjave i neispravne adrese.", icon: "trending" },
];

export default function MarketingOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [imports, setImports] = useState<Import[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [c, a] = await Promise.all([
          adminFetch<{ stats: Stats }>("/api/master/marketing/contacts?page=1"),
          adminFetch<{ activity: Activity[]; imports: Import[] }>("/api/master/marketing/activity"),
        ]);
        setStats(c.stats);
        setActivity(a.activity);
        setImports(a.imports);
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, []);

  const basisLabel = (id: string) => LEGAL_BASES.find((b) => b.id === id)?.label || id;

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <PageHeader
        title="Marketing"
        text="Kontakti potencijalnih i postojećih klijenata na jednom mjestu. Mejlovi idu samo kontaktima koji imaju osnov za to, a hladni kontakti su samo evidencija."
        actions={
          <Link href="/master-panel/marketing/kontakti" className={btnPrimary}>
            <Icon name="users" className="h-4 w-4" />
            Otvori kontakte
          </Link>
        }
      />
      {error && <Notice tone="error">{error}</Notice>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Ukupno kontakata" value={stats?.total ?? "–"} />
        <StatCard label="Mogu primati mejlove" value={stats?.sendable ?? "–"} tone="green" hint="Aktivni, s pristankom, korisnici ili upiti" />
        <StatCard label="Hladni kontakti" value={stats?.cold ?? "–"} tone="gray" hint="Samo evidencija, bez slanja" />
        <StatCard label="Odjavljeni" value={stats?.unsubscribed ?? "–"} tone="amber" />
        <StatCard label="Neispravni ili spam" value={stats?.problematic ?? "–"} tone="red" />
      </div>

      <div className={`${cardCls} p-[var(--po-pad)]`}>
        <h3 className="text-sm font-semibold text-white">Plan modula</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => {
            const body = (
              <div className={`h-full rounded-[calc(var(--po-radius)*0.8)] border p-4 ${s.done ? "border-blue-500/30 bg-blue-500/[0.06]" : "border-white/[0.06] bg-white/[0.02]"}`}>
                <div className="flex items-center justify-between">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${s.done ? "bg-blue-500/15 text-blue-300" : "bg-white/[0.04] text-gray-500"}`}>
                    <Icon name={s.icon} className="h-[18px] w-[18px]" />
                  </span>
                  {s.done ? <Badge tone="blue">Aktivno</Badge> : <Badge tone="gray">Faza {i + 1}</Badge>}
                </div>
                <p className="mt-3 text-sm font-semibold text-white">{s.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">{s.text}</p>
              </div>
            );
            return s.href ? <Link key={s.title} href={s.href} className="block">{body}</Link> : <div key={s.title}>{body}</div>;
          })}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className={`${cardCls} p-[var(--po-pad)]`}>
          <h3 className="text-sm font-semibold text-white">Zadnji uvozi</h3>
          {imports.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-slate-500">Još nema uvoza. Uvezite prvi CSV na stranici Kontakti.</p>
          ) : (
            <ul className="mt-3 divide-y divide-white/[0.06]">
              {imports.map((im) => (
                <li key={im.id} className="py-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate font-medium text-white">{im.file_name || "CSV"}</span>
                    <span className="shrink-0 text-xs text-slate-500">{fmtDate(im.created_at)}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {im.inserted} novih · {im.duplicates} duplih · {im.invalid} neispravnih · {basisLabel(im.legal_basis)}
                    {im.source ? ` · ${im.source}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className={`${cardCls} p-[var(--po-pad)]`}>
          <h3 className="text-sm font-semibold text-white">Evidencija aktivnosti</h3>
          {activity.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-slate-500">Svaka radnja u marketingu bit će zapisana ovdje.</p>
          ) : (
            <ul className="mt-3 divide-y divide-white/[0.06]">
              {activity.map((a) => (
                <li key={a.id} className="flex items-start justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-200">{ACTION_LABELS[a.action] || a.action}</p>
                    <p className="truncate text-xs text-slate-500">{a.actor}</p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-500">{fmtDateTime(a.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
