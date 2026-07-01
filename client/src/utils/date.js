// Parse a date string safely in local time.
// DATE-only strings (YYYY-MM-DD) are treated as UTC midnight by the JS engine,
// which flips them to the previous day in timezones west of UTC.
// Appending T12:00:00 anchors them at local noon so they never cross a day boundary.
export function parseDate(dateStr) {
  if (!dateStr) return null;
  const s = String(dateStr).slice(0, 10); // take YYYY-MM-DD part
  return new Date(s + 'T12:00:00');
}

export function formatDate(dateStr, opts = { month: 'short', day: 'numeric', year: 'numeric' }) {
  const d = parseDate(dateStr);
  return d ? d.toLocaleDateString('en-US', opts) : '';
}

export function toDateInput(dateStr) {
  if (!dateStr) return '';
  const d = parseDate(dateStr);
  if (!d) return '';
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

export function localDateString(date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}
