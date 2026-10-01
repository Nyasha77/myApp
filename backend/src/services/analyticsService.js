const db = require('../database/db');
const dailySummaryService = require('./dailySummaryService');
const { addDays } = require('../utils/dateUtils');

async function getRangeStats(userId, startDate, endDate) {
  const summaries = await dailySummaryService.getSummaryRange(userId, startDate, endDate);

  const totalXp = summaries.reduce((s, d) => s + d.xp_earned, 0);
  const totalCompleted = summaries.reduce((s, d) => s + d.tasks_completed, 0);
  const totalTasks = summaries.reduce((s, d) => s + d.tasks_total, 0);
  const avgProgress = summaries.length
    ? Math.round((summaries.reduce((s, d) => s + Number(d.progress_percentage), 0) / summaries.length) * 100) / 100
    : 0;

  let bestDay = null;
  let lowestDay = null;
  summaries.forEach((d) => {
    if (!bestDay || Number(d.progress_percentage) > Number(bestDay.progress_percentage)) bestDay = d;
    if (!lowestDay || Number(d.progress_percentage) < Number(lowestDay.progress_percentage)) lowestDay = d;
  });

  const completions = await db('task_completions')
    .join('tasks', 'tasks.id', 'task_completions.task_id')
    .leftJoin('categories', 'categories.id', 'tasks.category_id')
    .where('task_completions.user_id', userId)
    .whereBetween('task_completions.completion_date', [startDate, endDate])
    .select('categories.name as category_name', 'task_completions.xp_earned');

  const categoryTotals = {};
  completions.forEach((c) => {
    const name = c.category_name || 'Uncategorized';
    categoryTotals[name] = (categoryTotals[name] || 0) + Number(c.xp_earned);
  });

  const categoryEntries = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

  return {
    startDate,
    endDate,
    totalXp,
    totalCompleted,
    totalTasks,
    missedTasks: totalTasks - totalCompleted,
    avgProgress,
    bestDay,
    lowestDay,
    categoryBreakdown: categoryEntries.map(([name, xp]) => ({ category: name, xp })),
    mostActiveCategory: categoryEntries[0]?.[0] || null,
    leastActiveCategory: categoryEntries[categoryEntries.length - 1]?.[0] || null,
    dailySeries: summaries.map((d) => ({
      date: typeof d.date === 'string' ? d.date : d.date.toISOString().slice(0, 10),
      progress: Number(d.progress_percentage),
      xp: d.xp_earned,
      tasksCompleted: d.tasks_completed,
      tasksTotal: d.tasks_total,
    })),
  };
}

async function getWeeklyStats(userId, referenceDate) {
  const start = addDays(referenceDate, -6);
  const stats = await getRangeStats(userId, start, referenceDate);

  const streaks = await db('streaks').where({ user_id: userId, streak_type: 'overall' }).first();

  return {
    ...stats,
    currentStreak: streaks?.current_streak || 0,
    longestStreak: streaks?.longest_streak || 0,
  };
}

async function getMonthlyStats(userId, year, month) {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const end = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

  const stats = await getRangeStats(userId, start, end);
  const statHistory = await db('stat_history')
    .where({ user_id: userId })
    .whereBetween('created_at', [`${start}T00:00:00Z`, `${end}T23:59:59Z`])
    .select('stat_name', 'change_amount');

  const statProgression = {};
  statHistory.forEach((h) => {
    statProgression[h.stat_name] = (statProgression[h.stat_name] || 0) + Number(h.change_amount);
  });

  const streaks = await db('streaks').where({ user_id: userId, streak_type: 'overall' }).first();

  return {
    ...stats,
    statProgression,
    currentStreak: streaks?.current_streak || 0,
    longestStreak: streaks?.longest_streak || 0,
  };
}

async function getCalendarMonth(userId, year, month) {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const end = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

  const summaries = await dailySummaryService.getSummaryRange(userId, start, end);
  return summaries.map((d) => ({
    date: typeof d.date === 'string' ? d.date : d.date.toISOString().slice(0, 10),
    progress: Number(d.progress_percentage),
    xpEarned: d.xp_earned,
    tasksCompleted: d.tasks_completed,
    tasksTotal: d.tasks_total,
  }));
}

async function getDayDetail(userId, date) {
  const summary = await dailySummaryService.getSummary(userId, date);
  const taskService = require('./taskService');
  const tasks = await taskService.getTasksForDate(userId, date);

  const statHistory = await db('stat_history')
    .where({ user_id: userId })
    .whereBetween('created_at', [`${date}T00:00:00Z`, `${date}T23:59:59Z`])
    .orderBy('created_at');

  const activities = await db('activities')
    .where({ user_id: userId })
    .whereBetween('performed_at', [`${date}T00:00:00Z`, `${date}T23:59:59Z`]);

  return {
    date,
    summary: summary || { progress_percentage: 0, xp_earned: 0, tasks_completed: 0, tasks_total: tasks.length },
    tasksCompleted: tasks.filter((t) => t.completed),
    tasksMissed: tasks.filter((t) => !t.completed),
    statChanges: statHistory,
    activities,
  };
}

module.exports = { getRangeStats, getWeeklyStats, getMonthlyStats, getCalendarMonth, getDayDetail };
