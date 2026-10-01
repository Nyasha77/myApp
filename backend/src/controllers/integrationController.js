const crypto = require('crypto');
const asyncHandler = require('../utils/asyncHandler');
const stravaService = require('../services/stravaService');
const env = require('../config/env');
const { ApiError } = require('../middleware/errorHandler');

const STATE_COOKIE = 'strava_oauth_state';

const stravaConnect = asyncHandler(async (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  res.cookie(STATE_COOKIE, state, { httpOnly: true, secure: env.isProduction, sameSite: 'lax', maxAge: 10 * 60 * 1000 });
  res.redirect(stravaService.getAuthorizationUrl(state));
});

const stravaCallback = asyncHandler(async (req, res) => {
  const frontendUrl = env.frontendUrl.split(',')[0].trim();
  const { code, state, error } = req.query;

  if (error) return res.redirect(`${frontendUrl}/settings?strava=denied`);
  if (!state || state !== req.cookies?.[STATE_COOKIE]) return res.redirect(`${frontendUrl}/settings?strava=error`);
  res.clearCookie(STATE_COOKIE);

  const tokenData = await stravaService.exchangeCodeForTokens(code);
  await stravaService.saveConnection(req.user.id, tokenData);
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
