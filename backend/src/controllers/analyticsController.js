const asyncHandler = require('../utils/asyncHandler');
const analyticsService = require('../services/analyticsService');
const { todayInTimezone, isValidDateString } = require('../utils/dateUtils');
const { ApiError } = require('../middleware/errorHandler');

const daily = asyncHandler(async (req, res) => {
  const date = req.query.date && isValidDateString(req.query.date) ? req.query.date : todayInTimezone(req.user.timezone);
  const stats = await analyticsService.getRangeStats(req.user.id, date, date);
  res.json(stats);
});

const weekly = asyncHandler(async (req, res) => {
  const reference = req.query.date && isValidDateString(req.query.date) ? req.query.date : todayInTimezone(req.user.timezone);
  const stats = await analyticsService.getWeeklyStats(req.user.id, reference);
  res.json(stats);
});

const monthly = asyncHandler(async (req, res) => {
  const today = todayInTimezone(req.user.timezone);
  const year = parseInt(req.query.year, 10) || parseInt(today.slice(0, 4), 10);
  const month = parseInt(req.query.month, 10) || parseInt(today.slice(5, 7), 10);
  const stats = await analyticsService.getMonthlyStats(req.user.id, year, month);
  res.json(stats);
});

const range = asyncHandler(async (req, res) => {
  const { start, end } = req.query;
  if (!isValidDateString(start) || !isValidDateString(end)) throw new ApiError(400, 'start and end (YYYY-MM-DD) are required');
  const stats = await analyticsService.getRangeStats(req.user.id, start, end);
  res.json(stats);
});

module.exports = { daily, weekly, monthly, range };
