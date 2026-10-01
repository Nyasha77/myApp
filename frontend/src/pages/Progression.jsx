import { useEffect, useState, useCallback } from 'react';
import { Plus, Trophy, Target, Activity as ActivityIcon } from 'lucide-react';
import * as progressionApi from '../api/progression';
import * as achievementsApi from '../api/achievements';
import * as benchmarkApi from '../api/benchmarks';
import * as activityApi from '../api/activities';
import { getCategories } from '../api/categories';
import XPBar from '../components/XPBar';
import StatCard from '../components/StatCard';
import StreakCard from '../components/StreakCard';
import AchievementCard from '../components/AchievementCard';
import Modal from '../components/Modal';
import BenchmarkForm from '../components/BenchmarkForm';
import ActivityForm from '../components/ActivityForm';
import EmptyState from '../components/EmptyState';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { useToast } from '../context/ToastContext';

export default function Progression() {
  const [progression, setProgression] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [benchmarks, setBenchmarks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'benchmark' | 'activity' | null
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const load = useCallback(async () => {
    const [prog, ach, bm, act, cats] = await Promise.all([
      progressionApi.getProgression(),
      achievementsApi.getAchievements(),
      benchmarkApi.getBenchmarks(),
      activityApi.getActivities({ limit: 10 }),
      getCategories(),
    ]);
    setProgression(prog);
    setAchievements(ach);
    setBenchmarks(bm);
    setActivities(act);
    setCategories(cats);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreateBenchmark = async (data) => {
    setSubmitting(true);
    try {
      await benchmarkApi.createBenchmark(data);
      setModal(null);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not save benchmark');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogActivity = async (data) => {
    setSubmitting(true);
    try {
      const result = await activityApi.createActivity(data);
      setModal(null);
      result.comparisons?.forEach((c) => {
        if (c.isPersonalBest) toast.stat(`${c.metricName} PB`, c.improvementPct);
      });
      result.newAchievements?.forEach((a) => toast.achievement(a));
      await load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not log activity');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !progression) return <LoadingSkeleton rows={5} />;

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-50">Progression</h1>

      <div className="card p-5">
        <XPBar level={progression.progression.level} currentXp={progression.progression.currentXp} xpForNextLevel={progression.progression.xpForNextLevel} />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-100 mb-3">Stats</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {progression.stats.map((s) => (
            <StatCard key={s.stat_name} statName={s.stat_name} value={s.value} />
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-100 mb-3">Streaks</h2>
        <div className="space-y-2">
          {progression.streaks.map((s) => (
            <StreakCard
              key={s.id}
              label={s.streak_type === 'overall' ? 'Overall' : s.category_name || 'Category'}
              current={s.current_streak}
              longest={s.longest_streak}
            />
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-100">Achievements</h2>
          <span className="text-xs text-slate-500">{unlockedCount}/{achievements.length}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {achievements.map((a) => (
            <AchievementCard key={a.id} achievement={a} />
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-100">Benchmarks</h2>
          <button type="button" onClick={() => setModal('benchmark')} className="btn-secondary !min-h-[36px] !py-1.5 !px-3">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
        {benchmarks.length === 0 ? (
          <EmptyState icon={Target} title="No benchmarks set." subtitle="Define a personal target, like a 5k time or a lift goal." />
        ) : (
          <div className="space-y-2">
            {benchmarks.map((b) => (
              <div key={b.id} className="card p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-slate-100">{b.activity_name} · {b.metric_name}</p>
                  <Trophy className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex items-center justify-between text-sm text-slate-400 mb-1.5">
                  <span>{b.currentValue ?? '—'} {b.target_unit}</span>
                  <span>Target: {b.target_value} {b.target_unit}</span>
                </div>
                <div className="h-2 rounded-full bg-surface-border overflow-hidden">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${b.progressPct}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-100">Recent activity</h2>
          <button type="button" onClick={() => setModal('activity')} className="btn-secondary !min-h-[36px] !py-1.5 !px-3">
            <Plus className="w-4 h-4" /> Log
          </button>
        </div>
        {activities.length === 0 ? (
          <EmptyState icon={ActivityIcon} title="No performance history yet." subtitle="Log a result to start tracking your improvement over time." />
        ) : (
          <div className="space-y-2">
            {activities.map((a) => (
              <div key={a.id} className="card p-3.5">
                <p className="font-medium text-slate-100">{a.activity_name}</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {a.metrics.map((m) => (
                    <span key={m.name} className="text-xs text-slate-400 bg-surface-raised px-2 py-0.5 rounded-full">
                      {m.name}: {m.value}{m.unit ? ` ${m.unit}` : ''}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={modal === 'benchmark'} onClose={() => setModal(null)} title="New benchmark">
        <BenchmarkForm onSubmit={handleCreateBenchmark} onCancel={() => setModal(null)} submitting={submitting} />
      </Modal>
      <Modal open={modal === 'activity'} onClose={() => setModal(null)} title="Log a result">
        <ActivityForm categories={categories} onSubmit={handleLogActivity} onCancel={() => setModal(null)} submitting={submitting} />
      </Modal>
    </div>
  );
}
