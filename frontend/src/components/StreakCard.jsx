import { Flame } from 'lucide-react';

export default function StreakCard({ label, current, longest }) {
  return (
    <div className="card px-4 py-3 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-orange-500/15 text-orange-400 flex items-center justify-center shrink-0">
        <Flame className="w-4.5 h-4.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-slate-300 truncate">{label}</p>
        <p className="text-xs text-slate-500">Best: {longest} days</p>
      </div>
      <span className="text-lg font-bold text-slate-50 tabular-nums shrink-0">{current}d</span>
    </div>
  );
}
