const pad = value => String(value).padStart(2, '0');

export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function localTime(date = new Date()) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function localDateTime(date = new Date()) {
  return `${localDate(date)}T${localTime(date)}`;
}

export function parseDateTime(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toDateTime(date, time = '23:59') {
  if (!date) return '';
  return `${date}T${time || '23:59'}`;
}

export function addDays(date, amount) {
  const value = new Date(`${date}T00:00`);
  value.setDate(value.getDate() + amount);
  return localDate(value);
}

export function addMinutes(value, amount) {
  const date = value instanceof Date ? new Date(value) : parseDateTime(value);
  if (!date) return null;
  date.setMinutes(date.getMinutes() + amount);
  return date;
}

export function weekdayOf(date) {
  return (new Date(`${date}T00:00`).getDay() + 6) % 7;
}

export function weekEnd(date = localDate()) {
  const value = new Date(`${date}T00:00`);
  const index = (value.getDay() + 6) % 7;
  value.setDate(value.getDate() + 6 - index);
  return localDate(value);
}

export function nextWeekEnd(date = localDate()) {
  return addDays(weekEnd(date), 7);
}

export function nextWeekday(fromDate, days, time = '00:00', includeToday = true) {
  if (!days.length) return '';
  const start = localDate(new Date(`${fromDate}T00:00`));
  const startIndex = weekdayOf(start);
  let best = 99;

  days.forEach(day => {
    let diff = (day - startIndex + 7) % 7;
    if (diff === 0 && !includeToday) diff = 7;
    if (diff < best) best = diff;
  });

  return toDateTime(addDays(start, best), time || '00:00');
}

export function formatDateTime(value, lang) {
  const date = parseDateTime(value);
  if (!date) return '';
  return date.toLocaleString(lang === 'en' ? 'en-GB' : 'de-CH', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
