const express = require('express');
const calendarController = require('../controllers/calendarController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', calendarController.month);
router.get('/:date', calendarController.day);

module.exports = router;
