// Vlastiti nazivi dana i mjeseci (bosanski) i 24-satno vrijeme.
// Neki preglednici nemaju bosanske locale podatke pa prikažu "M10" ili AM/PM.

const MONTHS_SHORT = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
const MONTHS_LONG = ['januar', 'februar', 'mart', 'april', 'maj', 'juni', 'juli', 'august', 'septembar', 'oktobar', 'novembar', 'decembar'];
const WEEKDAYS_SHORT = ['Ned', 'Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub'];
const WEEKDAYS_LONG = ['nedjelja', 'ponedjeljak', 'utorak', 'srijeda', 'četvrtak', 'petak', 'subota'];

const pad = (n: number) => String(n).padStart(2, '0');

export const weekdayShort = (d: Date) => WEEKDAYS_SHORT[d.getDay()];
export const monthShort = (d: Date) => MONTHS_SHORT[d.getMonth()];
export const timeOf = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** "subota, 10. oktobar" */
export const longToday = (d: Date = new Date()) => `${WEEKDAYS_LONG[d.getDay()]}, ${d.getDate()}. ${MONTHS_LONG[d.getMonth()]}`;

/** "Pon, 12. okt u 09:00" */
export const shortDateTime = (d: Date) => `${weekdayShort(d)}, ${d.getDate()}. ${monthShort(d)} u ${timeOf(d)}`;

/** "12. okt, 09:00" */
export const dayMonthTime = (d: Date) => `${d.getDate()}. ${monthShort(d)}, ${timeOf(d)}`;

/** "12. okt 2026, 09:00" */
export const fullDate = (d: Date) => `${d.getDate()}. ${monthShort(d)} ${d.getFullYear()}, ${timeOf(d)}`;