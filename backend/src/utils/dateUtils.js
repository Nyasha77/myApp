const env = require('../config/env');

/**
 * Returns YYYY-MM-DD for "now" in the given IANA timezone.
 * Used to decide which calendar date a task/activity/completion belongs to,
 * instead of blindly using UTC.
 */
function todayInTimezone(timezone = env.defaultTimezone) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date()); // en-CA gives YYYY-MM-DD
}

function daysBetween(dateStrA, dateStrB) {
  const a = new Date(`${dateStrA}T00:00:00Z`);
  const b = new Date(`${dateStrB}T00:00:00Z`);
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

function addDays(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function isValidDateString(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

module.exports = { todayInTimezone, daysBetween, addDays, isValidDateString };
