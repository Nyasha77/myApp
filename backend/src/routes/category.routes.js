const express = require('express');
const { body } = require('express-validator');
const categoryController = require('../controllers/categoryController');
const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', categoryController.list);
router.post('/', [body('name').isString().notEmpty()], validate, categoryController.create);
router.put('/:id', categoryController.update);
router.delete('/:id', categoryController.remove);

module.exports = router;
