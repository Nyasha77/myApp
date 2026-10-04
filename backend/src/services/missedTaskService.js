const db = require('../database/db');
const { todayInTimezone, addDays, daysBetween } = require('../utils/dateUtils');
const { applyStatChange } = require('./statService');
const taskService = require('./taskService');
const { getDateRangeToProcess, shouldPenalize } = require('./missedTaskCalc');
const {
  calculateStatGain,
  MISSED_TASK_PENALTY_FACTOR,
  MISSED_TASK_GRACE_DAYS,
  MISSED_TASK_MAX_DAYS_PER_RUN,
} = require('../config/gameConfig');

function toDateString(value) {
  if (!value) return null;
  return typeof value === 'string' ? value : value.toISOString().slice(0, 10);
}

/**
 * Most recent calendar date a task completion fed this stat, by the task's
 * actual completion_date - not when the stat_history row happened to be
 * inserted, which is "now" rather than that date whenever a task gets
 * completed for a past day (the Tasks page allows exactly that via its date
 * navigation, so this distinction is real, not theoretical).
 */
async function getLastWorkedDate(userId, statName, onOrBeforeDate) {
  const row = await db('task_completions')
    .join('tasks', 'tasks.id', 'task_completions.task_id')
    .join('category_stats', 'category_stats.category_id', 'tasks.category_id')
    .where('task_completions.user_id', userId)
    .andWhere('category_stats.stat_name', statName)
    .andWhere('task_completions.completion_date', '<=', onOrBeforeDate)
    .orderBy('task_completions.completion_date', 'desc')
    .select('task_completions.completion_date')
    .first();
  return row ? toDateString(row.completion_date) : null;
}

/**
 * Sweeps every date since the last check (capped) for tasks that went
 * unfinished through their whole scheduled day, and applies a stat penalty -
 * but only where the stat has genuinely gone MISSED_TASK_GRACE_DAYS with no
 * positive contribution from anything, so one occasional miss while a stat is
 * otherwise active costs nothing. Safe to call on every dashboard load, same
 * lazy/idempotent pattern as decay: already-processed (task, date) pairs are
 * tracked in task_misses and never re-evaluated.
 */
async function processMissedTasksForUser(userId, timezone) {
  const today = todayInTimezone(timezone);
  const user = await db('users').where({ id: userId }).first();
  const lastCheck = toDateString(user.last_missed_check);

  if (!lastCheck) {
    // First time running for this user: establish a starting point rather than
    // retroactively penalizing a history that predates this feature existing.
    await db('users').where({ id: userId }).update({ last_missed_check: addDays(today, -1) });
    return [];
  }

  const range = getDateRangeToProcess(lastCheck, today, MISSED_TASK_MAX_DAYS_PER_RUN);
  if (!range) return [];

  const categories = await db('categories').where({ user_id: userId });
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const events = [];

  for (let cursor = range.startDate; daysBetween(cursor, range.endDate) >= 0; cursor = addDays(cursor, 1)) {
    // eslint-disable-next-line no-await-in-loop
    const tasks = await taskService.getTasksForDate(userId, cursor);

    for (const task of tasks) {
      if (task.completed || !task.category_id) continue;

      // eslint-disable-next-line no-await-in-loop
      const alreadyChecked = await db('task_misses').where({ task_id: task.id, missed_date: cursor }).first();
      if (alreadyChecked) continue;

      // eslint-disable-next-line no-await-in-loop
      const categoryStats = await db('category_stats').where({ category_id: task.category_id });
      let penalizedAny = false;

      for (const cs of categoryStats) {
        // eslint-disable-next-line no-await-in-loop
        const lastWorked = await getLastWorkedDate(userId, cs.stat_name, cursor);
        if (!shouldPenalize(lastWorked, cursor, MISSED_TASK_GRACE_DAYS)) continue;

        const gain = calculateStatGain(task.weight, task.difficulty, Number(cs.weight));
        const penalty = -1 * gain * MISSED_TASK_PENALTY_FACTOR;
        const category = categoryMap.get(task.category_id);

        // eslint-disable-next-line no-await-in-loop
        const result = await applyStatChange(
          userId,
          cs.stat_name,
          penalty,
          `Missed "${task.title}" - no ${category ? category.name : 'related'} activity in ${MISSED_TASK_GRACE_DAYS}+ days`,
          'missed_task',
          task.id
        );
        if (result) {
          penalizedAny = true;
          events.push({ taskTitle: task.title, date: cursor, ...result });
        }
      }

      // eslint-disable-next-line no-await-in-loop
      await db('task_misses').insert({ task_id: task.id, user_id: userId, missed_date: cursor, penalized: penalizedAny });
    }
  }

  await db('users').where({ id: userId }).update({ last_missed_check: range.endDate });
  return events;
}

module.exports = { processMissedTasksForUser };
