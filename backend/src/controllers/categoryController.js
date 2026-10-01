const asyncHandler = require('../utils/asyncHandler');
const categoryService = require('../services/categoryService');

const list = asyncHandler(async (req, res) => {
  const categories = await categoryService.listCategories(req.user.id, { includeInactive: req.query.includeInactive === 'true' });
  res.json(categories);
});

const create = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.user.id, req.body);
  res.status(201).json(category);
});

const update = asyncHandler(async (req, res) => {
  const category = await categoryService.updateCategory(req.user.id, req.params.id, req.body);
  res.json(category);
});

const remove = asyncHandler(async (req, res) => {
  await categoryService.deleteCategory(req.user.id, req.params.id);
  res.status(204).send();
});

module.exports = { list, create, update, remove };
