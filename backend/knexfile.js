require('dotenv').config();

const base = {
  client: 'pg',
  connection: process.env.DATABASE_URL,
  migrations: {
    directory: './src/database/migrations',
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: './src/database/seeds',
  },
};

module.exports = {
  development: base,
  test: {
    ...base,
    connection: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
  },
  production: {
    ...base,
    pool: { min: 2, max: 10 },
  },
};
