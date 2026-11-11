'use client';

import { useMemo, useRef, useState, type ReactNode } from 'react';
import { BOARD_COLUMNS, columnOf, dropAction, sortForColumn, statusKind, type BoardColumn, type ReservationAction } from '../../../utils/reservationFlow';
import { dayMonthTime } from '../_lib/dates';

export type BoardReservation = {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  service_name: string | null;
  reservation_date: string | null;
  price: string | number | null;
  status: string | null;
};

const COLUMN_STYLE: Record<BoardColumn, { dot: string; ring: string; head: string }> = {
  pending: { dot: 'bg-amber-400', ring: 'ring-amber-400/40', head: 'text-amber-300' },
  confirmed: { dot: 'bg-emerald-400', ring: 'ring-emerald-400/40', head: 'text-emerald-300' },
  completed: { dot: 'bg-blue-400', ring: 'ring-blue-400/40', head: 'text-blue-300' },
  cancelled: { dot: 'bg-red-400', ring: 'ring-red-400/40', head: 'text-red-300' },
};

const PREVIEW = 20; // završene i otkazane: koliko se prikazuje prije "Prikaži još"

const priceLabel = (price: string | number | null) =>
  price != null && price !== '' ? (String(price).includes('KM') ? String(price) : `${price} KM`) : '';

