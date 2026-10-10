import Link from 'next/link';
import Icon from './icons';

export type ChecklistItem = { label: string; hint: string; done: boolean; href: string };

export default function SetupChecklist({ items }: { items: ChecklistItem[] }) {
  const doneCount = items.filter((item) => item.done).length;
  if (doneCount === items.length) return null;
  const pct = Math.round((doneCount / items.length) * 100);

  return (
    <section
      className="min-w-0 rounded-[var(--po-radius)] border border-blue-500/20 bg-gray-900/70 p-[var(--po-pad)] backdrop-blur"
      aria-label="Lista za početak"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
            <Icon name="star" className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-white">Pripremite biznis za prve klijente</h3>
            <p className="mt-0.5 text-xs text-slate-400">
              {doneCount} od {items.length} koraka završeno
            </p>
          </div>
        </div>
        <span className="text-sm font-bold tabular-nums text-blue-400">{pct}%</span>
      </div>

      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-blue-500 transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>

      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item.label}>
            <Link
              href={item.href}
              className="flex items-center gap-3 rounded-[calc(var(--po-radius)*0.6)] px-2 py-2 transition hover:bg-white/[0.04]"
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                  item.done ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400' : 'border-white/15 text-transparent'
                }`}
              >
                <Icon name="check" className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0">
                <span className={`block text-sm font-medium ${item.done ? 'text-slate-500 line-through' : 'text-white'}`}>
                  {item.label}
                </span>
                {!item.done && <span className="block truncate text-xs text-slate-400">{item.hint}</span>}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}