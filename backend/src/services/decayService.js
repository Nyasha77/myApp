const db = require('../database/db');
const { todayInTimezone } = require('../utils/dateUtils');
const { applyStatChange } = require('./statService');
const { calcDecayDays } = require('./decayCalc');
const {
  DEFAULT_DECAY_GRACE_DAYS,
  DEFAULT_DECAY_RATE_PER_DAY,
  DECAY_MAX_PER_RUN,
} = require('../config/gameConfig');

/**
 * Runs the inactivity-decay check for every active category of a user.
 * Safe to call as often as needed (e.g. on every dashboard load) - it only
 * applies decay for days that have not already been accounted for.
 */
async function runDecayForUser(userId, timezone) {
  const today = todayInTimezone(timezone);
  const categories = await db('categories').where({ user_id: userId, active: true });
  const events = [];

  for (const category of categories) {
    const graceDays = category.decay_grace_days ?? DEFAULT_DECAY_GRACE_DAYS;
    const decayRate = category.decay_rate != null ? Number(category.decay_rate) : DEFAULT_DECAY_RATE_PER_DAY;

    const streak = await db('streaks').where({ user_id: userId, category_id: category.id, streak_type: 'category' }).first();
    const lastActivityDate = streak?.last_activity_date
      ? (typeof streak.last_activity_date === 'string' ? streak.last_activity_date : streak.last_activity_date.toISOString().slice(0, 10))
      : category.created_at.toISOString().slice(0, 10);

    const lastDecayCheck = category.last_decay_check
      ? (typeof category.last_decay_check === 'string' ? category.last_decay_check : category.last_decay_check.toISOString().slice(0, 10))
      : null;

    const { daysToApply, totalDaysInactive } = calcDecayDays(
      lastActivityDate,
      graceDays,
      lastDecayCheck,
      today,
      DECAY_MAX_PER_RUN
    );
    if (daysToApply <= 0) continue;

    const categoryStats = await db('category_stats').where({ category_id: category.id });
    if (categoryStats.length === 0) continue;

    await db.transaction(async (trx) => {
      for (const cs of categoryStats) {
        const amount = -1 * decayRate * daysToApply * Number(cs.weight);
        const result = await applyStatChange(
          userId,
          cs.stat_name,
          amount,
          `${totalDaysInactive} day(s) without a qualifying ${category.name} activity`,
          'decay',
          category.id,
          trx
        );
        if (result) {
          await trx('decay_events').insert({
            user_id: userId,
            category_id: category.id,
            stat_name: cs.stat_name,
            amount: result.delta,
            days_inactive: totalDaysInactive,
          });
          events.push({ category: category.name, ...result, daysInactive: totalDaysInactive });
        }
      }

      await trx('categories').where({ id: category.id }).update({ last_decay_check: today, is_decaying: true });
    });
  }

  return events;
}

async function getDecayHistory(userId, limit = 50) {
  return db('decay_events')
    .leftJoin('categories', 'categories.id', 'decay_events.category_id')
    .where('decay_events.user_id', userId)
    .orderBy('decay_events.created_at', 'desc')
    .limit(limit)
    .select('decay_events.*', 'categories.name as category_name');
}

/**
 * Called whenever a qualifying activity happens in a category. If that category
 * had previously been decaying, resets its decay clock and reports a "comeback"
 * so the caller can award a bonus and unlock the achievement.
 */
async function resetDecayIfRecovering(userId, categoryId, trx = db) {
  const category = await trx('categories').where({ id: categoryId, user_id: userId }).first();
  if (!category) return { wasComeback: false };

  const wasComeback = category.is_decaying;
  await trx('categories').where({ id: categoryId }).update({ is_decaying: false, last_decay_check: null });
  return { wasComeback };
}

module.exports = { runDecayForUser, getDecayHistory, resetDecayIfRecovering };
