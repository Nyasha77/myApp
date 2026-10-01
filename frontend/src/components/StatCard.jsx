const STAT_ICON_COLORS = {
  Strength: 'text-red-400',
  Intelligence: 'text-blue-400',
  Discipline: 'text-purple-400',
  Endurance: 'text-emerald-400',
  Focus: 'text-cyan-400',
  Consistency: 'text-amber-400',
};

export default function StatCard({ statName, value }) {
  const colorClass = STAT_ICON_COLORS[statName] || 'text-accent';
  return (
    <div className="card px-4 py-3 flex items-center justify-between">
      <span className="text-sm text-slate-400">{statName}</span>
      <span className={`text-lg font-bold tabular-nums ${colorClass}`}>{Math.round(value)}</span>
    </div>
  );
}
