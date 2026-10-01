import { useEffect, useState, useCallback, useMemo } from 'react';
import { Plus, Trophy, Target, TrendingUp, Minus, Dumbbell, Activity as ActivityIcon } from 'lucide-react';
import { getCategories } from '../api/categories';
import * as taskApi from '../api/tasks';
import * as activityApi from '../api/activities';
import * as benchmarkApi from '../api/benchmarks';
import * as stravaApi from '../api/strava';
import TaskCard from '../components/TaskCard';
import Modal from '../components/Modal';
import ActivityForm from '../components/ActivityForm';
import BenchmarkForm from '../components/BenchmarkForm';
import EmptyState from '../components/EmptyState';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { useToast } from '../context/ToastContext';
import { todayLocalISO } from '../utils/format';

export default function Gym() {
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [tasks, setTasks] = useState([]);
  const [personalBests, setPersonalBests] = useState([]);
  const [benchmarks, setBenchmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'activity' | 'benchmark' | null
  const [submitting, setSubmitting] = useState(false);
  const [busyTaskId, setBusyTaskId] = useState(null);
  const [stravaConnected, setStravaConnected] = useState(false);
  const [postDuration, setPostDuration] = useState(60);
  const [postNotes, setPostNotes] = useState('');
  const toast = useToast();
  const today = todayLocalISO();

  useEffect(() => {
    getCategories().then((cats) => {
      setCategories(cats);
      const fitness = cats.find((c) => c.name.toLowerCase() === 'fitness');
      setCategoryId(String((fitness || cats[0])?.id || ''));
    });
    stravaApi.getStravaStatus().then((s) => setStravaConnected(s.connected)).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    if (!categoryId) return;
    setLoading(true);
    const [taskRes, bests, bms] = await Promise.all([
      taskApi.getTasks(today),
      activityApi.getPersonalBests(categoryId),
      benchmarkApi.getBenchmarks(categoryId),
    ]);
    setTasks(taskRes.tasks.filter((t) => String(t.category_id) === String(categoryId)));
    setPersonalBests(bests);
    setBenchmarks(bms);
    setLoading(false);
  }, [categoryId, today]);

  useEffect(() => {
    load();
  }, [load]);

  const suggestions = useMemo(() => {
    const map = new Map();
    personalBests.forEach((pb) => {
      if (!map.has(pb.activityName)) map.set(pb.activityName, []);
      map.get(pb.activityName).push({ name: pb.metricName, unit: pb.unit });
    });
    return [...map.entries()].map(([activityName, metrics]) => ({ activityName, metrics }));
  }, [personalBests]);

  const handleToggleTask = async (task) => {
    setBusyTaskId(task.id);
    try {
      if (task.completed) {
        await taskApi.uncompleteTask(task.id, today);
      } else {
        const result = await taskApi.completeTask(task.id, today);
        toast.xp(result.xpEarned, task.title);
        if (result.progression.leveledUp) toast.levelUp(result.progression.previousLevel, result.progression.level);
        result.newAchievements?.forEach((a) => toast.achievement(a));
      }
      await load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong');
    } finally {
      setBusyTaskId(null);
    }
  };

  const handleLogActivity = async (data) => {
    setSubmitting(true);
    try {
      const result = await activityApi.createActivity(data);
      setModal(null);
      result.comparisons?.forEach((c) => {
        if (c.isPersonalBest && c.hasPrevious) toast.stat(`${data.activityName} ${c.metricName} PB`, c.improvementPct);
      });
      result.newAchievements?.forEach((a) => toast.achievement(a));
      await load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not log result');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePostToStrava = async () => {
    setSubmitting(true);
    try {
      const completedTitles = tasks.filter((t) => t.completed).map((t) => t.title).join(', ');
      await stravaApi.postWorkoutToStrava({
        name: completedTitles || 'Gym session',
        durationMinutes: Number(postDuration),
        notes: postNotes || undefined,
      });
      setModal(null);
      setPostNotes('');
      toast.info('Posted to Strava');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not post to Strava');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateBenchmark = async (data) => {
    setSubmitting(true);
    try {
      await benchmarkApi.createBenchmark({ ...data, categoryId });
      setModal(null);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not save benchmark');
    } finally {
      setSubmitting(false);
    }
  };

  if (categories.length === 0 && !loading) {
    return (
      <EmptyState
        icon={Dumbbell}
        title="No categories yet."
        subtitle="Create a category (e.g. Fitness) before tracking exercises here."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-50">Gym</h1>
        {categories.length > 1 && (
          <select
            className="input !w-auto !min-h-[36px] !py-1.5 text-sm"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <LoadingSkeleton rows={4} />
      ) : (
        <>
          {tasks.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-slate-100">Today</h2>
                {stravaConnected && tasks.some((t) => t.completed) && (
                  <button type="button" onClick={() => setModal('strava')} className="btn-secondary !min-h-[36px] !py-1.5 !px-3">
                    <ActivityIcon className="w-4 h-4" /> Post to Strava
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    busy={busyTaskId === task.id}
                    onToggle={handleToggleTask}
                    onEdit={() => {}}
                    onDelete={async () => {
                      await taskApi.deleteTask(task.id);
                      await load();
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-slate-100">Personal bests</h2>
              <button type="button" onClick={() => setModal('activity')} className="btn-secondary !min-h-[36px] !py-1.5 !px-3">
                <Plus className="w-4 h-4" /> Log
              </button>
            </div>

            {personalBests.length === 0 ? (
              <EmptyState
                icon={Trophy}
                title="No results logged yet."
                subtitle="Log your first set to start tracking personal bests for each exercise."
                action={
                  <button type="button" onClick={() => setModal('activity')} className="btn-primary">
                    <Plus className="w-4 h-4" /> Log a result
                  </button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {personalBests.map((pb) => {
                  const trendUp = pb.hasPrevious && pb.improvementPct > 0;
                  const trendDown = pb.hasPrevious && pb.improvementPct < 0;
                  return (
                    <div key={`${pb.activityName}-${pb.metricName}`} className="card p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-slate-100">{pb.activityName}</p>
                        <span className="text-xs text-slate-500">{pb.metricName}</span>
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-2xl font-bold text-slate-50 tabular-nums">
                            {pb.latestValue}
                            <span className="text-sm font-normal text-slate-500 ml-1">{pb.unit}</span>
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Best: {pb.bestValue} {pb.unit}
                          </p>
                        </div>
                        {pb.hasPrevious && (
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                              trendUp
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : trendDown
                                ? 'bg-red-500/15 text-red-400'
                                : 'bg-surface-raised text-slate-400'
                            }`}
                          >
                            {trendUp && <TrendingUp className="w-3 h-3" />}
                            {!trendUp && !trendDown && <Minus className="w-3 h-3" />}
                            {trendUp || trendDown ? `${Math.abs(pb.improvementPct)}%` : 'even'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-slate-100">Benchmarks</h2>
              <button type="button" onClick={() => setModal('benchmark')} className="btn-secondary !min-h-[36px] !py-1.5 !px-3">
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
            {benchmarks.length === 0 ? (
              <EmptyState icon={Target} title="No targets set." subtitle="Define a goal, like a 100kg bench press." />
            ) : (
              <div className="space-y-2">
                {benchmarks.map((b) => (
                  <div key={b.id} className="card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-slate-100">{b.activity_name} &middot; {b.metric_name}</p>
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
        </>
      )}

      <Modal open={modal === 'activity'} onClose={() => setModal(null)} title="Log a result">
        <ActivityForm
          categories={categories}
          fixedCategoryId={categoryId}
          suggestions={suggestions}
          onSubmit={handleLogActivity}
          onCancel={() => setModal(null)}
          submitting={submitting}
        />
      </Modal>
      <Modal open={modal === 'benchmark'} onClose={() => setModal(null)} title="New benchmark">
        <BenchmarkForm onSubmit={handleCreateBenchmark} onCancel={() => setModal(null)} submitting={submitting} />
      </Modal>
      <Modal open={modal === 'strava'} onClose={() => setModal(null)} title="Post to Strava">
        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="strava-duration">Duration (minutes)</label>
            <input
              id="strava-duration"
              type="number"
              min="1"
              className="input"
              value={postDuration}
              onChange={(e) => setPostDuration(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="strava-notes">Notes (optional)</label>
            <textarea
              id="strava-notes"
              className="input min-h-[80px]"
              value={postNotes}
              onChange={(e) => setPostNotes(e.target.value)}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1">Cancel</button>
            <button type="button" onClick={handlePostToStrava} disabled={submitting} className="btn-primary flex-1">
              {submitting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