export default function Board({
  reservations,
  busyId,
  highlightId,
  onAction,
  renderActions,
}: {
  reservations: BoardReservation[];
  busyId: string;
  highlightId: string;
  onAction: (id: string, action: ReservationAction) => Promise<void>;
  renderActions: (r: BoardReservation) => ReactNode;
}) {
  const [dragId, setDragId] = useState('');
  const [over, setOver] = useState<BoardColumn | ''>('');
  const [mobileCol, setMobileCol] = useState<BoardColumn>('pending');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [hint, setHint] = useState('');
  const scroller = useRef<HTMLDivElement>(null);

  const columns = useMemo(() => {
    const map: Record<BoardColumn, BoardReservation[]> = { pending: [], confirmed: [], completed: [], cancelled: [] };
    for (const r of reservations) map[columnOf(r.status)].push(r);
    for (const c of BOARD_COLUMNS) map[c.id] = sortForColumn(map[c.id], c.id);
    return map;
  }, [reservations]);

  const dragged = reservations.find((r) => r.id === dragId);

  const drop = async (target: BoardColumn) => {
    const r = dragged;
    setOver('');
    setDragId('');
    if (!r) return;
    const action = dropAction(r.status, target);
    if (!action) {
      if (columnOf(r.status) !== target) setHint('Ovaj termin se ne može prebaciti u tu kolonu.');
      return;
    }
    setHint('');
    await onAction(r.id, action);
  };

  // Mobitel: tab iznad skrola pomjera na kolonu (i obrnuto, skrol mijenja aktivni tab).
  const goTo = (id: BoardColumn) => {
    setMobileCol(id);
    const el = scroller.current?.querySelector<HTMLElement>(`[data-col="${id}"]`);
    el?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
  };
  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / (el.scrollWidth / BOARD_COLUMNS.length));
    const id = BOARD_COLUMNS[Math.max(0, Math.min(BOARD_COLUMNS.length - 1, idx))].id;
    if (id !== mobileCol) setMobileCol(id);
  };

  const card = (r: BoardReservation, column: BoardColumn) => {
    const canDrag = BOARD_COLUMNS.some((c) => dropAction(r.status, c.id));
    const date = r.reservation_date ? new Date(r.reservation_date) : null;
    const resched = statusKind(r.status) === 'rescheduling';
    const expired = statusKind(r.status) === 'expired';
    const past = date && column !== 'completed' && column !== 'cancelled' && date.getTime() < Date.now();
    return (
      <article
        key={r.id}
        draggable={canDrag}
        onDragStart={(e) => { setDragId(r.id); setHint(''); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', r.id); }}
        onDragEnd={() => { setDragId(''); setOver(''); }}
        className={`animate-board-pop group rounded-[calc(var(--po-radius)*0.8)] border bg-gray-950/70 p-3.5 shadow-sm transition ${
          canDrag ? 'lg:cursor-grab lg:active:cursor-grabbing' : ''
        } ${dragId === r.id ? 'scale-[0.98] opacity-40' : 'hover:border-white/15'} ${
          highlightId === r.id ? 'border-blue-500' : 'border-white/[0.07]'
        } ${busyId === r.id ? 'opacity-60' : ''}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{r.customer_name || 'Klijent'}</p>
            <p className="mt-0.5 truncate text-xs text-slate-400">{r.service_name || 'Usluga'}</p>
          </div>
          {priceLabel(r.price) && <span className="shrink-0 text-xs font-bold text-white">{priceLabel(r.price)}</span>}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
          {date && <span className={past ? 'font-semibold text-amber-300' : 'text-slate-300'}>{dayMonthTime(date)}</span>}
          {r.customer_phone && (
            <a href={`tel:${r.customer_phone.replace(/[^\d+]/g, '')}`} className="text-blue-300 hover:text-blue-200">{r.customer_phone}</a>
          )}
          {resched && <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 font-semibold text-violet-300">Dogovor termina</span>}
          {expired && <span className="rounded-full border border-white/10 px-2 py-0.5 font-semibold text-slate-400">Isteklo</span>}
        </div>
        {(column === 'pending' || column === 'confirmed') && (
          <div className="mt-3 flex flex-wrap gap-2 border-t border-white/[0.06] pt-3 [&>button]:min-h-10 [&>button]:flex-1 lg:[&>button]:min-h-9">
            {renderActions(r)}
          </div>
        )}
      </article>
    );
  };

  const column = (c: (typeof BOARD_COLUMNS)[number], mobile: boolean) => {
    const rows = columns[c.id];
    const limited = (c.id === 'completed' || c.id === 'cancelled') && !expanded[c.id] ? rows.slice(0, PREVIEW) : rows;
    const valid = !!dragged && !!dropAction(dragged.status, c.id);
    const style = COLUMN_STYLE[c.id];
    return (
      <section
        key={c.id}
        data-col={c.id}
        aria-label={c.label}
        onDragOver={(e) => { if (valid) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (over !== c.id) setOver(c.id); } }}
        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(''); }}
        onDrop={(e) => { e.preventDefault(); drop(c.id); }}
        className={`flex min-w-0 flex-col rounded-[var(--po-radius)] border bg-gray-900/60 transition ${
          mobile ? 'w-[86vw] max-w-sm shrink-0 snap-start' : ''
        } ${over === c.id ? `border-transparent ring-2 ${style.ring} bg-gray-900/90` : dragged && valid ? 'border-dashed border-white/20' : 'border-white/[0.07]'}`}
      >
        <header className="flex items-center justify-between gap-2 px-4 pb-2 pt-4">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${style.dot}`} />
            <h3 className={`text-sm font-semibold ${style.head}`}>{c.label}</h3>
            <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] font-semibold text-slate-300">{rows.length}</span>
          </div>
          <span className="text-[11px] text-slate-500">{c.hint}</span>
        </header>
        <div className={`flex flex-1 flex-col gap-2.5 px-3 pb-3 ${mobile ? '' : 'max-h-[70vh] overflow-y-auto'}`}>
          {rows.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/[0.08] px-3 py-8 text-center text-xs text-slate-500">
              {dragged && valid ? 'Spustite ovdje' : 'Nema termina'}
            </p>
          ) : (
            limited.map((r) => card(r, c.id))
          )}
          {limited.length < rows.length && (
            <button onClick={() => setExpanded((p) => ({ ...p, [c.id]: true }))} className="rounded-lg py-2 text-xs font-medium text-slate-400 hover:bg-white/5 hover:text-white">
              Prikaži još {rows.length - limited.length}
            </button>
          )}
        </div>
      </section>
    );
  };

  return (
    <div className="space-y-3">
      <p className="hidden text-xs text-slate-500 lg:block">Prevucite karticu u drugu kolonu da promijenite status, ili koristite dugmad na kartici.</p>
      {hint && <p role="status" className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">{hint}</p>}

      {/* Računar: sve kolone odjednom, s prevlačenjem */}
      <div className="hidden gap-3 lg:grid lg:grid-cols-4">{BOARD_COLUMNS.map((c) => column(c, false))}</div>

      {/* Mobitel: tabovi + kolone koje se listaju prstom */}
      <div className="lg:hidden">
        <div className="-mx-3 mb-3 flex gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none]">
          {BOARD_COLUMNS.map((c) => (
            <button
              key={c.id}
              onClick={() => goTo(c.id)}
              aria-pressed={mobileCol === c.id}
              className={`flex min-h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-xs font-semibold transition ${
                mobileCol === c.id ? 'border-blue-500 bg-blue-500 text-white' : 'border-white/10 bg-gray-900 text-slate-400'
              }`}
            >
              {c.label}
              <span className={`rounded-full px-1.5 text-[10px] ${mobileCol === c.id ? 'bg-white/20' : 'bg-white/[0.06]'}`}>{columns[c.id].length}</span>
            </button>
          ))}
        </div>
        <div ref={scroller} onScroll={onScroll} className="-mx-3 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-3 pb-2 [scrollbar-width:none]">
          {BOARD_COLUMNS.map((c) => column(c, true))}
        </div>
      </div>
    </div>
  );
}
