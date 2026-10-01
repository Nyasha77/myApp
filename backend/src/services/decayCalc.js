const { daysBetween, addDays } = require('../utils/dateUtils');

/**
 * Pure decay-window computation, extracted from decayService for unit testing.
 * Given when a category was last active, its grace period/rate, when it was last
 * checked for decay, and today's date, returns how many decay-days should be
 * applied now (0 if still within the grace period or already up to date).
 */
function calcDecayDays(lastActivityDate, graceDays, lastDecayCheck, today, maxPerRun) {
  const decayStartsOn = addDays(lastActivityDate, graceDays + 1);
  if (daysBetween(decayStartsOn, today) < 0) {
    return { daysToApply: 0, totalDaysInactive: daysBetween(lastActivityDate, today) };
  }

  const checkFrom = lastDecayCheck && daysBetween(lastDecayCheck, decayStartsOn) < 0 ? addDays(lastDecayCheck, 1) : decayStartsOn;

  const daysToApply = Math.max(0, Math.min(daysBetween(checkFrom, today) + 1, maxPerRun));
  const totalDaysInactive = daysBetween(lastActivityDate, today);

  return { daysToApply, totalDaysInactive };
}

module.exports = { calcDecayDays };
