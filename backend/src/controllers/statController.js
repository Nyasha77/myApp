const asyncHandler = require('../utils/asyncHandler');
const statService = require('../services/statService');
const decayService = require('../services/decayService');

const list = asyncHandler(async (req, res) => {
  await decayService.runDecayForUser(req.user.id, req.user.timezone);
  const stats = await statService.listStats(req.user.id);
  res.json(stats);
});

const history = asyncHandler(async (req, res) => {
  const rows = await statService.getStatHistory(req.user.id, req.query.stat, Number(req.query.limit) || 100);
  res.json(rows);
});

const decayHistory = asyncHandler(async (req, res) => {
  const rows = await decayService.getDecayHistory(req.user.id, Number(req.query.limit) || 50);
  res.json(rows);
});

module.exports = { list, history, decayHistory };
