const { daysBetween, addDays } = require('../utils/dateUtils');

/**
 * Which calendar dates still need a missed-task sweep, given the last date
 * already checked. Never includes today (a task isn't "missed" until its
 * whole day has passed), and caps how many days get processed in one call so
 * a long-absent user doesn't trigger a huge backlog scan on their next visit -
 * the cap just means catch-up continues on the next load instead.
 *
 * Returns null when there's nothing new to process.
 */
function getDateRangeToProcess(lastCheck, today, maxDays) {
  if (!lastCheck) return null; // first run bootstraps lastCheck instead of backfilling blind

  const startDate = addDays(lastCheck, 1);
  const endDate = addDays(today, -1);
  if (daysBetween(startDate, endDate) < 0) return null; // already caught up

  const cappedEnd = daysBetween(startDate, endDate) + 1 > maxDays ? addDays(startDate, maxDays - 1) : endDate;
  return { startDate, endDate: cappedEnd };
}

/**
 * Whether a missed task should actually cost a stat, given when that stat was
 * last positively worked on (by any task feeding it, not just the missed one).
 * No prior activity at all is treated as eligible - there's nothing to protect.
 */
function shouldPenalize(lastWorkedDate, missedDate, graceDays) {
  if (!lastWorkedDate) return true;
  return daysBetween(lastWorkedDate, missedDate) >= graceDays;
}

module.exports = { getDateRangeToProcess, shouldPenalize };
