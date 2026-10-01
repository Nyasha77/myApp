const { calcDecayDays } = require('../src/services/decayCalc');

describe('calcDecayDays', () => {
  test('within the grace period: no decay', () => {
    // 3 days inactive, grace period 3 -> still safe
    const result = calcDecayDays('2026-01-07', 3, null, '2026-01-10', 10);
    expect(result.daysToApply).toBe(0);
  });

  test('first day past the grace period applies exactly one decay-day', () => {
    // grace 3, last active Jan 7 -> decay starts Jan 11, today Jan 11 -> 1 day
    const result = calcDecayDays('2026-01-07', 3, null, '2026-01-11', 10);
    expect(result.daysToApply).toBe(1);
    expect(result.totalDaysInactive).toBe(4);
  });

  test('multiple inactive days beyond grace accumulate, capped at maxPerRun', () => {
    const result = calcDecayDays('2026-01-01', 3, null, '2026-01-20', 10);
    expect(result.daysToApply).toBe(10); // capped
  });

  test('a previous decay check is not re-applied - only new days count', () => {
    // Already decayed through Jan 12; today is Jan 15 -> 3 new days
    const result = calcDecayDays('2026-01-01', 3, '2026-01-12', '2026-01-15', 10);
    expect(result.daysToApply).toBe(3);
  });

  test('activity resetting the clock: a fresh last_activity_date with no elapsed grace period yields no decay', () => {
    const result = calcDecayDays('2026-01-15', 3, '2026-01-10', '2026-01-15', 10);
    expect(result.daysToApply).toBe(0);
  });

  test('calling again on the same day after decay was just applied yields no further decay', () => {
    const result = calcDecayDays('2026-01-01', 3, '2026-01-15', '2026-01-15', 10);
    expect(result.daysToApply).toBe(0);
  });
});
