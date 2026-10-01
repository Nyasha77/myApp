const db = require('../database/db');
const { ApiError } = require('../middleware/errorHandler');

async function listCategories(userId, { includeInactive = false } = {}) {
  const query = db('categories').where({ user_id: userId }).orderBy('name');
  if (!includeInactive) query.andWhere({ active: true });
  const categories = await query;

  const categoryIds = categories.map((c) => c.id);
  const stats = categoryIds.length
    ? await db('category_stats').whereIn('category_id', categoryIds)
    : [];

  return categories.map((c) => ({
    ...c,
    stats: stats.filter((s) => s.category_id === c.id).map((s) => ({ statName: s.stat_name, weight: Number(s.weight) })),
  }));
}

async function getCategory(userId, categoryId) {
  const category = await db('categories').where({ id: categoryId, user_id: userId }).first();
  if (!category) throw new ApiError(404, 'Category not found');
  const stats = await db('category_stats').where({ category_id: categoryId });
  return { ...category, stats: stats.map((s) => ({ statName: s.stat_name, weight: Number(s.weight) })) };
}

async function createCategory(userId, data) {
  const { name, description, icon, color, decayGraceDays, decayRate, stats } = data;

  return db.transaction(async (trx) => {
    const [category] = await trx('categories')
      .insert({
        user_id: userId,
        name,
        description,
        icon: icon || 'Circle',
        color: color || 'blue',
        decay_grace_days: decayGraceDays ?? null,
        decay_rate: decayRate ?? null,
      })
      .returning('*');

    if (Array.isArray(stats) && stats.length) {
      await trx('category_stats').insert(
        stats.map((s) => ({ category_id: category.id, stat_name: s.statName, weight: s.weight }))
      );
    }

    return getCategory(userId, category.id);
  });
}

async function updateCategory(userId, categoryId, data) {
  await getCategory(userId, categoryId);
  const { name, description, icon, color, active, decayGraceDays, decayRate, stats } = data;

  return db.transaction(async (trx) => {
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (icon !== undefined) updates.icon = icon;
    if (color !== undefined) updates.color = color;
    if (active !== undefined) updates.active = active;
    if (decayGraceDays !== undefined) updates.decay_grace_days = decayGraceDays;
    if (decayRate !== undefined) updates.decay_rate = decayRate;
    updates.updated_at = trx.fn.now();

    await trx('categories').where({ id: categoryId, user_id: userId }).update(updates);

    if (Array.isArray(stats)) {
      await trx('category_stats').where({ category_id: categoryId }).del();
      if (stats.length) {
        await trx('category_stats').insert(
          stats.map((s) => ({ category_id: categoryId, stat_name: s.statName, weight: s.weight }))
        );
      }
    }

    return getCategory(userId, categoryId);
  });
}

async function deleteCategory(userId, categoryId) {
  await getCategory(userId, categoryId);
  await db('categories').where({ id: categoryId, user_id: userId }).del();
}

module.exports = { listCategories, getCategory, createCategory, updateCategory, deleteCategory };
