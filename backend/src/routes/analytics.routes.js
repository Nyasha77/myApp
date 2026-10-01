const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/daily', analyticsController.daily);
router.get('/weekly', analyticsController.weekly);
router.get('/monthly', analyticsController.monthly);
router.get('/range', analyticsController.range);

module.exports = router;
