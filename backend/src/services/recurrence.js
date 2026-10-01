/**
 * Whether a task (with its recurrence_type/recurrence_config) applies to a given
 * calendar date. Shared between taskService (building a day's task list) and
 * dailySummaryService (recomputing that day's weighted progress) so both agree
 * on which tasks were "scheduled" for a date - a recurring task's own
 * scheduled_date is only its anchor, not the only day it appears on.
 */
function matchesRecurrence(task, date) {
  if (task.scheduled_date > date) return false;
  // A recurring task can be given a finite duration (e.g. "daily for 2 weeks")
  // via an end date computed client-side and stored alongside the rest of the
  // recurrence config, rather than repeating indefinitely.
  if (task.recurrence_config?.endDate && date > task.recurrence_config.endDate) return false;
  if (task.recurrence_type === 'none') return task.scheduled_date === date;
  if (task.recurrence_type === 'daily') return true;
  if (task.recurrence_type === 'weekly') {
    const days = task.recurrence_config?.daysOfWeek;
    if (!Array.isArray(days) || days.length === 0) return task.scheduled_date === date;
    const dayOfWeek = new Date(`${date}T00:00:00Z`).getUTCDay();
    return days.includes(dayOfWeek);
  }
  return task.scheduled_date === date;
}

module.exports = { matchesRecurrence };
