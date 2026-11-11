"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Icon from "../../../dashboard/_components/icons";
import { adminFetch } from "../../_lib/admin";
import { Badge, Modal, Notice, PageHeader, btnGhost, btnPrimary, cardCls, inputCls, labelCls, type Tone } from "../../_lib/ui";
import { fmtDateTime } from "../../_lib/marketing";
import { AUDIENCE_INFO, type SequenceAudience } from "../../../../utils/marketingSequences";
import { TOKENS, renderEmail } from "../../../../utils/marketingEmail";

type Step = {
  id: string; sequence_id: string; position: number; delay_days: number; enabled: boolean; subject: string; preheader: string | null;
  heading: string | null; body: string; cta_label: string | null; cta_url: string | null; note: string | null; stats: Record<string, number>;
};
type Sequence = {
  id: string; key: string; name: string; description: string | null; audience: SequenceAudience; status: "draft" | "active" | "paused";
  approved_by: string | null; approved_at: string | null; enrolled: { active: number; total: number }; steps: Step[];
};
type Send = { id: string; kind: string; to_email: string; subject: string; status: string; error: string | null; created_at: string };
type Data = {
  sequences: Sequence[]; settings: { sending_enabled: boolean; daily_limit: number; footer_address: string };
  mode: "live" | "simulated"; sentToday: number; recent: Send[]; siteUrl: string;
};
type RunResult = { linked: number; enrolled: number; sent: number; simulated: number; failed: number; skipped: number; limitLeft: number; note: string };

const SEQ_STATUS: Record<Sequence["status"], { label: string; tone: Tone }> = {
  draft: { label: "Čeka odobrenje", tone: "amber" },
  active: { label: "Aktivan", tone: "green" },
  paused: { label: "Pauziran", tone: "gray" },
};
const SEND_STATUS: Record<string, { label: string; tone: Tone }> = {
  sent: { label: "Poslano", tone: "green" },
  simulated: { label: "Simulacija", tone: "blue" },
  failed: { label: "Greška", tone: "red" },
  sending: { label: "Šalje se", tone: "amber" },
  skipped: { label: "Preskočeno", tone: "gray" },
};

const SAMPLE = { owner_name: "Harun", company_name: "Studio Lana", city: "Mostar" };

