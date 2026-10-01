/**
 * @param { import("knex").Knex } knex
 */
exports.up = async function up(knex) {
  await knex.schema.alterTable('benchmarks', (t) => {
    t.integer('category_id').references('id').inTable('categories').onDelete('SET NULL');
  });
};

/**
 * @param { import("knex").Knex } knex
 */
exports.down = async function down(knex) {
  await knex.schema.alterTable('benchmarks', (t) => {
    t.dropColumn('category_id');
  });
};
