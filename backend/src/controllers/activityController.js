const asyncHandler = require('../utils/asyncHandler');
const performanceService = require('../services/performanceService');
const achievementService = require('../services/achievementService');
const db = require('../database/db');

const list = asyncHandler(async (req, res) => {
  const activities = await performanceService.listActivities(req.user.id, {
    categoryId: req.query.categoryId,
    activityName: req.query.activityName,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  });
  res.json(activities);
});

const create = asyncHandler(async (req, res) => {
  const result = await performanceService.recordActivity(req.user.id, req.body);

  const benchmarkBeaten = result.comparisons.some((c) => c.isPersonalBest && c.hasPrevious);
  const newAchievements = await achievementService.evaluateAchievements(req.user.id, { benchmarkBeaten }, db);

  res.status(201).json({ ...result, newAchievements });
});

const personalBests = asyncHandler(async (req, res) => {
  const bests = await performanceService.getPersonalBests(req.user.id, { categoryId: req.query.categoryId });
  res.json(bests);
});

const knownNames = asyncHandler(async (req, res) => {
  const names = await performanceService.getKnownActivityNames(req.user.id, { categoryId: req.query.categoryId });
  res.json(names);
});

module.exports = { list, create, personalBests, knownNames };
