const asyncHandler = require('../utils/asyncHandler');
const taskService = require('../services/taskService');
const progressionService = require('../services/progressionService');
const statService = require('../services/statService');
const streakService = require('../services/streakService');
const categoryService = require('../services/categoryService');
const decayService = require('../services/decayService');
const dailySummaryService = require('../services/dailySummaryService');
const stravaService = require('../services/stravaService');
const { todayInTimezone } = require('../utils/dateUtils');

const get = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const timezone = req.user.timezone;
  const today = todayInTimezone(timezone);

  const decayEvents = await decayService.runDecayForUser(userId, timezone);

  // Best-effort: syncing "only when the app opens" means right here, but a
  // Strava hiccup (expired token, rate limit, network blip) must never break
  // the dashboard itself.
  let stravaSync = null;
  try {
    stravaSync = await stravaService.syncRuns(userId, timezone);
  } catch (err) {
    console.error('Strava sync failed:', err.message);
  }

  const [tasks, progression, stats, streaks, categories] = await Promise.all([
    taskService.getTasksForDate(userId, today),
    progressionService.getProgression(userId),
    statService.listStats(userId),
    streakService.getStreaks(userId),
    categoryService.listCategories(userId),
  ]);

  const totalWeight = tasks.reduce((s, t) => s + Number(t.weight), 0);
  const completedWeight = tasks.filter((t) => t.completed).reduce((s, t) => s + Number(t.weight), 0);
  const dailyProgress = totalWeight === 0 ? 0 : Math.min(100, Math.round((completedWeight / totalWeight) * 10000) / 100);

  const categoryProgress = categories.map((cat) => {
    const catTasks = tasks.filter((t) => t.category_id === cat.id);
    const catTotalWeight = catTasks.reduce((s, t) => s + Number(t.weight), 0);
    const catCompletedWeight = catTasks.filter((t) => t.completed).reduce((s, t) => s + Number(t.weight), 0);
    return {
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      progress: catTotalWeight === 0 ? null : Math.round((catCompletedWeight / catTotalWeight) * 10000) / 100,
      taskCount: catTasks.length,
    };
  });

  await dailySummaryService.recalculateDailySummary(userId, today);

  res.json({
    date: today,
    dailyProgress,
    tasks,
    progression,
    stats,
    streaks,
    categoryProgress,
    decayEvents,
    stravaNewRuns: stravaSync?.newRuns || [],
  });
});

module.exports = { get };
