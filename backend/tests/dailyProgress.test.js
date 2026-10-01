const { computeProgress } = require('../src/services/dailySummaryService');

describe('computeProgress (weighted daily completion)', () => {
  test('no tasks scheduled -> 0%', () => {
    expect(computeProgress([])).toBe(0);
  });

  test('one task, completed -> 100%', () => {
    expect(computeProgress([{ weight: 20, completed: true }])).toBe(100);
  });

  test('one task, not completed -> 0%', () => {
    expect(computeProgress([{ weight: 20, completed: false }])).toBe(0);
  });

  test('matches the spec example: weighted partial completion', () => {
    // Programming 30 (done), Gym 20, Reading 10 (done), Cleaning 5 -> 40/65 = 61.54%
    const tasks = [
      { weight: 30, completed: true },
      { weight: 20, completed: false },
      { weight: 10, completed: true },
      { weight: 5, completed: false },
    ];
    expect(computeProgress(tasks)).toBeCloseTo(61.54, 1);
  });

  test('all tasks completed -> 100% regardless of weight distribution', () => {
    const tasks = [
      { weight: 50, completed: true },
      { weight: 30, completed: true },
      { weight: 20, completed: true },
    ];
    expect(computeProgress(tasks)).toBe(100);
  });

  test('progress is capped at 100% even if weights are unusual', () => {
    const tasks = [{ weight: 100, completed: true }];
    expect(computeProgress(tasks)).toBeLessThanOrEqual(100);
  });
});
