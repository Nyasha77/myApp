const express = require('express');
const { requireAuth } = require('../middleware/auth');
const integrationController = require('../controllers/integrationController');

const router = express.Router();

router.get('/strava/connect', requireAuth, integrationController.stravaConnect);
router.get('/strava/callback', requireAuth, integrationController.stravaCallback);
router.get('/strava/status', requireAuth, integrationController.status);
router.delete('/strava/disconnect', requireAuth, integrationController.disconnect);
router.post('/strava/sync', requireAuth, integrationController.sync);
router.post('/strava/post-workout', requireAuth, integrationController.postWorkout);

module.exports = router;
