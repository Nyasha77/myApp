const bcrypt = require('bcrypt');

const SEED_USERNAME = process.env.SEED_USERNAME || 'admin';
const SEED_EMAIL = process.env.SEED_EMAIL || 'admin@example.com';
const SEED_PASSWORD = process.env.SEED_PASSWORD || 'changeme123';
const DEFAULT_TIMEZONE = process.env.DEFAULT_TIMEZONE || 'Africa/Windhoek';

const STATS = ['Strength', 'Intelligence', 'Discipline', 'Endurance', 'Focus', 'Consistency'];

const CATEGORIES = [
  { name: 'Fitness', description: 'Physical training and exercise', icon: 'Dumbbell', color: 'red', decay_grace_days: 3, decay_rate: 0.5, stats: { Strength: 1.5, Endurance: 1.5 } },
  { name: 'Learning', description: 'Studying, courses, and skill-building', icon: 'BookOpen', color: 'blue', decay_grace_days: 5, decay_rate: 0.25, stats: { Intelligence: 1.5, Focus: 1 } },
  { name: 'Work', description: 'Professional and career tasks', icon: 'Briefcase', color: 'amber', decay_grace_days: 5, decay_rate: 0.25, stats: { Discipline: 1, Focus: 1 } },
  { name: 'Personal', description: 'Personal errands and self-care', icon: 'User', color: 'purple', decay_grace_days: 7, decay_rate: 0.1, stats: { Consistency: 1 } },
  { name: 'Health', description: 'Sleep, nutrition, and wellbeing', icon: 'HeartPulse', color: 'emerald', decay_grace_days: 4, decay_rate: 0.3, stats: { Endurance: 1, Discipline: 1 } },
];

const ACHIEVEMENTS = [
  { key: 'first_step', name: 'First Step', description: 'Complete your first task.', icon: 'Footprints', requirement_type: 'first_task_completed', requirement_value: 1 },
  { key: 'consistent', name: 'Consistent', description: 'Complete tasks 7 days in a row.', icon: 'CalendarCheck', requirement_type: 'streak_days', requirement_value: 7 },
  { key: 'dedicated', name: 'Dedicated', description: 'Maintain a 30-day streak.', icon: 'Flame', requirement_type: 'streak_days', requirement_value: 30 },
  { key: 'level_10', name: 'Level Up', description: 'Reach level 10.', icon: 'ArrowUpCircle', requirement_type: 'level_reached', requirement_value: 10 },
  { key: 'specialist', name: 'Specialist', description: 'Earn 1,000 XP in one category.', icon: 'Star', requirement_type: 'category_xp', requirement_value: 1000 },
  { key: 'comeback', name: 'Comeback', description: 'Return to a neglected category after decay.', icon: 'RotateCcw', requirement_type: 'comeback', requirement_value: 1 },
  { key: 'benchmark_breaker', name: 'Benchmark Breaker', description: 'Beat a previous personal best.', icon: 'Trophy', requirement_type: 'benchmark_beaten', requirement_value: 1 },
];

exports.seed = async function seed(knex) {
  await knex('daily_summaries').del();
  await knex('decay_events').del();
  await knex('streaks').del();
  await knex('user_achievements').del();
  await knex('achievements').del();
  await knex('user_progression').del();
  await knex('stat_history').del();
  await knex('benchmarks').del();
  await knex('activity_metrics').del();
  await knex('activities').del();
  await knex('task_completions').del();
  await knex('tasks').del();
  await knex('category_stats').del();
  await knex('stats').del();
  await knex('categories').del();
  await knex('users').del();

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 12);
  const [user] = await knex('users')
    .insert({
      username: SEED_USERNAME,
      email: SEED_EMAIL,
      password_hash: passwordHash,
      timezone: DEFAULT_TIMEZONE,
    })
    .returning('*');

  await knex('user_progression').insert({ user_id: user.id, level: 1, total_xp: 0, current_xp: 0 });

  await knex('stats').insert(STATS.map((stat_name) => ({ user_id: user.id, stat_name, value: 10 })));

  const categoryRows = await knex('categories')
    .insert(
      CATEGORIES.map((c) => ({
        user_id: user.id,
        name: c.name,
        description: c.description,
        icon: c.icon,
        color: c.color,
        decay_grace_days: c.decay_grace_days,
        decay_rate: c.decay_rate,
      }))
    )
    .returning('*');

  const categoryStatRows = [];
  categoryRows.forEach((row) => {
    const def = CATEGORIES.find((c) => c.name === row.name);
    Object.entries(def.stats).forEach(([stat_name, weight]) => {
      categoryStatRows.push({ category_id: row.id, stat_name, weight });
    });
  });
  await knex('category_stats').insert(categoryStatRows);

  await knex('achievements').insert(ACHIEVEMENTS);

  const fitness = categoryRows.find((c) => c.name === 'Fitness');
  const learning = categoryRows.find((c) => c.name === 'Learning');
  const personal = categoryRows.find((c) => c.name === 'Personal');

  const today = new Date().toISOString().slice(0, 10);

  await knex('tasks').insert([
    {
      user_id: user.id,
      category_id: learning.id,
      title: 'Study programming',
      description: 'Focused study session',
      weight: 30,
      difficulty: 'hard',
      task_type: 'standard',
      scheduled_date: today,
      recurrence_type: 'daily',
    },
    {
      user_id: user.id,
      category_id: fitness.id,
      title: 'Gym session',
      description: 'Strength training',
      weight: 25,
      difficulty: 'normal',
      task_type: 'performance',
      scheduled_date: today,
      recurrence_type: 'none',
    },
    {
      user_id: user.id,
      category_id: learning.id,
      title: 'Read 20 pages',
      weight: 10,
      difficulty: 'easy',
      task_type: 'recurring',
      scheduled_date: today,
      recurrence_type: 'daily',
    },
    {
      user_id: user.id,
      category_id: personal.id,
      title: 'Clean room',
      weight: 5,
      difficulty: 'trivial',
      task_type: 'standard',
      scheduled_date: today,
      recurrence_type: 'none',
    },
    {
      user_id: user.id,
      category_id: fitness.id,
      title: 'Football',
      weight: 20,
      difficulty: 'normal',
      task_type: 'performance',
      scheduled_date: today,
      recurrence_type: 'none',
    },
  ]);

  console.log(`Seeded user "${SEED_USERNAME}" (${SEED_EMAIL}) with password from SEED_PASSWORD env var.`);
};
