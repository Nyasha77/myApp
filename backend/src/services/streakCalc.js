const { daysBetween } = require('../utils/dateUtils');

/**
 * Pure computation of current/longest streak from a list of qualifying dates
 * (YYYY-MM-DD, any order) and "today". Extracted from streakService so the
 * rules can be unit tested without a database.
 */
function calcStreak(dates, today) {
  const sorted = [...new Set(dates)].sort((a, b) => (a < b ? 1 : -1)); // desc, deduped

  if (sorted.length === 0) {
    return { currentStreak: 0, longestStreak: 0, lastActivityDate: null };
  }

  let longestStreak = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i += 1) {
    run = daysBetween(sorted[i], sorted[i - 1]) === 1 ? run + 1 : 1;
    longestStreak = Math.max(longestStreak, run);
  }

  let currentStreak = 0;
  if (daysBetween(sorted[0], today) <= 1) {
    currentStreak = 1;
    for (let i = 1; i < sorted.length; i += 1) {
      if (daysBetween(sorted[i], sorted[i - 1]) === 1) currentStreak += 1;
      else break;
    }
  }

  return { currentStreak, longestStreak, lastActivityDate: sorted[0] };
}

module.exports = { calcStreak };
