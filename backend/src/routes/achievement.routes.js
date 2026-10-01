const express = require('express');
const achievementController = require('../controllers/achievementController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);
router.get('/', achievementController.list);

module.exports = router;
