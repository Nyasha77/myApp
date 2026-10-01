const express = require('express');
const { body } = require('express-validator');
const taskController = require('../controllers/taskController');
const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', taskController.list);
router.post(
  '/',
  [body('title').isString().notEmpty(), body('scheduledDate').isString().notEmpty(), body('weight').optional().isFloat({ min: 0 })],
  validate,
  taskController.create
);
router.put('/:id', taskController.update);
router.delete('/:id', taskController.remove);
router.post('/:id/complete', taskController.complete);
router.post('/:id/uncomplete', taskController.uncomplete);

module.exports = router;
