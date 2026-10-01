const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../database/db');
const env = require('../config/env');
const asyncHandler = require('../utils/asyncHandler');
const { ApiError } = require('../middleware/errorHandler');

const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function signToken(user) {
  return jwt.sign(
    { sub: user.id, username: user.username, timezone: user.timezone },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

function setAuthCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE_MS,
  });
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
  res.clearCookie('token');
  res.json({ success: true });
});

const me = asyncHandler(async (req, res) => {
  const user = await db('users').where({ id: req.user.id }).first();
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ id: user.id, username: user.username, email: user.email, timezone: user.timezone });
});

module.exports = { login, logout, me };
