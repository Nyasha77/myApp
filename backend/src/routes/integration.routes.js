const express = require('express');
const { requireAuth } = require('../middleware/auth');
const integrationController = require('../controllers/integrationController');

const router = express.Router();

router.get('/strava/connect', requireAuth, integrationController.stravaConnect);
// No requireAuth here - Strava's redirect back is a fresh browser navigation with
// no auth of its own; the signed `state` it echoes back carries the user identity.
router.get('/strava/callback', integrationController.stravaCallback);
router.get('/strava/status', requireAuth, integrationController.status);
router.delete('/strava/disconnect', requireAuth, integrationController.disconnect);
router.post('/strava/sync', requireAuth, integrationController.sync);
router.post('/strava/post-workout', requireAuth, integrationController.postWorkout);

module.exports = router;
