import { useEffect, useState, useCallback } from 'react';
import { Flame, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import * as analyticsApi from '../api/analytics';
import PerformanceChart from '../components/PerformanceChart';
import CategoryBreakdownBars from '../components/CategoryBreakdownBars';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import { todayLocalISO } from '../utils/format';

const RANGES = [
  { key: 'weekly', label: 'Week' },
  { key: 'monthly', label: 'Month' },
];

export default function Statistics() {
  const [range, setRange] = useState('weekly');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const today = todayLocalISO();
    let result;
    if (range === 'weekly') {
      result = await analyticsApi.getWeekly(today);
    } else {
      result = await analyticsApi.getMonthly(parseInt(today.slice(0, 4), 10), parseInt(today.slice(5, 7), 10));
    }
    setStats(result);
    setLoading(false);
  }, [range]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-50">Statistics</h1>
        <div className="flex bg-surface-raised rounded-xl p-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRange(r.key)}
              className={`px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                range === r.key ? 'bg-accent text-white' : 'text-slate-400'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {loading || !stats ? (
        <LoadingSkeleton rows={4} />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatTile label="Avg. progress" value={`${Math.round(stats.avgProgress)}%`} />
            <StatTile label="Total XP" value={stats.totalXp} />
            <StatTile label="Tasks done" value={`${stats.totalCompleted}/${stats.totalTasks}`} />
            <StatTile label="Current streak" value={`${stats.currentStreak}d`} icon={Flame} />
          </div>

          <div className="card p-4">
            <h2 className="font-semibold text-slate-100 mb-3">Daily progress</h2>
            <PerformanceChart
              data={stats.dailySeries}
              dataKey="progress"
              xKey="date"
              valueFormatter={(v) => `${v}%`}
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
            />
          </div>

          <div className="card p-4">
            <h2 className="font-semibold text-slate-100 mb-3">XP earned</h2>
            <PerformanceChart data={stats.dailySeries} dataKey="xp" xKey="date" color="#c98500" />
          </div>

          <div className="card p-4">
            <h2 className="font-semibold text-slate-100 mb-3">Category breakdown</h2>
            <CategoryBreakdownBars data={stats.categoryBreakdown} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Most active</p>
                <p className="font-semibold text-slate-100">{stats.mostActiveCategory || '—'}</p>
              </div>
            </div>
            <div className="card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-500/15 text-slate-400 flex items-center justify-center">
                <TrendingDown className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Least active</p>
                <p className="font-semibold text-slate-100">{stats.leastActiveCategory || '—'}</p>
              </div>
            </div>
          </div>

          {stats.totalTasks === 0 && (
            <EmptyState icon={BarChart3} title="Not enough data yet" subtitle="Complete a few quests and check back here." />
          )}
        </>
      )}
    </div>
  );
}

function StatTile({ label, value, icon: Icon }) {
  return (
    <div className="card px-4 py-3.5">
      <div className="flex items-center gap-1.5 mb-1">
        {Icon && <Icon className="w-3.5 h-3.5 text-orange-400" />}
        <p className="text-xs text-slate-500">{label}</p>
      </div>
      <p className="text-xl font-bold text-slate-50 tabular-nums">{value}</p>
    </div>
  );
}