function Switch({ on, onChange, disabled, label }: { on: boolean; onChange: (v: boolean) => void; disabled?: boolean; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50 ${on ? "bg-blue-500" : "bg-gray-700"}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

export default function SequencesPage() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [flash, setFlash] = useState<{ tone: "ok" | "error" | "info"; text: string } | null>(null);
  const [busy, setBusy] = useState("");
  const [editing, setEditing] = useState<{ seq: Sequence; step: Step } | null>(null);
  const [approving, setApproving] = useState<Sequence | null>(null);
  const [confirmEnable, setConfirmEnable] = useState(false);
  const [limit, setLimit] = useState("");
  const [address, setAddress] = useState("");

  const load = useCallback(async () => {
    try {
      const d = await adminFetch<Data>("/api/master/marketing/sequences");
      setData(d);
      setLimit(String(d.settings.daily_limit));
      setAddress(d.settings.footer_address);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const patch = async (body: Record<string, unknown>, key: string, ok?: string) => {
    setBusy(key);
    setFlash(null);
    try {
      const res = await adminFetch<{ needsApproval?: boolean }>("/api/master/marketing/sequences", { method: "PATCH", body });
      if (res.needsApproval) setFlash({ tone: "info", text: "Mejl je sačuvan. Niz je pauziran dok izmjenu ponovo ne odobrite." });
      else if (ok) setFlash({ tone: "ok", text: ok });
      await load();
      return true;
    } catch (e) {
      setFlash({ tone: "error", text: (e as Error).message });
      return false;
    } finally {
      setBusy("");
    }
  };

  const runNow = async () => {
    setBusy("run");
    setFlash(null);
    try {
      const r = await adminFetch<RunResult>("/api/master/marketing/run", { method: "POST", body: {} });
      const parts = [
        `${r.sent} poslano`,
        r.simulated ? `${r.simulated} simulirano` : "",
        r.failed ? `${r.failed} grešaka` : "",
        r.skipped ? `${r.skipped} preskočeno` : "",
        `${r.enrolled} novih u nizovima`,
      ].filter(Boolean);
      setFlash({ tone: r.failed ? "error" : "ok", text: `Gotovo: ${parts.join(", ")}.${r.note ? ` ${r.note}` : ""}` });
      await load();
    } catch (e) {
      setFlash({ tone: "error", text: (e as Error).message });
    } finally {
      setBusy("");
    }
  };

  const testSend = async (step: Step) => {
    setBusy(`test-${step.id}`);
    setFlash(null);
    try {
      const r = await adminFetch<{ status: string; to: string }>("/api/master/marketing/test", { method: "POST", body: { stepId: step.id } });
      setFlash({ tone: "ok", text: r.status === "simulated" ? `Test je simuliran (probna verzija ne šalje prave mejlove). Na produkciji ide na ${r.to}.` : `Test mejl je poslan na ${r.to}.` });
      await load();
    } catch (e) {
      setFlash({ tone: "error", text: (e as Error).message });
    } finally {
      setBusy("");
    }
  };

  if (error) return <div className="mx-auto max-w-6xl"><Notice tone="error">{error}</Notice></div>;
  if (!data) return <p className="py-16 text-center text-sm text-slate-500">Učitavanje...</p>;
  const s = data.settings;

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <PageHeader
        title="Automatski mejlovi"
        text="Nizovi mejlova koji sami stižu novim firmama i ljudima koji su poslali upit. Šalju se samo odobreni nizovi, samo kontaktima koji to smiju primati, uz dnevni limit."
        actions={
          <button onClick={runNow} disabled={busy === "run"} className={btnGhost}>
            <Icon name="clock" className="h-4 w-4" />
            {busy === "run" ? "Pokrećem..." : "Pokreni sada"}
          </button>
        }
      />

      {flash && <Notice tone={flash.tone}>{flash.text}</Notice>}
      {data.mode === "simulated" && (
        <Notice tone="info">Ovo je probna verzija: mejlovi se samo simuliraju i zapisuju, ništa ne odlazi stvarnim primaocima.</Notice>
      )}

      {/* Postavke slanja */}
      <div className={`${cardCls} grid gap-5 p-[var(--po-pad)] lg:grid-cols-[1.2fr_1fr_1fr]`}>
        <div className="flex items-start gap-4">
          <Switch
            on={s.sending_enabled}
            label="Slanje uključeno"
            disabled={busy === "enable"}
            onChange={(v) => (v ? setConfirmEnable(true) : patch({ action: "settings", sending_enabled: false }, "enable", "Slanje je isključeno. Ništa se ne šalje dok ga ponovo ne uključite."))}
          />
          <div>
            <p className="text-sm font-semibold text-white">{s.sending_enabled ? "Slanje je uključeno" : "Slanje je isključeno"}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              {s.sending_enabled ? "Odobreni nizovi se šalju automatski, nekoliko puta dnevno." : "Dok je isključeno, sistem samo priprema kontakte i nizove, a mejlovi se ne šalju."}
            </p>
            <p className="mt-2 text-xs text-slate-500">Danas: {data.sentToday} od {s.daily_limit}</p>
          </div>
        </div>
        <div>
          <label className={labelCls}>
            Dnevni limit mejlova
            <div className="mt-1.5 flex gap-2">
              <input type="number" min={1} max={500} value={limit} onChange={(e) => setLimit(e.target.value)} className={inputCls} />
              <button onClick={() => patch({ action: "settings", daily_limit: Number(limit) }, "limit", "Dnevni limit je sačuvan.")} disabled={busy === "limit" || Number(limit) === s.daily_limit} className={btnGhost}>Sačuvaj</button>
            </div>
          </label>
          <p className="mt-1.5 text-[11px] text-slate-500">Resend besplatno: 100 mejlova dnevno, zajedno s mejlovima za rezervacije.</p>
        </div>
        <div>
          <label className={labelCls}>
            Adresa u podnožju mejla
            <div className="mt-1.5 flex gap-2">
              <input value={address} onChange={(e) => setAddress(e.target.value)} className={inputCls} />
              <button onClick={() => patch({ action: "settings", footer_address: address }, "address", "Adresa je sačuvana.")} disabled={busy === "address" || address.trim() === s.footer_address} className={btnGhost}>Sačuvaj</button>
            </div>
          </label>
        </div>
      </div>

      {/* Nizovi */}
      {data.sequences.map((seq) => {
        const st = SEQ_STATUS[seq.status];
        const enabledSteps = seq.steps.filter((x) => x.enabled).length;
        return (
          <div key={seq.id} className={`${cardCls} overflow-hidden`}>
            <div className="flex flex-col gap-4 border-b border-white/[0.06] p-[var(--po-pad)] sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-xl font-semibold text-white">{seq.name}</h3>
                  <Badge tone={st.tone}>{st.label}</Badge>
                </div>
                <p className="mt-1 text-sm text-slate-400">{AUDIENCE_INFO[seq.audience].who}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {seq.enrolled.active} trenutno u nizu · {seq.enrolled.total} ukupno · {enabledSteps} od {seq.steps.length} mejlova uključeno
                  {seq.approved_at && seq.status === "active" ? ` · odobrio ${seq.approved_by} ${fmtDateTime(seq.approved_at)}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                {seq.status === "active" ? (
                  <button onClick={() => patch({ action: "pause", id: seq.id }, `pause-${seq.id}`, "Niz je pauziran.")} disabled={!!busy} className={btnGhost}>Pauziraj</button>
                ) : (
                  <button onClick={() => setApproving(seq)} disabled={!!busy || enabledSteps === 0} className={btnPrimary}>
                    <Icon name="check" className="h-4 w-4" />
                    Odobri i pokreni
                  </button>
                )}
              </div>
            </div>
            <ul className="divide-y divide-white/[0.05]">
              {seq.steps.map((step) => {
                const sent = (step.stats.sent || 0) + (step.stats.simulated || 0);
                return (
                  <li key={step.id} className={`flex flex-col gap-3 px-[var(--po-pad)] py-4 sm:flex-row sm:items-center ${step.enabled ? "" : "opacity-60"}`}>
                    <div className="flex min-w-0 flex-1 items-start gap-4">
                      <span className="flex h-11 w-14 shrink-0 flex-col items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-[10px] font-semibold uppercase text-slate-500">
                        Dan<b className="text-base leading-none text-white">{step.delay_days}</b>
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{step.subject}</p>
                        <p className="truncate text-xs text-slate-500">{step.preheader}</p>
                        {step.note && <p className="mt-1 text-xs text-amber-300/90">{step.note}</p>}
                        {sent > 0 && <p className="mt-1 text-[11px] text-slate-500">{sent} poslano{step.stats.failed ? ` · ${step.stats.failed} grešaka` : ""}</p>}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 pl-[4.5rem] sm:pl-0">
                      <Switch on={step.enabled} label={`Mejl dan ${step.delay_days} uključen`} disabled={!!busy} onChange={(v) => patch({ action: "updateStep", stepId: step.id, enabled: v }, `en-${step.id}`)} />
                      <button onClick={() => testSend(step)} disabled={!!busy} className="rounded-lg px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/5 disabled:opacity-50">
                        {busy === `test-${step.id}` ? "Šaljem..." : "Test meni"}
                      </button>
                      <button onClick={() => setEditing({ seq, step })} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-white hover:bg-white/5">Uredi</button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}

      {/* Zadnja slanja */}
      <div className={`${cardCls} p-[var(--po-pad)]`}>
        <h3 className="text-sm font-semibold text-white">Zadnja slanja</h3>
        {data.recent.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-slate-500">Još ništa nije poslano.</p>
        ) : (
          <ul className="mt-3 divide-y divide-white/[0.06]">
            {data.recent.map((r) => {
              const ss = SEND_STATUS[r.status] || { label: r.status, tone: "gray" as Tone };
              return (
                <li key={r.id} className="flex flex-col gap-1 py-2.5 text-sm sm:flex-row sm:items-center sm:gap-4">
                  <span className="min-w-0 flex-1 truncate text-slate-200">{r.subject}</span>
                  <span className="truncate text-xs text-slate-500 sm:w-56">{r.to_email}{r.kind === "test" ? " · test" : ""}</span>
                  <span className="flex items-center gap-3">
                    <Badge tone={ss.tone}>{ss.label}</Badge>
                    <span className="whitespace-nowrap text-xs text-slate-500">{fmtDateTime(r.created_at)}</span>
                  </span>
                  {r.error && r.status !== "skipped" && <span className="text-xs text-red-300 sm:hidden">{r.error}</span>}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {editing && (
        <Modal title={`${editing.seq.name}: dan ${editing.step.delay_days}`} onClose={() => setEditing(null)} wide>
          <StepEditor
            step={editing.step}
            audience={editing.seq.audience}
            address={s.footer_address}
            siteUrl={data.siteUrl}
            active={editing.seq.status === "active"}
            onSave={async (fields) => {
              const ok = await patch({ action: "updateStep", stepId: editing.step.id, ...fields }, "save", "Mejl je sačuvan.");
              if (ok) setEditing(null);
            }}
            saving={busy === "save"}
            onClose={() => setEditing(null)}
          />
        </Modal>
      )}

      {approving && (
        <Modal title={`Odobri: ${approving.name}`} onClose={() => setApproving(null)}>
          <div className="space-y-4 text-sm">
            <p className="text-slate-300">Ovi mejlovi će se slati automatski, svakom kontaktu najviše jednom:</p>
            <ul className="space-y-2">
              {approving.steps.filter((x) => x.enabled).map((x) => (
                <li key={x.id} className="flex gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2">
                  <b className="w-14 shrink-0 text-xs text-slate-400">Dan {x.delay_days}</b>
                  <span className="text-slate-200">{x.subject}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs leading-relaxed text-slate-400">
              Primaoci: {AUDIENCE_INFO[approving.audience].who} Hladni i odjavljeni kontakti se nikad ne uključuju. Ako kasnije izmijenite neki mejl, niz se pauzira dok ga ponovo ne odobrite.
            </p>
            {!s.sending_enabled && <Notice tone="info">Slanje je trenutno isključeno u postavkama. Niz će biti odobren, a mejlovi kreću tek kad uključite slanje.</Notice>}
            <div className="flex justify-end gap-2">
              <button onClick={() => setApproving(null)} className={btnGhost}>Odustani</button>
              <button
                onClick={async () => { const ok = await patch({ action: "approve", id: approving.id }, "approve", "Niz je odobren."); if (ok) setApproving(null); }}
                disabled={busy === "approve"}
                className={btnPrimary}
              >
                {busy === "approve" ? "Odobravam..." : "Odobravam"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {confirmEnable && (
        <Modal title="Uključiti automatsko slanje?" onClose={() => setConfirmEnable(false)}>
          <div className="space-y-4 text-sm text-slate-300">
            <p>Sistem će nekoliko puta dnevno slati mejlove iz odobrenih nizova, najviše {s.daily_limit} dnevno. Isključiti možete u svakom trenutku.</p>
            <ul className="list-disc space-y-1 pl-5 text-xs text-slate-400">
              {data.sequences.map((q) => <li key={q.id}>{q.name}: {SEQ_STATUS[q.status].label.toLowerCase()}</li>)}
            </ul>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmEnable(false)} className={btnGhost}>Odustani</button>
              <button
                onClick={async () => { const ok = await patch({ action: "settings", sending_enabled: true }, "enable", "Slanje je uključeno."); if (ok) setConfirmEnable(false); }}
                className={btnPrimary}
              >
                Uključi slanje
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function StepEditor({ step, audience, address, siteUrl, active, onSave, saving, onClose }: {
  step: Step; audience: SequenceAudience; address: string; siteUrl: string; active: boolean;
  onSave: (f: Record<string, unknown>) => void; saving: boolean; onClose: () => void;
}) {
  const [f, setF] = useState({
    delay_days: String(step.delay_days), subject: step.subject, preheader: step.preheader || "", heading: step.heading || "",
    body: step.body, cta_label: step.cta_label || "", cta_url: step.cta_url || "",
  });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((p) => ({ ...p, [k]: e.target.value }));
  const preview = useMemo(
    () => renderEmail({ subject: f.subject, preheader: f.preheader, heading: f.heading, body: f.body, cta_label: f.cta_label, cta_url: f.cta_url }, SAMPLE, { siteUrl, unsubscribeUrl: `${siteUrl}/odjava`, reason: AUDIENCE_INFO[audience].reason, address }),
    [f, audience, address, siteUrl]
  );

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <div className="space-y-3">
        <div className="grid grid-cols-[110px_1fr] gap-3">
          <label className={labelCls}>Dan slanja<input type="number" min={0} max={365} value={f.delay_days} onChange={set("delay_days")} className={`${inputCls} mt-1.5`} /></label>
          <label className={labelCls}>Naslov mejla (subject)<input value={f.subject} onChange={set("subject")} className={`${inputCls} mt-1.5`} /></label>
        </div>
        <label className={labelCls}>Kratki uvod (vidi se u inboxu pored naslova)<input value={f.preheader} onChange={set("preheader")} className={`${inputCls} mt-1.5`} /></label>
        <label className={labelCls}>Veliki naslov u mejlu<input value={f.heading} onChange={set("heading")} className={`${inputCls} mt-1.5`} /></label>
        <label className={labelCls}>
          Tekst
          <textarea value={f.body} onChange={set("body")} rows={11} className={`${inputCls} mt-1.5 resize-y font-mono text-[13px] leading-relaxed`} />
        </label>
        <p className="text-[11px] leading-relaxed text-slate-500">
          Prazan red = novi pasus · red koji počinje sa „- ” = stavka liste · **riječ** = podebljano · {TOKENS.map((t) => `${t.token} ${t.label.toLowerCase()}`).join(" · ")}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={labelCls}>Tekst dugmeta<input value={f.cta_label} onChange={set("cta_label")} className={`${inputCls} mt-1.5`} /></label>
          <label className={labelCls}>Link dugmeta<input value={f.cta_url} onChange={set("cta_url")} className={`${inputCls} mt-1.5`} /></label>
        </div>
        {active && <Notice tone="info">Niz je aktivan. Nakon izmjene se pauzira dok ga ponovo ne odobrite.</Notice>}
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className={btnGhost}>Odustani</button>
          <button onClick={() => onSave({ ...f, delay_days: Number(f.delay_days) })} disabled={saving} className={btnPrimary}>{saving ? "Čuvam..." : "Sačuvaj mejl"}</button>
        </div>
      </div>
      <div>
        <p className="mb-2 text-xs font-medium text-slate-400">Pregled (primjer: Harun, Studio Lana)</p>
        <div className="overflow-hidden rounded-[calc(var(--po-radius)*0.8)] border border-white/[0.08] bg-white">
          <div className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-[11px] text-gray-600">
            <b className="text-gray-900">{preview.subject}</b>
          </div>
          <iframe title="Pregled mejla" srcDoc={preview.html} sandbox="" className="h-[560px] w-full" />
        </div>
      </div>
    </div>
  );
}
