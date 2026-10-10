'use client';

const pad = (n: number) => String(n).padStart(2, '0');

const selectClass =
  'w-full cursor-pointer rounded-[calc(var(--po-radius)*0.6)] border border-gray-700 bg-gray-950 px-3 py-2.5 text-base tabular-nums text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 sm:text-sm';

/**
 * 24-satni izbor vremena (bez AM/PM), neovisno o jeziku preglednika.
 * value i onChange koriste format "HH:mm" (prazan string = nije postavljeno).
 */
export default function TimeInput24({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [hour = '', minute = ''] = value ? value.slice(0, 5).split(':') : [];

  const hours = Array.from({ length: 24 }, (_, i) => pad(i));
  const minutes = Array.from({ length: 12 }, (_, i) => pad(i * 5));
  // ako je u bazi neka "neokrugla" minuta (npr. 07), ne gubimo je
  if (minute && !minutes.includes(minute)) minutes.push(minute);
  minutes.sort();

  const update = (nextHour: string, nextMinute: string) =>
    onChange(nextHour === '' ? '' : `${nextHour}:${nextMinute || '00'}`);

  return (
    <div className="block text-xs font-medium text-slate-300">
      <span id={`${label}-label`}>{label}</span>
      <div className="mt-2 flex items-center gap-2" role="group" aria-labelledby={`${label}-label`}>
        <select
          value={hour}
          onChange={(event) => update(event.target.value, minute)}
          aria-label={`${label}: sati`}
          className={selectClass}
        >
          <option value="">--</option>
          {hours.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <span className="text-lg font-semibold text-slate-400" aria-hidden="true">
          :
        </span>
        <select
          value={hour ? minute || '00' : ''}
          onChange={(event) => update(hour, event.target.value)}
          disabled={!hour}
          aria-label={`${label}: minute`}
          className={`${selectClass} disabled:opacity-40`}
        >
          {!hour && <option value="">--</option>}
          {minutes.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}