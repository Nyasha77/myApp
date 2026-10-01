const db = require('../database/db');
const { ApiError } = require('../middleware/errorHandler');
const { calculateTaskXP, calculateStatGain, COMEBACK_BONUS_XP } = require('../config/gameConfig');
const progressionService = require('./progressionService');
const { applyStatChange } = require('./statService');
const streakService = require('./streakService');
const decayService = require('./decayService');
const achievementService = require('./achievementService');
const dailySummaryService = require('./dailySummaryService');
const { matchesRecurrence } = require('./recurrence');

/**
 * Total XP earned per category, all-time. Feeds the "Specialist" achievement
 * (1,000 XP in one category) - computed fresh on each completion rather than
 * maintained as a running counter, since task completions/uncompletions and
 * category reassignment can all change it.
 */
async function getCategoryXpTotals(userId, trx = db) {
  const rows = await trx('task_completions')
    .join('tasks', 'tasks.id', 'task_completions.task_id')
    .where('task_completions.user_id', userId)
    .whereNotNull('tasks.category_id')
    .groupBy('tasks.category_id')
    .select('tasks.category_id')
    .sum('task_completions.xp_earned as total');

  return Object.fromEntries(rows.map((r) => [r.category_id, Number(r.total)]));
}

async function getTasksForDate(userId, date) {
  const candidates = await db('tasks')
    .where({ user_id: userId })
    .andWhere('scheduled_date', '<=', date)
    .orderBy('scheduled_date', 'desc');

  const tasks = candidates.filter((t) => matchesRecurrence(t, date));
  const taskIds = tasks.map((t) => t.id);

  const completions = taskIds.length
    ? await db('task_completions').where({ user_id: userId, completion_date: date }).whereIn('task_id', taskIds)
    : [];
  const completionMap = new Map(completions.map((c) => [c.task_id, c]));

  const categories = await db('categories').where({ user_id: userId });
  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  return tasks.map((t) => {
    const completion = completionMap.get(t.id);
    return {
      ...t,
      completed: Boolean(completion),
      completed_at: completion ? completion.completed_at : null,
      xp_earned: completion ? completion.xp_earned : null,
      category: t.category_id ? categoryMap.get(t.category_id) || null : null,
    };
  });
}

async function getTask(userId, taskId) {
  const task = await db('tasks').where({ id: taskId, user_id: userId }).first();
  if (!task) throw new ApiError(404, 'Task not found');
  return task;
}

async function createTask(userId, data) {
  const {
    title,
    description,
    categoryId,
    weight = 10,
    difficulty = 'normal',
    taskType = 'standard',
    xpReward,
    scheduledDate,
    recurrenceType = 'none',
    recurrenceConfig,
  } = data;

  if (!title || !title.trim()) throw new ApiError(400, 'Title is required');
  if (!scheduledDate) throw new ApiError(400, 'scheduledDate is required');
  if (weight < 0) throw new ApiError(400, 'Weight must be >= 0');

  const [task] = await db('tasks')
    .insert({
      user_id: userId,
      category_id: categoryId || null,
      title: title.trim(),
      description: description || null,
      weight,
      difficulty,
      task_type: taskType,
      xp_reward: xpReward ?? null,
      scheduled_date: scheduledDate,
      recurrence_type: recurrenceType,
      recurrence_config: recurrenceConfig || null,
    })
    .returning('*');

  return task;
}

async function updateTask(userId, taskId, data) {
  await getTask(userId, taskId);
  const updates = {};
  const map = {
    title: 'title',
    description: 'description',
    categoryId: 'category_id',
    weight: 'weight',
    difficulty: 'difficulty',
    taskType: 'task_type',
    xpReward: 'xp_reward',
    scheduledDate: 'scheduled_date',
    recurrenceType: 'recurrence_type',
    recurrenceConfig: 'recurrence_config',
  };
  Object.entries(map).forEach(([key, column]) => {
    if (data[key] !== undefined) updates[column] = data[key];
  });
  if (updates.weight !== undefined && updates.weight < 0) throw new ApiError(400, 'Weight must be >= 0');
  updates.updated_at = db.fn.now();

  await db('tasks').where({ id: taskId, user_id: userId }).update(updates);
  return getTask(userId, taskId);
}

async function deleteTask(userId, taskId) {
  await getTask(userId, taskId);
  await db('tasks').where({ id: taskId, user_id: userId }).del();
}

/**
 * Completes a task for a given date. This is the central orchestration point:
 * it awards XP, grows the relevant stats, updates streaks, resolves decay
 * recovery, checks achievements, and refreshes the day's summary - all in one
 * transaction so the numbers the user sees are always consistent.
 */
