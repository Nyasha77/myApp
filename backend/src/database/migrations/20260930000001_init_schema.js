/**
 * @param { import("knex").Knex } knex
 */
exports.up = async function up(knex) {
  await knex.schema.createTable('users', (t) => {
    t.increments('id').primary();
    t.string('username', 64).notNullable().unique();
    t.string('email', 255).notNullable().unique();
    t.string('password_hash', 255).notNullable();
    t.string('timezone', 64).notNullable().defaultTo('Africa/Windhoek');
    t.timestamps(true, true);
  });

  await knex.schema.createTable('categories', (t) => {
    t.increments('id').primary();
    t.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.string('name', 100).notNullable();
    t.text('description');
    t.string('icon', 64).notNullable().defaultTo('Circle');
    t.string('color', 32).notNullable().defaultTo('blue');
    t.boolean('active').notNullable().defaultTo(true);
    t.integer('decay_grace_days');
    t.decimal('decay_rate', 6, 3);
    t.date('last_decay_check');
    t.boolean('is_decaying').notNullable().defaultTo(false);
    t.timestamps(true, true);
    t.unique(['user_id', 'name']);
  });

  await knex.schema.createTable('stats', (t) => {
    t.increments('id').primary();
    t.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.string('stat_name', 64).notNullable();
    t.decimal('value', 8, 2).notNullable().defaultTo(0);
    t.timestamps(true, true);
    t.unique(['user_id', 'stat_name']);
  });

  await knex.schema.createTable('category_stats', (t) => {
    t.increments('id').primary();
    t.integer('category_id').notNullable().references('id').inTable('categories').onDelete('CASCADE');
    t.string('stat_name', 64).notNullable();
    t.decimal('weight', 5, 2).notNullable().defaultTo(1);
    t.unique(['category_id', 'stat_name']);
  });

  await knex.schema.createTable('tasks', (t) => {
    t.increments('id').primary();
    t.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.integer('category_id').references('id').inTable('categories').onDelete('SET NULL');
    t.string('title', 200).notNullable();
    t.text('description');
    t.decimal('weight', 5, 2).notNullable().defaultTo(10);
    t.string('difficulty', 16).notNullable().defaultTo('normal');
    t.string('task_type', 24).notNullable().defaultTo('standard'); // standard | recurring | performance
    t.integer('xp_reward'); // explicit override; null = computed from config
    t.date('scheduled_date').notNullable();
    t.string('recurrence_type', 24).notNullable().defaultTo('none'); // none | daily | weekly | custom
    t.jsonb('recurrence_config');
    t.boolean('completed').notNullable().defaultTo(false);
    t.timestamp('completed_at');
    t.timestamps(true, true);
    t.index(['user_id', 'scheduled_date']);
  });

  await knex.schema.createTable('task_completions', (t) => {
    t.increments('id').primary();
    t.integer('task_id').notNullable().references('id').inTable('tasks').onDelete('CASCADE');
    t.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.date('completion_date').notNullable();
    t.timestamp('completed_at').notNullable().defaultTo(knex.fn.now());
    t.integer('xp_earned').notNullable().defaultTo(0);
    t.decimal('weight_at_completion', 5, 2).notNullable().defaultTo(0);
    t.unique(['task_id', 'completion_date']);
    t.index(['user_id', 'completion_date']);
  });

  await knex.schema.createTable('activities', (t) => {
    t.increments('id').primary();
    t.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.integer('category_id').references('id').inTable('categories').onDelete('SET NULL');
    t.integer('task_id').references('id').inTable('tasks').onDelete('SET NULL');
    t.string('activity_name', 150).notNullable();
    t.string('activity_type', 64).notNullable().defaultTo('generic');
    t.timestamp('performed_at').notNullable().defaultTo(knex.fn.now());
    t.text('notes');
    t.timestamps(true, true);
    t.index(['user_id', 'activity_name']);
  });

  await knex.schema.createTable('activity_metrics', (t) => {
    t.increments('id').primary();
    t.integer('activity_id').notNullable().references('id').inTable('activities').onDelete('CASCADE');
    t.string('metric_name', 64).notNullable();
    t.decimal('metric_value', 12, 3).notNullable();
    t.string('metric_unit', 32);
  });

  await knex.schema.createTable('benchmarks', (t) => {
    t.increments('id').primary();
    t.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.string('activity_name', 150).notNullable();
    t.string('metric_name', 64).notNullable();
    t.decimal('target_value', 12, 3).notNullable();
    t.string('target_unit', 32);
    t.string('direction', 16).notNullable().defaultTo('higher_better'); // higher_better | lower_better
    t.timestamps(true, true);
  });

  await knex.schema.createTable('stat_history', (t) => {
    t.increments('id').primary();
    t.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.string('stat_name', 64).notNullable();
    t.decimal('change_amount', 8, 3).notNullable();
    t.string('reason', 255).notNullable();
    t.string('source_type', 32).notNullable(); // task_completion | decay | achievement
    t.integer('source_id');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.index(['user_id', 'stat_name']);
  });

  await knex.schema.createTable('user_progression', (t) => {
    t.integer('user_id').primary().references('id').inTable('users').onDelete('CASCADE');
    t.integer('level').notNullable().defaultTo(1);
    t.integer('total_xp').notNullable().defaultTo(0);
    t.integer('current_xp').notNullable().defaultTo(0);
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('achievements', (t) => {
    t.increments('id').primary();
    t.string('key', 64).notNullable().unique();
    t.string('name', 150).notNullable();
    t.text('description');
    t.string('icon', 64).notNullable().defaultTo('Award');
    t.string('requirement_type', 32).notNullable();
    t.decimal('requirement_value', 10, 2);
  });

  await knex.schema.createTable('user_achievements', (t) => {
    t.increments('id').primary();
    t.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.integer('achievement_id').notNullable().references('id').inTable('achievements').onDelete('CASCADE');
    t.timestamp('unlocked_at').notNullable().defaultTo(knex.fn.now());
    t.unique(['user_id', 'achievement_id']);
  });

  await knex.schema.createTable('streaks', (t) => {
    t.increments('id').primary();
    t.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.integer('category_id').references('id').inTable('categories').onDelete('CASCADE');
    t.string('streak_type', 16).notNullable().defaultTo('overall'); // overall | category
    t.integer('current_streak').notNullable().defaultTo(0);
    t.integer('longest_streak').notNullable().defaultTo(0);
    t.date('last_activity_date');
    t.timestamps(true, true);
    t.unique(['user_id', 'category_id', 'streak_type']);
  });

  await knex.schema.createTable('decay_events', (t) => {
    t.increments('id').primary();
    t.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.integer('category_id').references('id').inTable('categories').onDelete('CASCADE');
    t.string('stat_name', 64).notNullable();
    t.decimal('amount', 8, 3).notNullable();
    t.integer('days_inactive').notNullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('daily_summaries', (t) => {
    t.increments('id').primary();
    t.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.date('date').notNullable();
    t.decimal('progress_percentage', 5, 2).notNullable().defaultTo(0);
    t.integer('xp_earned').notNullable().defaultTo(0);
    t.integer('tasks_completed').notNullable().defaultTo(0);
    t.integer('tasks_total').notNullable().defaultTo(0);
    t.timestamps(true, true);
    t.unique(['user_id', 'date']);
  });
};

/**
 * @param { import("knex").Knex } knex
 */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('daily_summaries');
  await knex.schema.dropTableIfExists('decay_events');
  await knex.schema.dropTableIfExists('streaks');
  await knex.schema.dropTableIfExists('user_achievements');
  await knex.schema.dropTableIfExists('achievements');
  await knex.schema.dropTableIfExists('user_progression');
  await knex.schema.dropTableIfExists('stat_history');
  await knex.schema.dropTableIfExists('benchmarks');
  await knex.schema.dropTableIfExists('activity_metrics');
  await knex.schema.dropTableIfExists('activities');
  await knex.schema.dropTableIfExists('task_completions');
  await knex.schema.dropTableIfExists('tasks');
  await knex.schema.dropTableIfExists('category_stats');
  await knex.schema.dropTableIfExists('stats');
  await knex.schema.dropTableIfExists('categories');
  await knex.schema.dropTableIfExists('users');
};
