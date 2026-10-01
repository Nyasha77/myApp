const { types } = require('pg');
const knex = require('knex');
const knexConfig = require('../../knexfile');
const env = require('../config/env');

// By default node-postgres parses DATE columns into JS Date objects at local
// midnight, which silently shifts the calendar day for any timezone not at
// UTC+0 (e.g. Africa/Windhoek, UTC+2) and breaks every string-based date
// comparison in this codebase (recurrence matching, streaks, decay). Every
// date is treated as a plain 'YYYY-MM-DD' string end-to-end instead.
const PG_TYPE_DATE = 1082;
types.setTypeParser(PG_TYPE_DATE, (value) => value);

const config = knexConfig[env.nodeEnv] || knexConfig.development;

const db = knex(config);

module.exports = db;
