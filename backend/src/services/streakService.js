const db = require('../database/db');
const { todayInTimezone } = require('../utils/dateUtils');
const { calcStreak } = require('./streakCalc');

async function getQualifyingDates(userId, categoryId, trx = db) {
  let query = trx('task_completions').where('task_completions.user_id', userId);

  if (categoryId) {
    query = query.join('tasks', 'tasks.id', 'task_completions.task_id').where('tasks.category_id', categoryId);
  }

  const rows = await query.distinct('task_completions.completion_date').orderBy('task_completions.completion_date', 'desc');
  return rows.map((r) => (typeof r.completion_date === 'string' ? r.completion_date : r.completion_date.toISOString().slice(0, 10)));
}

/**
 * Recomputes current/longest streak from completion history. Recomputing (rather than
 * incrementing/decrementing in place) keeps the logic correct even when a past
 * completion is toggled off after the fact. Must run against the same transaction
 * as the completion/uncompletion it follows, or it will read pre-change state.
 */
async function recomputeStreak(userId, categoryId, timezone, trx = db) {
  const dates = await getQualifyingDates(userId, categoryId, trx);
  const streakType = categoryId ? 'category' : 'overall';
  const today = todayInTimezone(timezone);

  const { currentStreak, longestStreak, lastActivityDate } = calcStreak(dates, today);

  const existing = await trx('streaks').where({ user_id: userId, category_id: categoryId || null, streak_type: streakType }).first();
  const resolvedLongest = Math.max(longestStreak, existing ? existing.longest_streak : 0);

  const dbPayload = {
    user_id: userId,
    category_id: categoryId || null,
    streak_type: streakType,
    current_streak: currentStreak,
    longest_streak: resolvedLongest,
    last_activity_date: lastActivityDate,
    updated_at: trx.fn.now(),
  };

  if (existing) {
    await trx('streaks').where({ id: existing.id }).update(dbPayload);
  } else {
    await trx('streaks').insert(dbPayload);
  }

  return {
    userId,
    categoryId: categoryId || null,
    streakType,
    currentStreak,
    longestStreak: resolvedLongest,
    lastActivityDate,
  };
}

async function getStreaks(userId) {
  return db('streaks')
    .leftJoin('categories', 'categories.id', 'streaks.category_id')
    .where('streaks.user_id', userId)
    .select(
      'streaks.id',
      'streaks.streak_type',
      'streaks.current_streak',
      'streaks.longest_streak',
      'streaks.last_activity_date',
      'streaks.category_id',
      'categories.name as category_name'
    )
    .orderBy('streaks.streak_type');
}

async function getOverallStreak(userId) {
  return db('streaks').where({ user_id: userId, category_id: null, streak_type: 'overall' }).first();
}

module.exports = { recomputeStreak, getStreaks, getOverallStreak };
