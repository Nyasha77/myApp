export function formatDate(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export function todayLocalISO() {
  const now = new Date();
  const tzOffset = now.getTimezoneOffset() * 60000;
  return new Date(now - tzOffset).toISOString().slice(0, 10);
}

export function formatNumber(n) {
  return new Intl.NumberFormat().format(n);
}

export function progressBand(pct) {
  if (pct >= 81) return { label: 'Excellent', className: 'bg-emerald-500' };
  if (pct >= 61) return { label: 'Strong', className: 'bg-cyan-500' };
  if (pct >= 41) return { label: 'Moderate', className: 'bg-amber-500' };
  if (pct >= 21) return { label: 'Low', className: 'bg-orange-500' };
  return { label: 'Very low', className: 'bg-slate-600' };
}
