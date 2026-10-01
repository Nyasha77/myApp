const express = require('express');
const statController = require('../controllers/statController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', statController.list);
router.get('/history', statController.history);
router.get('/decay-history', statController.decayHistory);

module.exports = router;
