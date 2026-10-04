/**
 * Central configuration for every progression/gamification rule in the app.
 * Nothing outside this file should hardcode an XP, level, decay, or streak formula -
 * services read these constants/functions so the rules stay in one place.
 */

const DIFFICULTY_MULTIPLIERS = {
  trivial: 0.5,
  easy: 0.75,
  normal: 1,
  hard: 1.5,
  epic: 2,
};

const BASE_XP = 10;

// XP = round(BASE_XP + (weight * WEIGHT_XP_FACTOR)) * difficultyMultiplier
//      + performanceBonus + streakBonus
const WEIGHT_XP_FACTOR = 1.2;

// Streak bonus: +STREAK_BONUS_PER_DAY XP per current streak day, capped at STREAK_BONUS_CAP
const STREAK_BONUS_PER_DAY = 2;
const STREAK_BONUS_CAP = 40;

// Performance improvement bonus: percentage improvement * PERFORMANCE_XP_FACTOR, capped
const PERFORMANCE_XP_FACTOR = 3;
const PERFORMANCE_XP_CAP = 60;

/**
 * Level thresholds: the XP *range width* required to clear level n grows linearly.
 * Level 1 requires LEVEL_BASE_XP total XP, each subsequent level requires
 * LEVEL_STEP_XP more than the previous one's requirement.
 * Matches the spec example: L1 0-999 (1000), L2 1000-2199 (1200), L3 2200-3599 (1400)...
 */
const LEVEL_BASE_XP = 1000;
const LEVEL_STEP_XP = 200;

function xpRequiredForLevel(level) {
  // XP needed to go from level `level` to level `level + 1`
  return LEVEL_BASE_XP + (level - 1) * LEVEL_STEP_XP;
}

function getLevelProgress(totalXp) {
  let level = 1;
  let xpConsumed = 0;
  let requirement = xpRequiredForLevel(level);

  while (totalXp - xpConsumed >= requirement) {
    xpConsumed += requirement;
    level += 1;
    requirement = xpRequiredForLevel(level);
  }

  return {
    level,
    currentXp: totalXp - xpConsumed,
    xpForNextLevel: requirement,
    totalXp,
  };
}

/**
 * Stat gain per completed task, before scaling. Each category can weight multiple
 * stats (see category_stats table); this is the "points per weight unit" applied
 * on top of that per-stat weight.
 */
const STAT_GAIN_BASE = 0.4; // stat points per 10 weight, before difficulty scaling
const STAT_GAIN_DIFFICULTY_MULTIPLIER = DIFFICULTY_MULTIPLIERS;

/**
 * Decay defaults applied to a category when it has no decay_grace_days /
 * decay_rate override set. Grace period is in whole days of inactivity before
 * decay starts; rate is stat points lost per stat per day beyond the grace period.
 */
const DEFAULT_DECAY_GRACE_DAYS = 4;
const DEFAULT_DECAY_RATE_PER_DAY = 0.5;
const DECAY_MAX_PER_RUN = 10; // safety cap: never apply more than this many days of decay in one pass

/**
 * A day counts as "qualifying" for a category streak if at least one task in
 * that category was completed on that date.
 */
const STREAK_GRACE_DAYS = 0; // 0 = a missed day breaks the streak immediately

const COMEBACK_BONUS_XP = 25; // awarded once when returning to a category after it had decayed

/**
 * Penalty for a task that goes unfinished through its whole scheduled day -
 * distinct from category decay (which fires from total category inactivity).
 * Only applies once a stat has gone MISSED_TASK_GRACE_DAYS with no positive
 * contribution from ANY task feeding it, so one occasional miss while the
 * stat is otherwise being actively worked never costs anything - it only
 * bites during a genuine multi-day lapse, same spirit as decay's grace period.
 */
const MISSED_TASK_PENALTY_FACTOR = 0.5; // fraction of the stat's would-be gain lost
const MISSED_TASK_GRACE_DAYS = 2;
const MISSED_TASK_MAX_DAYS_PER_RUN = 14; // safety cap, mirrors DECAY_MAX_PER_RUN

const ACHIEVEMENT_REQUIREMENT_TYPES = {
  FIRST_TASK_COMPLETED: 'first_task_completed',
  STREAK_DAYS: 'streak_days',
  LEVEL_REACHED: 'level_reached',
  CATEGORY_XP: 'category_xp',
  COMEBACK: 'comeback',
  BENCHMARK_BEATEN: 'benchmark_beaten',
};

function calculateTaskXP(task, context = {}) {
  const { difficulty = 'normal', weight = 0 } = task;
  const multiplier = DIFFICULTY_MULTIPLIERS[difficulty] ?? 1;
  const weightComponent = weight * WEIGHT_XP_FACTOR;
  let xp = (BASE_XP + weightComponent) * multiplier;

  if (task.xp_reward != null) {
    // Explicit override still benefits from streak/performance bonuses below
    xp = Number(task.xp_reward);
  }

  const streakDays = context.streakDays || 0;
  xp += Math.min(streakDays * STREAK_BONUS_PER_DAY, STREAK_BONUS_CAP);

  if (typeof context.performanceImprovementPct === 'number' && context.performanceImprovementPct > 0) {
    xp += Math.min(context.performanceImprovementPct * PERFORMANCE_XP_FACTOR, PERFORMANCE_XP_CAP);
  }

  return Math.max(0, Math.round(xp));
}

function calculateStatGain(weight, difficulty, statWeight) {
  const multiplier = STAT_GAIN_DIFFICULTY_MULTIPLIER[difficulty] ?? 1;
  const gain = (weight / 10) * STAT_GAIN_BASE * multiplier * statWeight;
  return Math.round(gain * 100) / 100;
}

function comparePerformance(current, previous, direction = 'higher_better') {
  if (previous == null || previous === 0) {
    // Nothing to compare against yet - treated as a personal best for display/
    // stat-bonus purposes, but callers awarding a "beat your PB" achievement
    // must check hasPrevious too: there's nothing genuinely beaten here.
    return { improvementPct: 0, isPersonalBest: true, hasPrevious: false, direction };
  }
  const rawDelta = direction === 'lower_better' ? previous - current : current - previous;
  const improvementPct = (rawDelta / Math.abs(previous)) * 100;
  return {
    improvementPct: Math.round(improvementPct * 100) / 100,
    isPersonalBest: rawDelta > 0,
    hasPrevious: true,
    direction,
  };
}

module.exports = {
  DIFFICULTY_MULTIPLIERS,
  BASE_XP,
  WEIGHT_XP_FACTOR,
  STREAK_BONUS_PER_DAY,
  STREAK_BONUS_CAP,
  PERFORMANCE_XP_FACTOR,
  PERFORMANCE_XP_CAP,
  LEVEL_BASE_XP,
  LEVEL_STEP_XP,
  STAT_GAIN_BASE,
  DEFAULT_DECAY_GRACE_DAYS,
  DEFAULT_DECAY_RATE_PER_DAY,
  DECAY_MAX_PER_RUN,
  STREAK_GRACE_DAYS,
  COMEBACK_BONUS_XP,
  MISSED_TASK_PENALTY_FACTOR,
  MISSED_TASK_GRACE_DAYS,
  MISSED_TASK_MAX_DAYS_PER_RUN,
  ACHIEVEMENT_REQUIREMENT_TYPES,
  xpRequiredForLevel,
  getLevelProgress,
  calculateTaskXP,
  calculateStatGain,
  comparePerformance,
};
