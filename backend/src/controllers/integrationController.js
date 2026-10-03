const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const stravaService = require('../services/stravaService');
const env = require('../config/env');
const { ApiError } = require('../middleware/errorHandler');

// The OAuth dance is a real browser navigation (click link -> Strava -> redirect
// back), not an XHR, so it can't carry an Authorization header, and a cookie set
// by a cross-site login XHR isn't reliably stored by modern browsers either. The
// `state` param Strava echoes back verbatim is the one thing that survives the
// round trip unmodified, so it doubles as both CSRF protection (a signed value
// an attacker can't forge) and the sole carrier of "which user started this" -
// no cookie or session storage involved on either end.
const STATE_EXPIRY = '15m';

function signState(userId) {
  return jwt.sign({ uid: userId }, env.jwtSecret, { expiresIn: STATE_EXPIRY });
}

function verifyState(state) {
  const payload = jwt.verify(state, env.jwtSecret);
  return payload.uid;
}

const stravaConnect = asyncHandler(async (req, res) => {
  const state = signState(req.user.id);
  res.redirect(stravaService.getAuthorizationUrl(state));
});

const stravaCallback = asyncHandler(async (req, res) => {
  const frontendUrl = env.frontendUrl.split(',')[0].trim();
  const { code, state, error } = req.query;

  if (error) return res.redirect(`${frontendUrl}/settings?strava=denied`);

  let userId;
  try {
    userId = verifyState(state);
  } catch {
    return res.redirect(`${frontendUrl}/settings?strava=error`);
  }

  const tokenData = await stravaService.exchangeCodeForTokens(code);
  await stravaService.saveConnection(userId, tokenData);
  res.redirect(`${frontendUrl}/settings?strava=connected`);
});

const status = asyncHandler(async (req, res) => {
  const connection = await stravaService.getConnection(req.user.id);
  res.json({
    connected: Boolean(connection),
    athleteId: connection?.athlete_id || null,
    lastSyncedAt: connection?.last_synced_at || null,
  });
});

const disconnect = asyncHandler(async (req, res) => {
  await stravaService.disconnect(req.user.id);
  res.json({ success: true });
});

const sync = asyncHandler(async (req, res) => {
  const result = await stravaService.syncRuns(req.user.id, req.user.timezone);
  res.json(result);
});

const postWorkout = asyncHandler(async (req, res) => {
  const { name, durationMinutes, notes } = req.body;
  if (!durationMinutes || Number(durationMinutes) <= 0) throw new ApiError(400, 'durationMinutes is required');
  const result = await stravaService.postWorkout(req.user.id, { name, durationMinutes: Number(durationMinutes), notes });
  res.status(201).json(result);
});

module.exports = { stravaConnect, stravaCallback, status, disconnect, sync, postWorkout };
