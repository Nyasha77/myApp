const db = require('../database/db');
const { ApiError } = require('../middleware/errorHandler');
const { comparePerformance } = require('../config/gameConfig');

async function listActivities(userId, { categoryId, activityName, limit = 50 } = {}) {
  const query = db('activities').where({ user_id: userId }).orderBy('performed_at', 'desc').limit(limit);
  if (categoryId) query.andWhere({ category_id: categoryId });
  if (activityName) query.andWhere({ activity_name: activityName });

  const activities = await query;
  const ids = activities.map((a) => a.id);
  const metrics = ids.length ? await db('activity_metrics').whereIn('activity_id', ids) : [];

  return activities.map((a) => ({
    ...a,
    metrics: metrics.filter((m) => m.activity_id === a.id).map((m) => ({
      name: m.metric_name,
      value: Number(m.metric_value),
      unit: m.metric_unit,
    })),
  }));
}

/**
 * Records a performance activity (e.g. Bench Press: 80kg x 5 reps) and compares
 * its primary metric against the most recent prior activity with the same name,
 * so improvement/decline is surfaced immediately.
 */
async function recordActivity(userId, data) {
  const { categoryId, taskId, activityName, activityType, metrics = [], notes, performedAt } = data;
  if (!activityName) throw new ApiError(400, 'activityName is required');
  if (!Array.isArray(metrics) || metrics.length === 0) throw new ApiError(400, 'At least one metric is required');

  return db.transaction(async (trx) => {
    const [activity] = await trx('activities')
      .insert({
        user_id: userId,
        category_id: categoryId || null,
        task_id: taskId || null,
        activity_name: activityName,
        activity_type: activityType || 'generic',
        performed_at: performedAt || trx.fn.now(),
        notes: notes || null,
      })
      .returning('*');

    await trx('activity_metrics').insert(
      metrics.map((m) => ({ activity_id: activity.id, metric_name: m.name, metric_value: m.value, metric_unit: m.unit || null }))
    );

    const comparisons = [];
    for (const metric of metrics) {
      const previous = await trx('activity_metrics')
        .join('activities', 'activities.id', 'activity_metrics.activity_id')
        .where('activities.user_id', userId)
        .where('activities.activity_name', activityName)
        .where('activity_metrics.metric_name', metric.name)
        .whereNot('activities.id', activity.id)
        .orderBy('activities.performed_at', 'desc')
        .select('activity_metrics.metric_value')
        .first();

      const benchmark = await trx('benchmarks')
        .where({ user_id: userId, activity_name: activityName, metric_name: metric.name })
        .first();

      const direction = benchmark ? benchmark.direction : 'higher_better';
      const comparison = comparePerformance(metric.value, previous ? Number(previous.metric_value) : null, direction);
      comparisons.push({ metricName: metric.name, value: metric.value, ...comparison });
    }

    return { activity, metrics, comparisons };
  });
}

async function listBenchmarks(userId, { categoryId } = {}) {
  const query = db('benchmarks').where({ user_id: userId }).orderBy('activity_name');
  if (categoryId) query.andWhere({ category_id: categoryId });
  const benchmarks = await query;

  const results = [];
  for (const b of benchmarks) {
    const best = await db('activity_metrics')
      .join('activities', 'activities.id', 'activity_metrics.activity_id')
      .where('activities.user_id', userId)
      .where('activities.activity_name', b.activity_name)
      .where('activity_metrics.metric_name', b.metric_name)
      .modify((q) => {
        if (b.direction === 'lower_better') q.orderBy('activity_metrics.metric_value', 'asc');
        else q.orderBy('activity_metrics.metric_value', 'desc');
      })
      .select('activity_metrics.metric_value', 'activities.performed_at')
      .first();

    const latest = await db('activity_metrics')
      .join('activities', 'activities.id', 'activity_metrics.activity_id')
      .where('activities.user_id', userId)
      .where('activities.activity_name', b.activity_name)
      .where('activity_metrics.metric_name', b.metric_name)
      .orderBy('activities.performed_at', 'desc')
      .select('activity_metrics.metric_value', 'activities.performed_at')
      .first();

    const currentValue = latest ? Number(latest.metric_value) : null;
    const bestValue = best ? Number(best.metric_value) : null;
    const target = Number(b.target_value);

    let progressPct = 0;
    if (currentValue != null) {
      if (b.direction === 'lower_better') {
        // Assumes a sensible starting point isn't tracked; progress measured from current toward target.
        progressPct = currentValue <= target ? 100 : Math.max(0, Math.min(100, (target / currentValue) * 100));
      } else {
        progressPct = Math.max(0, Math.min(100, (currentValue / target) * 100));
      }
    }

    results.push({
      ...b,
      target_value: target, // override the raw numeric-as-string DB value with a clean number
      currentValue,
      bestValue,
      bestAchievedAt: best ? best.performed_at : null,
      progressPct: Math.round(progressPct * 100) / 100,
      remaining: currentValue != null ? Math.round((target - currentValue) * 1000) / 1000 : null,
    });
  }

  return results;
}

