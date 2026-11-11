"use client";

import { useEffect, type ReactNode } from "react";
import Icon from "../../dashboard/_components/icons";

export const inputCls =
  "w-full rounded-[calc(var(--po-radius)*0.6)] border border-gray-700 bg-gray-950 px-3 py-2.5 text-base text-white outline-none transition placeholder:text-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 sm:text-sm";
export const labelCls = "block text-xs font-medium text-slate-300";
export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-[calc(var(--po-radius)*0.7)] bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50";
export const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-[calc(var(--po-radius)*0.7)] border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/5 disabled:opacity-50";
export const cardCls = "rounded-[var(--po-radius)] border border-white/[0.07] bg-gray-900/70";

export function PageHeader({ title, text, actions }: { title: string; text: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h2 className="font-display text-3xl font-bold tracking-tight text-white">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm text-slate-400">{text}</p>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

const TONES = {
  blue: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  green: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  amber: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  red: "border-red-500/30 bg-red-500/10 text-red-300",
  gray: "border-white/10 bg-white/[0.04] text-slate-400",
} as const;
export type Tone = keyof typeof TONES;

export function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold ${TONES[tone]}`}>{children}</span>;
}

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[var(--po-radius)] border border-white/[0.08] bg-gray-900 shadow-2xl sm:rounded-[var(--po-radius)] ${wide ? "sm:max-w-3xl" : "sm:max-w-lg"}`}>
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
          <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} aria-label="Zatvori" className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white">
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

export function Notice({ tone, children }: { tone: "ok" | "error" | "info"; children: ReactNode }) {
  const cls =
    tone === "ok"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
      : tone === "error"
        ? "border-red-500/30 bg-red-500/10 text-red-200"
        : "border-blue-500/25 bg-blue-500/[0.07] text-blue-100";
  return <div className={`rounded-[calc(var(--po-radius)*0.7)] border px-4 py-3 text-sm ${cls}`}>{children}</div>;
}

export function StatCard({ label, value, hint, tone = "blue", active, onClick }: { label: string; value: number | string; hint?: string; tone?: Tone; active?: boolean; onClick?: () => void }) {
  const dot = { blue: "bg-blue-400", green: "bg-emerald-400", amber: "bg-amber-400", red: "bg-red-400", gray: "bg-slate-500" }[tone];
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      aria-pressed={onClick ? !!active : undefined}
      className={`${cardCls} p-[var(--po-pad)] text-left transition ${onClick ? "hover:border-white/15" : ""} ${active ? "border-blue-500/50 ring-1 ring-blue-500/30" : ""}`}
    >
      <span className="flex items-center gap-2 text-xs font-medium text-slate-400">
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        {label}
      </span>
      <span className="mt-2 block font-display text-3xl font-bold text-white">{value}</span>
      {hint && <span className="mt-1 block text-[11px] leading-snug text-slate-500">{hint}</span>}
    </Comp>
  );
}
