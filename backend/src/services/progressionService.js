const db = require('../database/db');
const { getLevelProgress } = require('../config/gameConfig');

async function getProgression(userId) {
  const row = await db('user_progression').where({ user_id: userId }).first();
  if (!row) {
    return { level: 1, currentXp: 0, xpForNextLevel: 1000, totalXp: 0 };
  }
  return {
    level: row.level,
    currentXp: row.current_xp,
    totalXp: row.total_xp,
    xpForNextLevel: getLevelProgress(row.total_xp).xpForNextLevel,
  };
}

/**
 * Adjusts the user's total XP by `amount` (positive or negative - negative is used
 * when a task is uncompleted), recomputes level, and reports whether a level-up
 * (or level-down) occurred so the caller can surface a notification.
 */
async function adjustXp(userId, amount, trx = db) {
  if (amount === 0) {
    return { leveledUp: false, ...(await getProgression(userId)) };
  }

  const existing = await trx('user_progression').where({ user_id: userId }).first();
  const previousLevel = existing ? existing.level : 1;
  const newTotalXp = Math.max(0, (existing ? existing.total_xp : 0) + amount);
  const progress = getLevelProgress(newTotalXp);

  if (existing) {
    await trx('user_progression').where({ user_id: userId }).update({
      level: progress.level,
      total_xp: progress.totalXp,
      current_xp: progress.currentXp,
      updated_at: trx.fn.now(),
    });
  } else {
    await trx('user_progression').insert({
      user_id: userId,
      level: progress.level,
      total_xp: progress.totalXp,
      current_xp: progress.currentXp,
    });
  }

  return {
    leveledUp: progress.level > previousLevel,
    previousLevel,
    level: progress.level,
    currentXp: progress.currentXp,
    totalXp: progress.totalXp,
    xpForNextLevel: progress.xpForNextLevel,
  };
}

module.exports = { getProgression, adjustXp, awardXp: adjustXp };
