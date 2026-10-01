import { useTheme } from '../context/ThemeContext';
import { assignCategoricalColors } from '../utils/chartPalette';

export default function CategoryBreakdownBars({ data }) {
  const { resolvedTheme } = useTheme();

  if (!data || data.length === 0) {
    return <p className="text-sm text-slate-500 py-6 text-center">No category activity in this period yet</p>;
  }

  const colors = assignCategoricalColors(data.map((d) => d.category), resolvedTheme);
  const max = Math.max(...data.map((d) => d.xp), 1);

  return (
    <div className="space-y-2.5">
      {data.map((d, i) => (
        <div key={d.category}>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-slate-300">{d.category}</span>
            <span className="text-slate-500 tabular-nums">{d.xp} XP</span>
          </div>
          <div className="h-2 rounded-full bg-surface-border overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${(d.xp / max) * 100}%`, backgroundColor: colors[i] }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
