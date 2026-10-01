const asyncHandler = require('../utils/asyncHandler');
const progressionService = require('../services/progressionService');
const statService = require('../services/statService');
const streakService = require('../services/streakService');
const decayService = require('../services/decayService');

const get = asyncHandler(async (req, res) => {
  await decayService.runDecayForUser(req.user.id, req.user.timezone);
  const [progression, stats, streaks] = await Promise.all([
    progressionService.getProgression(req.user.id),
    statService.listStats(req.user.id),
    streakService.getStreaks(req.user.id),
  ]);
  res.json({ progression, stats, streaks });
});

module.exports = { get };
