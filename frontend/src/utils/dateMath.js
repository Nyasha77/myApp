// All date arithmetic here is done in UTC and the result read back via the UTC
// getters/setters. Parsing 'YYYY-MM-DDT00:00:00' with no timezone suffix builds
// the Date in the *browser's local* timezone, so in any UTC+ zone (including
// this app's own default, Africa/Windhoek, UTC+2) toISOString() afterward
// silently lands on the wrong calendar day. Using the 'Z' suffix and UTC
// getters/setters throughout keeps the plain YYYY-MM-DD string the only thing
// that matters, with no local-timezone reinterpretation in between.

export function addDays(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function addDuration(dateStr, amount, unit) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  if (unit === 'days') d.setUTCDate(d.getUTCDate() + amount);
  else if (unit === 'weeks') d.setUTCDate(d.getUTCDate() + amount * 7);
  else if (unit === 'months') d.setUTCMonth(d.getUTCMonth() + amount);
  return d.toISOString().slice(0, 10);
}
