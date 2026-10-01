export default function XPBar({ level, currentXp, xpForNextLevel }) {
  const pct = xpForNextLevel > 0 ? Math.min(100, (currentXp / xpForNextLevel) * 100) : 0;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-sm font-semibold text-slate-200">Level {level}</span>
        <span className="text-xs text-slate-500 tabular-nums">
          {currentXp} / {xpForNextLevel} XP
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-surface-border overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent to-accent-hover transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
