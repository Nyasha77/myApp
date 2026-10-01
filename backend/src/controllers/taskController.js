const asyncHandler = require('../utils/asyncHandler');
const taskService = require('../services/taskService');
const { todayInTimezone, isValidDateString } = require('../utils/dateUtils');
const { ApiError } = require('../middleware/errorHandler');

function resolveDate(req) {
  const { date } = req.query;
  if (date) {
    if (!isValidDateString(date)) throw new ApiError(400, 'date must be YYYY-MM-DD');
    return date;
  }
  return todayInTimezone(req.user.timezone);
}

const list = asyncHandler(async (req, res) => {
  const date = resolveDate(req);
  const tasks = await taskService.getTasksForDate(req.user.id, date);
  res.json({ date, tasks });
});

const create = asyncHandler(async (req, res) => {
  const task = await taskService.createTask(req.user.id, req.body);
  res.status(201).json(task);
});

const update = asyncHandler(async (req, res) => {
  const task = await taskService.updateTask(req.user.id, req.params.id, req.body);
  res.json(task);
});

const remove = asyncHandler(async (req, res) => {
  await taskService.deleteTask(req.user.id, req.params.id);
  res.status(204).send();
});

const complete = asyncHandler(async (req, res) => {
  const date = req.body.date || todayInTimezone(req.user.timezone);
  const result = await taskService.completeTask(req.user.id, req.params.id, { date, timezone: req.user.timezone });
  res.json(result);
});

const uncomplete = asyncHandler(async (req, res) => {
  const date = req.body.date || todayInTimezone(req.user.timezone);
  const result = await taskService.uncompleteTask(req.user.id, req.params.id, { date, timezone: req.user.timezone });
  res.json(result);
});

module.exports = { list, create, update, remove, complete, uncomplete };
