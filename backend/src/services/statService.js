const db = require('../database/db');

async function listStats(userId) {
  return db('stats').where({ user_id: userId }).orderBy('stat_name');
}

async function getStatHistory(userId, statName, limit = 100) {
  const query = db('stat_history').where({ user_id: userId }).orderBy('created_at', 'desc').limit(limit);
  if (statName) query.andWhere({ stat_name: statName });
  return query;
}

/**
 * Applies a delta to a named stat for a user, floors it at 0, and records
 * a stat_history row explaining why - so every change is explainable (see spec #51).
 */
async function applyStatChange(userId, statName, amount, reason, sourceType, sourceId = null, trx = db) {
  if (amount === 0) return null;

  const existing = await trx('stats').where({ user_id: userId, stat_name: statName }).first();
  const currentValue = existing ? Number(existing.value) : 0;
  const newValue = Math.max(0, Math.round((currentValue + amount) * 100) / 100);
  const actualDelta = Math.round((newValue - currentValue) * 100) / 100;

  if (existing) {
    await trx('stats').where({ id: existing.id }).update({ value: newValue, updated_at: trx.fn.now() });
  } else {
    await trx('stats').insert({ user_id: userId, stat_name: statName, value: newValue });
  }

  if (actualDelta !== 0) {
    await trx('stat_history').insert({
      user_id: userId,
      stat_name: statName,
      change_amount: actualDelta,
      reason,
      source_type: sourceType,
      source_id: sourceId,
    });
  }

  return { statName, previousValue: currentValue, newValue, delta: actualDelta };
}

module.exports = { listStats, getStatHistory, applyStatChange };
