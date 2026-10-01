const asyncHandler = require('../utils/asyncHandler');
const performanceService = require('../services/performanceService');

const list = asyncHandler(async (req, res) => {
  const benchmarks = await performanceService.listBenchmarks(req.user.id, { categoryId: req.query.categoryId });
  res.json(benchmarks);
});

const create = asyncHandler(async (req, res) => {
  const benchmark = await performanceService.createBenchmark(req.user.id, req.body);
  res.status(201).json(benchmark);
});

const update = asyncHandler(async (req, res) => {
  const benchmark = await performanceService.updateBenchmark(req.user.id, req.params.id, req.body);
  res.json(benchmark);
});

const remove = asyncHandler(async (req, res) => {
  await performanceService.deleteBenchmark(req.user.id, req.params.id);
  res.status(204).send();
});

module.exports = { list, create, update, remove };
