/**
 * @param { import("knex").Knex } knex
 */
exports.up = async function up(knex) {
  await knex.schema.createTable('strava_connections', (t) => {
    t.increments('id').primary();
    t.integer('user_id').notNullable().unique().references('id').inTable('users').onDelete('CASCADE');
    t.bigInteger('athlete_id').notNullable();
    t.text('access_token').notNullable();
    t.text('refresh_token').notNullable();
    t.bigInteger('expires_at').notNullable(); // unix seconds, as returned by Strava
    t.string('scope', 255);
    t.timestamp('last_synced_at');
    t.timestamps(true, true);
  });

  // Lets a logged activity be traced back to the external Strava activity it
  // came from, both for display ("synced from Strava") and as the dedup key
  // that keeps a re-sync from double-logging the same run.
  await knex.schema.alterTable('activities', (t) => {
    t.string('source', 32).notNullable().defaultTo('manual'); // manual | strava
    t.string('external_id', 64);
  });

  await knex.raw(
    'CREATE UNIQUE INDEX activities_user_external_id_unique ON activities (user_id, external_id) WHERE external_id IS NOT NULL'
  );
};

/**
 * @param { import("knex").Knex } knex
 */
exports.down = async function down(knex) {
  await knex.raw('DROP INDEX IF EXISTS activities_user_external_id_unique');
  await knex.schema.alterTable('activities', (t) => {
    t.dropColumn('source');
    t.dropColumn('external_id');
  });
  await knex.schema.dropTableIfExists('strava_connections');
};
