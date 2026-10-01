const express = require('express');
const { requireAuth } = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');

const router = express.Router();

router.use('/auth', require('./auth.routes'));
router.get('/dashboard', requireAuth, dashboardController.get);
router.use('/tasks', require('./task.routes'));
router.use('/categories', require('./category.routes'));
router.use('/stats', require('./stat.routes'));
router.use('/calendar', require('./calendar.routes'));
router.use('/analytics', require('./analytics.routes'));
router.use('/achievements', require('./achievement.routes'));
router.use('/progression', require('./progression.routes'));
router.use('/activities', require('./activity.routes'));
router.use('/benchmarks', require('./benchmark.routes'));
router.use('/integrations', require('./integration.routes'));

module.exports = router;
