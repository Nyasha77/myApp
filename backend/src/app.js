const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const env = require('./config/env');
const routes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Render (and most PaaS hosts) terminate TLS at a reverse proxy in front of the
// app - without this, express-rate-limit can't safely derive the real client IP
// from X-Forwarded-For and throws on every request in production.
if (env.isProduction) app.set('trust proxy', 1);

const allowedOrigins = env.frontendUrl.split(',').map((s) => s.trim());
// A phone on the same Wi-Fi opens the dev server via a LAN IP (e.g. 192.168.x.x:5173)
// rather than localhost, and that IP changes with the router's DHCP lease - so in
// development, any private-network origin is allowed rather than hardcoding one.
const LAN_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+)(:\d+)?$/;

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // same-origin / non-browser requests
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (!env.isProduction && LAN_ORIGIN.test(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
