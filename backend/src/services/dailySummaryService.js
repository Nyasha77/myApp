const db = require('../database/db');
const { matchesRecurrence } = require('./recurrence');

function computeProgress(tasks) {
  const totalWeight = tasks.reduce((sum, t) => sum + Number(t.weight), 0);
  if (totalWeight === 0) return 0;
  const completedWeight = tasks.filter((t) => t.completed).reduce((sum, t) => sum + Number(t.weight), 0);
  return Math.min(100, Math.round((completedWeight / totalWeight) * 10000) / 100);
}

/**
 * Recalculates and upserts the daily_summaries row for a given date from the
 * tasks scheduled on that date plus that day's completion XP - keeps calendar/
 * analytics views backed by a persisted, historical record rather than a live
 * recomputation every time.
 *
 * A recurring task's own `completed` column only reflects its anchor date (see
 * taskService), so "was this task done on `date`" has to be derived from
 * task_completions here too - matching the logic taskService.getTasksForDate uses -
 * rather than trusting the raw column, which would silently undercount recurring
 * task completions on every day but the task's original scheduled_date.
 */
async function recalculateDailySummary(userId, date, trx = db) {
  const candidates = await trx('tasks').where({ user_id: userId }).andWhere('scheduled_date', '<=', date);
  const tasks = candidates.filter((t) => matchesRecurrence(t, date));
  const taskIds = tasks.map((t) => t.id);

  const completions = taskIds.length
    ? await trx('task_completions').where({ user_id: userId, completion_date: date }).whereIn('task_id', taskIds)
    : [];
  const completedIds = new Set(completions.map((c) => c.task_id));

  const tasksWithStatus = tasks.map((t) => ({ ...t, completed: completedIds.has(t.id) }));
  const progress = computeProgress(tasksWithStatus);

  const xpEarned = completions.reduce((sum, c) => sum + c.xp_earned, 0);

  const payload = {
    user_id: userId,
    date,
    progress_percentage: progress,
    xp_earned: xpEarned,
    tasks_completed: completedIds.size,
    tasks_total: tasks.length,
    updated_at: trx.fn.now(),
  };

  const existing = await trx('daily_summaries').where({ user_id: userId, date }).first();
  if (existing) {
    await trx('daily_summaries').where({ id: existing.id }).update(payload);
  } else {
    await trx('daily_summaries').insert(payload);
  }

  return { ...payload, updated_at: undefined };
}

async function getSummary(userId, date) {
  return db('daily_summaries').where({ user_id: userId, date }).first();
}

async function getSummaryRange(userId, startDate, endDate) {
  return db('daily_summaries')
    .where({ user_id: userId })
    .whereBetween('date', [startDate, endDate])
    .orderBy('date');
}

module.exports = { computeProgress, recalculateDailySummary, getSummary, getSummaryRange };
