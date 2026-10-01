const express = require('express');
const { body } = require('express-validator');
const activityController = require('../controllers/activityController');
const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

router.get('/', activityController.list);
router.get('/personal-bests', activityController.personalBests);
router.get('/known-names', activityController.knownNames);
router.post('/', [body('activityName').isString().notEmpty(), body('metrics').isArray({ min: 1 })], validate, activityController.create);

module.exports = router;
