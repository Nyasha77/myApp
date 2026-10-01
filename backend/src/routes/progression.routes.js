const express = require('express');
const progressionController = require('../controllers/progressionController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);
router.get('/', progressionController.get);

module.exports = router;
