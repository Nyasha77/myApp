import { useState, useCallback } from 'react';
import * as taskApi from '../api/tasks';
import { useToast } from '../context/ToastContext';

/**
 * Flips a task's completed state in the UI immediately, then makes the real
 * API call in the background and reconciles - reverting only if it actually
 * fails. The visible checkbox/strikethrough never waits on the network; only
 * the numbers that genuinely require the server's calculation (XP, stats,
 * streaks) arrive a beat later via the toasts and the background refresh.
 */
export function useTaskToggle({ setTasks, date, onSettled }) {
  const toast = useToast();
  const [busyTaskId, setBusyTaskId] = useState(null);

  const toggle = useCallback(
    async (task) => {
      const wasCompleted = task.completed;
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, completed: !wasCompleted } : t)));
      setBusyTaskId(task.id);

      try {
        if (wasCompleted) {
          await taskApi.uncompleteTask(task.id, date);
        } else {
          const result = await taskApi.completeTask(task.id, date);
          toast.xp(result.xpEarned, task.title);
          if (result.progression.leveledUp) toast.levelUp(result.progression.previousLevel, result.progression.level);
          result.statChanges?.forEach((s) => toast.stat(s.statName, s.delta));
          if (result.isComeback) toast.xp(result.comebackBonus, 'Comeback bonus!');
          result.newAchievements?.forEach((a) => toast.achievement(a));
        }
        onSettled?.(); // background refresh (progress ring, XP bar, stats) - not awaited on purpose
      } catch (err) {
        setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, completed: wasCompleted } : t)));
        toast.error(err.response?.data?.error || 'Something went wrong');
      } finally {
        setBusyTaskId(null);
      }
    },
    [setTasks, date, onSettled, toast]
  );

  return { toggle, busyTaskId };
}
