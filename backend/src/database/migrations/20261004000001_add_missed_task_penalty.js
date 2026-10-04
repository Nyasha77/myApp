/**
 * @param { import("knex").Knex } knex
 */
exports.up = async function up(knex) {
  await knex.schema.alterTable('users', (t) => {
    // Cursor for the lazy missed-task sweep (mirrors how decay tracks per-category
    // progress) - the last calendar date already checked for missed tasks, so a
    // return visit only has to catch up from here rather than rescan everything.
    t.date('last_missed_check');
  });

  await knex.schema.createTable('task_misses', (t) => {
    t.increments('id').primary();
    t.integer('task_id').notNullable().references('id').inTable('tasks').onDelete('CASCADE');
    t.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.date('missed_date').notNullable();
    t.boolean('penalized').notNullable().defaultTo(false);
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.unique(['task_id', 'missed_date']);
  });
};

/**
 * @param { import("knex").Knex } knex
 */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('task_misses');
  await knex.schema.alterTable('users', (t) => {
    t.dropColumn('last_missed_check');
  });
};