async function completeTask(userId, taskId, { date, performanceMetrics, timezone } = {}) {
  const task = await getTask(userId, taskId);
  const completionDate = date || task.scheduled_date;

  const existingCompletion = await db('task_completions').where({ task_id: taskId, completion_date: completionDate }).first();
  if (existingCompletion) throw new ApiError(400, 'Task already completed for this date');

  return db.transaction(async (trx) => {
    let categoryStats = [];
    let streakDaysForBonus = 0;
    let comeback = { wasComeback: false };

    if (task.category_id) {
      categoryStats = await trx('category_stats').where({ category_id: task.category_id });
      const existingStreak = await trx('streaks').where({ user_id: userId, category_id: task.category_id, streak_type: 'category' }).first();
      streakDaysForBonus = existingStreak ? existingStreak.current_streak : 0;
      comeback = await decayService.resetDecayIfRecovering(userId, task.category_id, trx);
    }

    const xpEarned = calculateTaskXP(task, { streakDays: streakDaysForBonus });

    await trx('task_completions').insert({
      task_id: taskId,
      user_id: userId,
      completion_date: completionDate,
      xp_earned: xpEarned,
      weight_at_completion: task.weight,
    });

    if (task.recurrence_type === 'none' && completionDate === task.scheduled_date) {
      await trx('tasks').where({ id: taskId }).update({ completed: true, completed_at: trx.fn.now() });
    }

    const progression = await progressionService.adjustXp(userId, xpEarned, trx);

    const statChanges = [];
    for (const cs of categoryStats) {
      const gain = calculateStatGain(task.weight, task.difficulty, Number(cs.weight));
      const result = await applyStatChange(userId, cs.stat_name, gain, `Completed "${task.title}"`, 'task_completion', taskId, trx);
      if (result) statChanges.push(result);
    }

    let comebackXp = 0;
    if (comeback.wasComeback) {
      comebackXp = COMEBACK_BONUS_XP;
      await progressionService.adjustXp(userId, comebackXp, trx);
    }

    if (task.category_id) {
      await streakService.recomputeStreak(userId, task.category_id, timezone, trx);
    }
    const overallStreak = await streakService.recomputeStreak(userId, null, timezone, trx);

    await dailySummaryService.recalculateDailySummary(userId, completionDate, trx);

    const categoryXpTotals = await getCategoryXpTotals(userId, trx);
    const newAchievements = await achievementService.evaluateAchievements(
      userId,
      { comebackTriggered: comeback.wasComeback, categoryXpTotals },
      trx
    );

    return {
      task: { ...task, completed: true, completed_at: new Date().toISOString() },
      xpEarned: xpEarned + comebackXp,
      comebackBonus: comebackXp,
      isComeback: comeback.wasComeback,
      progression,
      statChanges,
      overallStreak,
      newAchievements,
    };
  });
}

async function uncompleteTask(userId, taskId, { date, timezone } = {}) {
  const task = await getTask(userId, taskId);
  const completionDate = date || task.scheduled_date;

  const completion = await db('task_completions').where({ task_id: taskId, completion_date: completionDate }).first();
  if (!completion) throw new ApiError(400, 'Task is not completed for this date');

  return db.transaction(async (trx) => {
    await trx('task_completions').where({ id: completion.id }).del();

    if (task.recurrence_type === 'none' && completionDate === task.scheduled_date) {
      await trx('tasks').where({ id: taskId }).update({ completed: false, completed_at: null });
    }

    const progression = await progressionService.adjustXp(userId, -completion.xp_earned, trx);

    const statChanges = [];
    if (task.category_id) {
      const categoryStats = await trx('category_stats').where({ category_id: task.category_id });
      for (const cs of categoryStats) {
        const gain = calculateStatGain(Number(completion.weight_at_completion), task.difficulty, Number(cs.weight));
        const result = await applyStatChange(
          userId,
          cs.stat_name,
          -gain,
          `Uncompleted "${task.title}"`,
          'task_completion',
          taskId,
          trx
        );
        if (result) statChanges.push(result);
      }
      await streakService.recomputeStreak(userId, task.category_id, timezone, trx);
    }
    await streakService.recomputeStreak(userId, null, timezone, trx);

    await dailySummaryService.recalculateDailySummary(userId, completionDate, trx);

    return { task: { ...task, completed: false, completed_at: null }, progression, statChanges };
  });
}

module.exports = {
  getTasksForDate,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  completeTask,
  uncompleteTask,
};
