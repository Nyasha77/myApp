const express = require('express');
const { body } = require('express-validator');
const benchmarkController = require('../controllers/benchmarkController');
const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', benchmarkController.list);
router.post(
  '/',
  [body('activityName').isString().notEmpty(), body('metricName').isString().notEmpty(), body('targetValue').isFloat()],
  validate,
  benchmarkController.create
);
router.put('/:id', benchmarkController.update);
router.delete('/:id', benchmarkController.remove);

module.exports = router;
