import { useEffect, useState, useCallback } from 'react';
import { Plus, ChevronLeft, ChevronRight, ListChecks } from 'lucide-react';
import * as taskApi from '../api/tasks';
import { getCategories } from '../api/categories';
import TaskCard from '../components/TaskCard';
import TaskForm from '../components/TaskForm';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { useToast } from '../context/ToastContext';
import { todayLocalISO, formatDate } from '../utils/format';
import { addDays } from '../utils/dateMath';
import { useTaskToggle } from '../hooks/useTaskToggle';
import { readCache, writeCache } from '../utils/cache';

export default function Tasks() {
  const [date, setDate] = useState(todayLocalISO());
  const [tasks, setTasks] = useState(() => readCache(`tasks:${todayLocalISO()}`) || []);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(tasks.length === 0);
  const [modalTask, setModalTask] = useState(undefined); // undefined = closed, null = new, object = edit
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const load = useCallback(async (d) => {
    const [taskRes, cats] = await Promise.all([taskApi.getTasks(d), getCategories()]);
    setTasks(taskRes.tasks);
    setCategories(cats);
    setLoading(false);
    writeCache(`tasks:${d}`, taskRes.tasks);
  }, []);

  useEffect(() => {
    const cached = readCache(`tasks:${date}`);
    if (cached) {
      setTasks(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }
    load(date);
  }, [date, load]);

  const { toggle: handleToggle, busyTaskId } = useTaskToggle({
    setTasks,
    date,
    onSettled: () => load(date),
  });

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    try {
      if (modalTask && modalTask.id) {
        await taskApi.updateTask(modalTask.id, payload);
      } else {
        await taskApi.createTask(payload);
      }
      setModalTask(undefined);
      await load(date);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not save task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (task) => {
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    try {
      await taskApi.deleteTask(task.id);
      load(date);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not delete task');
      load(date);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-50">Tasks</h1>
        <button type="button" onClick={() => setModalTask(null)} className="btn-primary !min-h-[40px] !py-2 !px-3">
          <Plus className="w-4 h-4" /> New
        </button>
      </div>

      <div className="flex items-center justify-center gap-3">
        <button type="button" onClick={() => setDate((d) => addDays(d, -1))} aria-label="Previous day" className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:bg-surface-raised">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-medium text-slate-200 w-36 text-center">{formatDate(date)}</span>
        <button type="button" onClick={() => setDate((d) => addDays(d, 1))} aria-label="Next day" className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:bg-surface-raised">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="Nothing scheduled for this day."
          subtitle="Create a quest to get started."
          action={<button type="button" onClick={() => setModalTask(null)} className="btn-primary"><Plus className="w-4 h-4" /> New quest</button>}
        />
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
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

      <Modal open={modalTask !== undefined} onClose={() => setModalTask(undefined)} title={modalTask?.id ? 'Edit quest' : 'New quest'}>
        <TaskForm
          categories={categories}
          initialTask={modalTask || { scheduled_date: date }}
          onSubmit={handleSubmit}
          onCancel={() => setModalTask(undefined)}
          submitting={submitting}
        />
      </Modal>
    </div>
  );
}
