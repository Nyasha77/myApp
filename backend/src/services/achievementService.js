const db = require('../database/db');
const { ACHIEVEMENT_REQUIREMENT_TYPES } = require('../config/gameConfig');

async function listAchievements(userId) {
  const all = await db('achievements').orderBy('id');
  const unlocked = await db('user_achievements').where({ user_id: userId });
  const unlockedMap = new Map(unlocked.map((u) => [u.achievement_id, u.unlocked_at]));

  return all.map((a) => ({
    ...a,
    unlocked: unlockedMap.has(a.id),
    unlockedAt: unlockedMap.get(a.id) || null,
  }));
}

async function unlockIfNeeded(userId, achievementKey, trx = db) {
  const achievement = await trx('achievements').where({ key: achievementKey }).first();
  if (!achievement) return null;

  const existing = await trx('user_achievements').where({ user_id: userId, achievement_id: achievement.id }).first();
  if (existing) return null;

  await trx('user_achievements').insert({ user_id: userId, achievement_id: achievement.id });
  return achievement;
}

/**
 * Evaluates every achievement type against current state and unlocks any newly
 * earned ones. Called after task completion, decay recovery, and benchmark updates.
 * Returns the list of achievements newly unlocked this call (for notifications).
 */
async function evaluateAchievements(userId, context = {}, trx = db) {
  const newlyUnlocked = [];

  const achievements = await trx('achievements');
  const unlockedIds = new Set(
    (await trx('user_achievements').where({ user_id: userId })).map((u) => u.achievement_id)
  );

  for (const achievement of achievements) {
    if (unlockedIds.has(achievement.id)) continue;

    let earned = false;
    switch (achievement.requirement_type) {
      case ACHIEVEMENT_REQUIREMENT_TYPES.FIRST_TASK_COMPLETED: {
        const count = await trx('task_completions').where({ user_id: userId }).count('id as c').first();
        earned = Number(count.c) >= achievement.requirement_value;
        break;
      }
      case ACHIEVEMENT_REQUIREMENT_TYPES.STREAK_DAYS: {
        const overall = await trx('streaks').where({ user_id: userId, streak_type: 'overall' }).first();
        earned = overall && overall.current_streak >= achievement.requirement_value;
        break;
      }
      case ACHIEVEMENT_REQUIREMENT_TYPES.LEVEL_REACHED: {
        const progression = await trx('user_progression').where({ user_id: userId }).first();
        earned = progression && progression.level >= achievement.requirement_value;
        break;
      }
      case ACHIEVEMENT_REQUIREMENT_TYPES.CATEGORY_XP: {
        if (context.categoryXpTotals) {
          earned = Object.values(context.categoryXpTotals).some((xp) => xp >= achievement.requirement_value);
        }
        break;
      }
      case ACHIEVEMENT_REQUIREMENT_TYPES.COMEBACK: {
        earned = Boolean(context.comebackTriggered);
        break;
      }
      case ACHIEVEMENT_REQUIREMENT_TYPES.BENCHMARK_BEATEN: {
        earned = Boolean(context.benchmarkBeaten);
        break;
      }
      default:
        earned = false;
    }

    if (earned) {
      await trx('user_achievements').insert({ user_id: userId, achievement_id: achievement.id });
      newlyUnlocked.push(achievement);
    }
  }

  return newlyUnlocked;
}

module.exports = { listAchievements, unlockIfNeeded, evaluateAchievements };
