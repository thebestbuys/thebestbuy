// Recurring public/gift holidays, surfaced as automatic occasion reminders.
// Dates are France-oriented (the app targets Amazon.fr): some are fixed, others
// are computed (Mother's/Father's/Grandmothers' Day fall on specific Sundays).

function nthSunday(year, month, n) {
  const first = new Date(year, month, 1);
  const offset = (7 - first.getDay()) % 7; // days until first Sunday
  return new Date(year, month, 1 + offset + (n - 1) * 7);
}

function lastSunday(year, month) {
  const last = new Date(year, month + 1, 0); // last day of month
  return new Date(year, month, last.getDate() - last.getDay());
}

// Anonymous Gregorian Computus → Easter Sunday.
function easter(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month, day);
}

// France: last Sunday of May, unless it is Pentecost (Easter+49) → first Sunday of June.
function frMothersDay(year) {
  const may = lastSunday(year, 4);
  const pentecost = new Date(easter(year));
  pentecost.setDate(pentecost.getDate() + 49);
  if (may.getTime() === pentecost.getTime()) return nthSunday(year, 5, 1);
  return may;
}

function defsForYear(year) {
  return [
    { key: 'newYear', emoji: '🎉', date: new Date(year, 0, 1) },
    { key: 'valentine', emoji: '❤️', date: new Date(year, 1, 14) },
    { key: 'grandmothersDay', emoji: '💐', date: nthSunday(year, 2, 1) }, // 1st Sun of March
    { key: 'mothersDay', emoji: '💐', date: frMothersDay(year) },
    { key: 'fathersDay', emoji: '👔', date: nthSunday(year, 5, 3) }, // 3rd Sun of June
    { key: 'halloween', emoji: '🎃', date: new Date(year, 9, 31) },
    { key: 'christmas', emoji: '🎄', date: new Date(year, 11, 25) },
  ];
}

// Upcoming holidays within `within` days, each with { key, emoji, days }.
export function upcomingHolidays(within = 92, now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const all = [...defsForYear(now.getFullYear()), ...defsForYear(now.getFullYear() + 1)];
  const seen = new Set();
  const out = [];
  for (const h of all.sort((a, b) => a.date - b.date)) {
    const days = Math.round((h.date - today) / 86400000);
    if (days < 0 || days > within) continue;
    if (seen.has(h.key)) continue; // soonest occurrence only
    seen.add(h.key);
    out.push({ key: h.key, emoji: h.emoji, days });
  }
  return out.sort((a, b) => a.days - b.days);
}
