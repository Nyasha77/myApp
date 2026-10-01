import { useEffect, useState, useCallback } from 'react';
import { Plus, ListChecks, Flame } from 'lucide-react';
import { getDashboard } from '../api/dashboard';
import * as taskApi from '../api/tasks';
import { getCategories } from '../api/categories';
import ProgressRing from '../components/ProgressRing';
import XPBar from '../components/XPBar';
import StatCard from '../components/StatCard';
import TaskCard from '../components/TaskCard';
import EmptyState from '../components/EmptyState';
import LoadingSkeleton from '../components/LoadingSkeleton';
import Modal from '../components/Modal';
import TaskForm from '../components/TaskForm';
import { getCategoryColor } from '../utils/colors';
import { DynamicIcon } from '../utils/icons.jsx';
import { useToast } from '../context/ToastContext';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalTask, setModalTask] = useState(undefined); // undefined = closed, null = new, object = edit
  const [submitting, setSubmitting] = useState(false);
  const [busyTaskId, setBusyTaskId] = useState(null);
  const toast = useToast();

  const load = useCallback(async () => {
    const [dashboard, cats] = await Promise.all([getDashboard(), getCategories()]);
    setData(dashboard);
    setCategories(cats);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggle = async (task) => {
    setBusyTaskId(task.id);
    try {
      if (task.completed) {
        await taskApi.uncompleteTask(task.id, data.date);
      } else {
        const result = await taskApi.completeTask(task.id, data.date);
        toast.xp(result.xpEarned, task.title);
        if (result.progression.leveledUp) toast.levelUp(result.progression.previousLevel, result.progression.level);
        result.statChanges.forEach((s) => toast.stat(s.statName, s.delta));
        if (result.isComeback) toast.xp(result.comebackBonus, 'Comeback bonus!');
        result.newAchievements?.forEach((a) => toast.achievement(a));
      }
      await load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong');
    } finally {
      setBusyTaskId(null);
    }
  };

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    try {
      if (modalTask && modalTask.id) {
        await taskApi.updateTask(modalTask.id, payload);
      } else {
        await taskApi.createTask(payload);
      }
      setModalTask(undefined);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not save task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (task) => {
    await taskApi.deleteTask(task.id);
    await load();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton rows={1} />
        <LoadingSkeleton rows={4} />
      </div>
    );
  }

  const overallStreak = data.streaks.find((s) => s.streak_type === 'overall');

  return (
    <div className="space-y-6">
      <div className="card p-5 flex flex-col sm:flex-row items-center gap-6">
        <ProgressRing percentage={data.dailyProgress} />
        <div className="flex-1 w-full space-y-4">
          <XPBar level={data.progression.level} currentXp={data.progression.currentXp} xpForNextLevel={data.progression.xpForNextLevel} />
          {overallStreak && overallStreak.current_streak > 0 && (
            <div className="inline-flex items-center gap-1.5 text-sm text-orange-400 font-medium">
              <Flame className="w-4 h-4" />
              {overallStreak.current_streak} day overall streak
            </div>
          )}
        </div>
      </div>

      {categories.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {data.categoryProgress
            .filter((c) => c.taskCount > 0)
            .map((c) => {
              const color = getCategoryColor(c.color);
              return (
                <div key={c.id} className="card px-3 py-2.5">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <DynamicIcon name={c.icon} className={`w-3.5 h-3.5 ${color.text}`} />
                    <span className="text-xs text-slate-400 truncate">{c.name}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-border overflow-hidden">
                    <div className={`h-full rounded-full ${color.solid}`} style={{ width: `${c.progress ?? 0}%` }} />
                  </div>
                </div>
              );
            })}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-100">Today&apos;s Quests</h2>
          <button type="button" onClick={() => setModalTask(null)} className="btn-secondary !min-h-[40px] !py-2 !px-3">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>

        {data.tasks.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title="Nothing scheduled yet."
            subtitle="Create your first quest for today."
            action={
              <button type="button" onClick={() => setModalTask(null)} className="btn-primary">
                <Plus className="w-4 h-4" /> New quest
              </button>
            }
          />
        ) : (
          <div className="space-y-2">
            {data.tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                busy={busyTaskId === task.id}
                onToggle={handleToggle}
                onEdit={setModalTask}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-100 mb-3">Current Stats</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {data.stats.map((s) => (
            <StatCard key={s.stat_name} statName={s.stat_name} value={s.value} />
          ))}
        </div>
      </div>

      <Modal open={modalTask !== undefined} onClose={() => setModalTask(undefined)} title={modalTask?.id ? 'Edit quest' : 'New quest'}>
        <TaskForm
          categories={categories}
          initialTask={modalTask || { scheduled_date: data.date }}
          onSubmit={handleSubmit}
          onCancel={() => setModalTask(undefined)}
          submitting={submitting}
        />
      </Modal>
    </div>
  );
}
