require('dotenv').config();

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  defaultTimezone: process.env.DEFAULT_TIMEZONE || 'Africa/Windhoek',
  isProduction: process.env.NODE_ENV === 'production',
  // Optional: the Strava integration is simply unavailable (routes 400) until these are set.
  stravaClientId: process.env.STRAVA_CLIENT_ID || null,
  stravaClientSecret: process.env.STRAVA_CLIENT_SECRET || null,
  // Must use the exact host registered as the app's "Authorization Callback Domain"
  // on Strava (localhost in dev) - a LAN IP or 127.0.0.1 will be rejected even
  // though they resolve to the same machine, so connecting Strava has to be done
  // from the browser on this PC, not from the phone.
  stravaRedirectUri: process.env.STRAVA_REDIRECT_URI || `http://localhost:${process.env.PORT || '4000'}/api/integrations/strava/callback`,
};
