const asyncHandler = require('../utils/asyncHandler');
const achievementService = require('../services/achievementService');

const list = asyncHandler(async (req, res) => {
  const achievements = await achievementService.listAchievements(req.user.id);
  res.json(achievements);
});

module.exports = { list };
