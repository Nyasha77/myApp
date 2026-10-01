const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../database/db');
const env = require('../config/env');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError } = require('../middleware/errorHandler');

const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

// This cookie is a fallback, not the SPA's real auth mechanism - the frontend
// authenticates its own XHR/fetch calls with an Authorization: Bearer header
// instead (see frontend/src/api/client.js for why: cross-site cookies and
// Safari/iOS don't mix well). The cookie exists only for requireAuth to
// identify the user on the Strava OAuth redirect, which is a real top-level
// browser navigation with no way to attach a header - and SameSite=Lax is
// sent on exactly that kind of cross-site navigation, so it still works there.
const COOKIE_OPTIONS = { httpOnly: true, secure: env.isProduction, sameSite: 'lax', maxAge: COOKIE_MAX_AGE_MS };

function signToken(user) {
  return jwt.sign(
    { sub: user.id, username: user.username, timezone: user.timezone },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

function setAuthCookie(res, token) {
  res.cookie('token', token, COOKIE_OPTIONS);
}

const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) throw new ApiError(400, 'Username/email and password are required');

  const user = await db('users').where({ username: identifier }).orWhere({ email: identifier }).first();
  if (!user) throw new ApiError(401, 'Invalid credentials');

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new ApiError(401, 'Invalid credentials');

  const token = signToken(user);
  setAuthCookie(res, token);

  res.json({
    token,
    user: { id: user.id, username: user.username, email: user.email, timezone: user.timezone },
  });
});

const logout = asyncHandler(async (req, res) => {
  // clearCookie must be called with the same attributes used to set it, or
  // some browsers won't recognize it as the same cookie and silently no-op.
  res.clearCookie('token', COOKIE_OPTIONS);
  res.json({ success: true });
});

const me = asyncHandler(async (req, res) => {
  const user = await db('users').where({ id: req.user.id }).first();
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ id: user.id, username: user.username, email: user.email, timezone: user.timezone });
});

module.exports = { login, logout, me };
