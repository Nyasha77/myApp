const jwt = require('jsonwebtoken');
const env = require('../config/env');

function requireAuth(req, res, next) {
  // Order: header (the SPA's own XHR calls) -> cookie (kept for same-site/local
  // dev) -> query param (a plain <a href> navigation, like the Strava connect
  // link, can't attach a header - the frontend appends ?token= for exactly that).
  const token =
    (req.headers.authorization || '').replace(/^Bearer\s+/i, '') || req.cookies?.token || req.query?.token;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.user = { id: payload.sub, username: payload.username, timezone: payload.timezone };
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}

module.exports = { requireAuth };
