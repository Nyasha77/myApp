const asyncHandler = require('../utils/asyncHandler');
const analyticsService = require('../services/analyticsService');
const { ApiError } = require('../middleware/errorHandler');
const { isValidDateString } = require('../utils/dateUtils');

const month = asyncHandler(async (req, res) => {
  const year = parseInt(req.query.year, 10);
  const monthNum = parseInt(req.query.month, 10);
  if (!year || !monthNum || monthNum < 1 || monthNum > 12) throw new ApiError(400, 'Valid year and month (1-12) are required');
  const days = await analyticsService.getCalendarMonth(req.user.id, year, monthNum);
  res.json({ year, month: monthNum, days });
});

const day = asyncHandler(async (req, res) => {
  const { date } = req.params;
  if (!isValidDateString(date)) throw new ApiError(400, 'date must be YYYY-MM-DD');
  const detail = await analyticsService.getDayDetail(req.user.id, date);
  res.json(detail);
});

module.exports = { month, day };
