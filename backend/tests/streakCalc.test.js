const { calcStreak } = require('../src/services/streakCalc');

describe('calcStreak', () => {
  test('no qualifying days at all', () => {
    expect(calcStreak([], '2026-01-10')).toEqual({ currentStreak: 0, longestStreak: 0, lastActivityDate: null });
  });

  test('first day ever (today) starts a streak of 1', () => {
    const result = calcStreak(['2026-01-10'], '2026-01-10');
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(1);
  });

  test('consecutive days build the streak', () => {
    const dates = ['2026-01-10', '2026-01-09', '2026-01-08', '2026-01-07'];
    const result = calcStreak(dates, '2026-01-10');
    expect(result.currentStreak).toBe(4);
    expect(result.longestStreak).toBe(4);
  });

  test('a missed day breaks the current streak but preserves the longest one', () => {
    // Active Jan 1-5 (streak of 5), then nothing until Jan 10 (today) - no activity yesterday either.
    const dates = ['2026-01-05', '2026-01-04', '2026-01-03', '2026-01-02', '2026-01-01'];
    const result = calcStreak(dates, '2026-01-10');
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(5);
  });

  test('activity yesterday still counts toward the current streak even if none today yet', () => {
    const dates = ['2026-01-09', '2026-01-08'];
    const result = calcStreak(dates, '2026-01-10');
    expect(result.currentStreak).toBe(2);
  });

  test('category-specific streak only looks at that category\'s qualifying dates', () => {
    // Simulates: Learning done today+yesterday, Fitness only 3 days ago - each streak computed independently.
    const learningDates = ['2026-01-10', '2026-01-09'];
    const fitnessDates = ['2026-01-07'];
    expect(calcStreak(learningDates, '2026-01-10').currentStreak).toBe(2);
    expect(calcStreak(fitnessDates, '2026-01-10').currentStreak).toBe(0);
  });

  test('duplicate dates do not inflate the streak', () => {
    const result = calcStreak(['2026-01-10', '2026-01-10', '2026-01-09'], '2026-01-10');
    expect(result.currentStreak).toBe(2);
  });
});
