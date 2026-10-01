# Ascend

A personal productivity and progression app: weighted tasks, categories, RPG-style
stats/XP/levels, streaks, inactivity decay, performance tracking with benchmarks,
achievements, and calendar/analytics history. Mobile-first (built for iPhone 13),
with a full desktop layout.

This is a single-user (or small, manually-provisioned multi-user) app — there is
no public sign-up. An administrator creates accounts directly via the seed script
or SQL.

## Stack

- **Frontend**: React 18 + Vite, Tailwind CSS, React Router, Recharts, Lucide icons
- **Backend**: Node.js + Express, Knex (migrations/query builder)
- **Database**: PostgreSQL
- **Auth**: JWT in an httpOnly cookie, bcrypt password hashing

## Project layout

```
backend/
  src/
    config/       # env, and the single source of truth for XP/level/decay/streak formulas (gameConfig.js)
    controllers/  # thin HTTP handlers
    services/     # business logic (progression, stats, streaks, decay, achievements, tasks, analytics, performance)
    routes/
    middleware/   # auth, error handling, validation, rate limiting
    database/     # knex instance, migrations, seeds
  tests/          # jest unit/integration tests
frontend/
  src/
    api/          # one file per REST resource
    components/   # reusable UI (TaskCard, ProgressRing, XPBar, StatCard, ...)
    pages/        # one per route
    context/      # auth, theme, toast/notification providers
```

## Requirements

- Node.js 20+
- PostgreSQL 14+ (a `docker-compose.yml` is included for local dev)

## Setup

### 1. Database

```bash
docker compose up -d          # starts Postgres on localhost:5433
```

(Note the non-standard port — chosen to avoid colliding with any Postgres you may
already have running on the default 5432.)

### 2. Backend

```bash
cd backend
cp .env.example .env          # fill in DATABASE_URL, JWT_SECRET, etc.
npm install
npm run migrate               # create schema
npm run seed                  # creates the one user + starter categories/stats/tasks
npm run dev                   # http://localhost:4000
```

The seed script reads `SEED_USERNAME` / `SEED_EMAIL` / `SEED_PASSWORD` from `.env`
to create the initial (and, by default, only) login. Re-run `npm run seed` any time
to reset to a clean demo state — it's destructive to existing data, so only use it
in development.

### 3. Frontend

```bash
cd frontend
cp .env.example .env          # VITE_API_URL, defaults to http://localhost:4000/api
npm install
npm run dev                   # http://localhost:5173
```

Open http://localhost:5173 and log in with the seeded credentials.

## Environment variables

**backend/.env**

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `JWT_SECRET` | Long random string used to sign session tokens |
| `JWT_EXPIRES_IN` | Session lifetime (e.g. `7d`) |
| `FRONTEND_URL` | Allowed CORS origin(s), comma-separated |
| `DEFAULT_TIMEZONE` | IANA timezone used to resolve "today" (e.g. `Africa/Windhoek`) |
| `SEED_USERNAME`, `SEED_EMAIL`, `SEED_PASSWORD` | Used only by `npm run seed` |

**frontend/.env**

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Base URL of the backend API |

Never commit `.env` — only `.env.example`.

## Database migrations

```bash
cd backend
npm run migrate            # apply
npm run migrate:rollback   # undo the last batch
```

Historical data (task completions, stat history, decay events, daily summaries) is
never overwritten by later state changes — every table that represents "what
happened" is append-only, so progression over time stays reconstructable.

## Tests

```bash
cd backend
npm test
```

Covers the progression/XP formulas, level thresholds, streak calculation (first
day, consecutive days, missed days, category-specific), decay windows (grace
period, accumulation, resuming activity), weighted daily progress, and auth
(valid/invalid credentials, protected routes).

## Production build

```bash
cd frontend
npm run build      # outputs to frontend/dist
```

```bash
cd backend
npm start           # runs src/server.js directly (no build step needed)
```

## Deployment

Designed for free-tier hosting:

- **Frontend**: any static host (Vercel, Netlify) serving `frontend/dist`
- **Backend**: any Node host with a persistent process (Render, Railway, Fly.io free tiers)
- **Database**: any managed Postgres free tier (Neon, Supabase, Railway)

Set the same environment variables listed above on whichever platforms you choose.
Point the frontend's `VITE_API_URL` at the deployed backend URL, and the backend's
`FRONTEND_URL` at the deployed frontend origin (for CORS).

## Authentication model

There is no registration endpoint. Create additional users by inserting a row into
`users` with a bcrypt hash (`bcrypt.hash(password, 12)`), or by adapting the seed
script. Every API route except `/api/auth/login` requires a valid JWT (sent as an
httpOnly cookie by default, or via `Authorization: Bearer <token>`), and every
query is scoped to `req.user.id` — one user can never read or modify another's data.

## Gamification rules

Every formula — XP per task, level thresholds, stat gain per completion, decay
grace period/rate, streak bonus — lives in `backend/src/config/gameConfig.js`.
Nothing elsewhere hardcodes a formula; adjust the constants there to retune the
game without touching business logic.