async function createBenchmark(userId, data) {
  const { activityName, metricName, targetValue, targetUnit, direction, categoryId } = data;
  const [benchmark] = await db('benchmarks')
    .insert({
      user_id: userId,
      category_id: categoryId || null,
      activity_name: activityName,
      metric_name: metricName,
      target_value: targetValue,
      target_unit: targetUnit || null,
      direction: direction || 'higher_better',
    })
    .returning('*');
  return benchmark;
}

async function updateBenchmark(userId, id, data) {
  const existing = await db('benchmarks').where({ id, user_id: userId }).first();
  if (!existing) throw new ApiError(404, 'Benchmark not found');
  const updates = {};
  ['activityName', 'metricName', 'targetValue', 'targetUnit', 'direction', 'categoryId'].forEach((key) => {
    const column = key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
    if (data[key] !== undefined) updates[column] = data[key];
  });
  await db('benchmarks').where({ id, user_id: userId }).update(updates);
  return db('benchmarks').where({ id }).first();
}

/**
 * All-time personal bests per (activity, metric) the user has ever logged -
 * unlike listBenchmarks, this needs no explicit target to have been set, so a
 * freshly-logged exercise shows up immediately. Assumes higher-is-better,
 * which covers the vast majority of gym/performance metrics (weight, reps,
 * distance); a metric where lower is better (e.g. a race time) should get an
 * explicit Benchmark with direction set, which is direction-aware.
 */
async function getPersonalBests(userId, { categoryId } = {}) {
  const query = db('activity_metrics')
    .join('activities', 'activities.id', 'activity_metrics.activity_id')
    .where('activities.user_id', userId);
  if (categoryId) query.andWhere('activities.category_id', categoryId);

  const rows = await query.select(
    'activities.activity_name',
    'activity_metrics.metric_name',
    'activity_metrics.metric_value',
    'activity_metrics.metric_unit',
    'activities.performed_at'
  );

  const grouped = new Map();
  rows.forEach((r) => {
    const key = `${r.activity_name}::${r.metric_name}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(r);
  });

  const results = [];
  grouped.forEach((entries, key) => {
    const [activityName, metricName] = key.split('::');
    const sortedByValue = [...entries].sort((a, b) => Number(b.metric_value) - Number(a.metric_value));
    const sortedByDate = [...entries].sort((a, b) => new Date(b.performed_at) - new Date(a.performed_at));
    const best = sortedByValue[0];
    const latest = sortedByDate[0];
    const previous = sortedByDate[1];

    results.push({
      activityName,
      metricName,
      unit: latest.metric_unit,
      bestValue: Number(best.metric_value),
      bestAchievedAt: best.performed_at,
      latestValue: Number(latest.metric_value),
      latestAt: latest.performed_at,
      timesLogged: entries.length,
      ...comparePerformance(Number(latest.metric_value), previous ? Number(previous.metric_value) : null, 'higher_better'),
    });
  });

  return results.sort((a, b) => a.activityName.localeCompare(b.activityName) || a.metricName.localeCompare(b.metricName));
}

async function getKnownActivityNames(userId, { categoryId } = {}) {
  const query = db('activities').where({ user_id: userId }).distinct('activity_name');
  if (categoryId) query.andWhere({ category_id: categoryId });
  const rows = await query.orderBy('activity_name');
  return rows.map((r) => r.activity_name);
}

async function deleteBenchmark(userId, id) {
  const existing = await db('benchmarks').where({ id, user_id: userId }).first();
  if (!existing) throw new ApiError(404, 'Benchmark not found');
  await db('benchmarks').where({ id, user_id: userId }).del();
}

module.exports = {
  listActivities,
  recordActivity,
  listBenchmarks,
  createBenchmark,
  updateBenchmark,
  deleteBenchmark,
  getPersonalBests,
  getKnownActivityNames,
};
