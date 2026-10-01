const db = require('../database/db');
const env = require('../config/env');
const { ApiError } = require('../middleware/errorHandler');
const taskService = require('./taskService');
const performanceService = require('./performanceService');
const { todayInTimezone } = require('../utils/dateUtils');

const AUTH_URL = 'https://www.strava.com/oauth/authorize';
const TOKEN_URL = 'https://www.strava.com/oauth/token';
const API_BASE = 'https://www.strava.com/api/v3';
const SCOPE = 'activity:read_all,activity:write';
const RECENT_ACTIVITIES_PAGE_SIZE = 15; // bounds each sync regardless of history length

function assertConfigured() {
  if (!env.stravaClientId || !env.stravaClientSecret) {
    throw new ApiError(400, 'Strava integration is not configured on this server');
  }
}

function getAuthorizationUrl(state) {
  assertConfigured();
  const params = new URLSearchParams({
    client_id: env.stravaClientId,
    redirect_uri: env.stravaRedirectUri,
    response_type: 'code',
    approval_prompt: 'auto',
    scope: SCOPE,
    state: state || '',
  });
  return `${AUTH_URL}?${params.toString()}`;
}

async function exchangeCodeForTokens(code) {
  assertConfigured();
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: env.stravaClientId,
      client_secret: env.stravaClientSecret,
      code,
      grant_type: 'authorization_code',
    }),
  });
  if (!res.ok) throw new ApiError(400, `Strava rejected the authorization code (${res.status})`);
  return res.json();
}

async function saveConnection(userId, tokenData) {
  const payload = {
    user_id: userId,
    athlete_id: tokenData.athlete.id,
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expires_at: tokenData.expires_at,
    scope: SCOPE,
    updated_at: db.fn.now(),
  };
  const existing = await db('strava_connections').where({ user_id: userId }).first();
  if (existing) {
    await db('strava_connections').where({ id: existing.id }).update(payload);
  } else {
    await db('strava_connections').insert(payload);
  }
}

async function getConnection(userId) {
  return db('strava_connections').where({ user_id: userId }).first();
}

async function disconnect(userId) {
  await db('strava_connections').where({ user_id: userId }).del();
}

/**
 * Refreshes the access token if it's expired or about to be, so callers never
 * have to think about token lifetime themselves.
 */
async function ensureFreshToken(connection) {
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (connection.expires_at > nowSeconds + 60) return connection;

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: env.stravaClientId,
      client_secret: env.stravaClientSecret,
      refresh_token: connection.refresh_token,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) throw new ApiError(401, 'Strava token refresh failed - please reconnect your account');
  const data = await res.json();

  const updated = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at,
    updated_at: db.fn.now(),
  };
  await db('strava_connections').where({ id: connection.id }).update(updated);
  return { ...connection, ...updated };
}

async function fetchRecentActivities(connection) {
  const res = await fetch(`${API_BASE}/athlete/activities?per_page=${RECENT_ACTIVITIES_PAGE_SIZE}`, {
    headers: { Authorization: `Bearer ${connection.access_token}` },
  });
  if (!res.ok) throw new ApiError(502, `Strava activity fetch failed (${res.status})`);
  return res.json();
}

/**
 * Finds today's incomplete task named "Run" (case-insensitive) for the user,
 * or creates one under the given category and marks it done - matching how a
 * manually-ticked task behaves (XP, stat gains, streaks all fire normally).
 */
async function findOrCreateRunTask(userId, { timezone, fallbackCategoryId }) {
  const today = todayInTimezone(timezone);
  const candidates = await db('tasks').where({ user_id: userId, scheduled_date: today });
  let task = candidates.find((t) => t.title.trim().toLowerCase() === 'run' && !t.completed);

  if (!task) {
    task = await taskService.createTask(userId, {
      title: 'Run',
      categoryId: fallbackCategoryId || null,
      weight: 20,
      difficulty: 'normal',
      taskType: 'performance',
      scheduledDate: today,
      recurrenceType: 'none',
    });
  }
  return task;
}

async function getFitnessCategoryId(userId) {
  const category = await db('categories')
    .where({ user_id: userId, active: true })
    .whereRaw('LOWER(name) = ?', ['fitness'])
    .first();
  return category ? category.id : null;
}

/**
 * Pulls the athlete's most recent Strava activities, and for each run not
 * already recorded (de-duplicated by Strava's activity id), completes today's
 * "Run" task and logs the distance/time/pace as a performance activity.
 * Safe to call repeatedly - already-synced runs are skipped via external_id.
 */
async function syncRuns(userId, timezone) {
  const connection = await getConnection(userId);
  if (!connection) return { connected: false, newRuns: [] };

  const fresh = await ensureFreshToken(connection);
  const activities = await fetchRecentActivities(fresh);
  const runs = activities.filter((a) => a.type === 'Run' || a.sport_type === 'Run');

  const newRuns = [];
  const fallbackCategoryId = await getFitnessCategoryId(userId);

  for (const run of runs) {
    const externalId = String(run.id);
    const alreadySynced = await db('activities').where({ user_id: userId, external_id: externalId }).first();
    if (alreadySynced) continue;

    const task = await findOrCreateRunTask(userId, { timezone, fallbackCategoryId });
    let completionResult = null;
    if (!task.completed) {
      completionResult = await taskService.completeTask(userId, task.id, { timezone });
    }

    const distanceKm = Math.round((run.distance / 1000) * 100) / 100;
    const movingMinutes = Math.round((run.moving_time / 60) * 10) / 10;
    const paceMinPerKm = distanceKm > 0 ? Math.round((run.moving_time / 60 / distanceKm) * 100) / 100 : null;

    const { activity } = await performanceService.recordActivity(userId, {
      categoryId: fallbackCategoryId,
      taskId: task.id,
      activityName: 'Run',
      activityType: 'strava_run',
      metrics: [
        { name: 'distance', value: distanceKm, unit: 'km' },
        { name: 'duration', value: movingMinutes, unit: 'min' },
        ...(paceMinPerKm ? [{ name: 'pace', value: paceMinPerKm, unit: 'min/km' }] : []),
      ],
      notes: run.name || null,
      performedAt: run.start_date,
    });

    await db('activities').where({ id: activity.id }).update({ source: 'strava', external_id: externalId });

    newRuns.push({ stravaName: run.name, distanceKm, movingMinutes, task, completionResult });
  }

  await db('strava_connections').where({ id: connection.id }).update({ last_synced_at: db.fn.now() });

  return { connected: true, newRuns };
}

/**
 * Posts a completed workout from this app to Strava as a manual activity -
 * the reverse direction of syncRuns.
 */
async function postWorkout(userId, { name, durationMinutes, notes }) {
  const connection = await getConnection(userId);
  if (!connection) throw new ApiError(400, 'Strava is not connected');
  const fresh = await ensureFreshToken(connection);

  const res = await fetch(`${API_BASE}/activities`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${fresh.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: name || 'Gym session',
      type: 'Workout',
      sport_type: 'Workout',
      start_date_local: new Date().toISOString().slice(0, 19), // Strava expects local time with no 'Z'/millis
      elapsed_time: Math.round((durationMinutes || 60) * 60),
      description: notes || undefined,
    }),
  });
  if (!res.ok) throw new ApiError(502, `Strava rejected the posted activity (${res.status})`);
  return res.json();
}

module.exports = {
  getAuthorizationUrl,
  exchangeCodeForTokens,
  saveConnection,
  getConnection,
  disconnect,
  syncRuns,
  postWorkout,
};
