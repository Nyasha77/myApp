const {
  getLevelProgress,
  calculateTaskXP,
  calculateStatGain,
  comparePerformance,
  xpRequiredForLevel,
} = require('../src/config/gameConfig');

describe('getLevelProgress', () => {
  test('0 XP is level 1 with 0 current XP', () => {
    expect(getLevelProgress(0)).toEqual({ level: 1, currentXp: 0, xpForNextLevel: 1000, totalXp: 0 });
  });

  test('999 XP is still level 1, just under the threshold', () => {
    const result = getLevelProgress(999);
    expect(result.level).toBe(1);
    expect(result.currentXp).toBe(999);
  });

  test('1000 XP rolls over into level 2', () => {
    const result = getLevelProgress(1000);
    expect(result.level).toBe(2);
    expect(result.currentXp).toBe(0);
    expect(result.xpForNextLevel).toBe(xpRequiredForLevel(2));
  });

  test('matches the widening spec example (L1 1000, L2 1200, L3 1400)', () => {
    // 1000 (L1) + 1200 (L2) = 2200 -> start of level 3
    const result = getLevelProgress(2200);
    expect(result.level).toBe(3);
    expect(result.currentXp).toBe(0);
  });
});

describe('calculateTaskXP', () => {
  test('higher weight yields more XP at the same difficulty', () => {
    const low = calculateTaskXP({ weight: 5, difficulty: 'normal' });
    const high = calculateTaskXP({ weight: 30, difficulty: 'normal' });
    expect(high).toBeGreaterThan(low);
  });

  test('harder difficulty yields more XP for the same weight', () => {
    const easy = calculateTaskXP({ weight: 20, difficulty: 'easy' });
    const hard = calculateTaskXP({ weight: 20, difficulty: 'hard' });
    expect(hard).toBeGreaterThan(easy);
  });

  test('explicit xp_reward overrides the formula but still gets streak bonus', () => {
    const withoutStreak = calculateTaskXP({ weight: 20, difficulty: 'normal', xp_reward: 50 }, {});
    const withStreak = calculateTaskXP({ weight: 20, difficulty: 'normal', xp_reward: 50 }, { streakDays: 5 });
    expect(withoutStreak).toBe(50);
    expect(withStreak).toBeGreaterThan(withoutStreak);
  });

  test('streak bonus is capped', () => {
    const capped = calculateTaskXP({ weight: 10, difficulty: 'normal', xp_reward: 10 }, { streakDays: 1000 });
    const atCap = calculateTaskXP({ weight: 10, difficulty: 'normal', xp_reward: 10 }, { streakDays: 20 });
    expect(capped).toBe(atCap);
  });

  test('performance improvement adds a bonus', () => {
    const noBonus = calculateTaskXP({ weight: 10, difficulty: 'normal', xp_reward: 10 }, {});
    const withBonus = calculateTaskXP({ weight: 10, difficulty: 'normal', xp_reward: 10 }, { performanceImprovementPct: 10 });
    expect(withBonus).toBeGreaterThan(noBonus);
  });
});

describe('calculateStatGain', () => {
  test('scales with weight, difficulty, and category-stat weight', () => {
    const base = calculateStatGain(10, 'normal', 1);
    const heavier = calculateStatGain(30, 'normal', 1);
    const harder = calculateStatGain(10, 'hard', 1);
    const moreWeighted = calculateStatGain(10, 'normal', 2);
    expect(heavier).toBeGreaterThan(base);
    expect(harder).toBeGreaterThan(base);
    expect(moreWeighted).toBeGreaterThan(base);
  });
});

describe('comparePerformance', () => {
  test('first-ever result (no previous) is treated as a personal best with 0% improvement, but flagged as having nothing to beat', () => {
    expect(comparePerformance(80, null)).toEqual({
      improvementPct: 0,
      isPersonalBest: true,
      hasPrevious: false,
      direction: 'higher_better',
    });
  });

  test('higher_better: an increase is an improvement, with a genuine previous result to beat', () => {
    const result = comparePerformance(80, 75, 'higher_better');
    expect(result.isPersonalBest).toBe(true);
    expect(result.hasPrevious).toBe(true);
    expect(result.improvementPct).toBeCloseTo(6.67, 1);
  });

  test('higher_better: a decrease is a decline, not a personal best', () => {
    const result = comparePerformance(70, 75, 'higher_better');
    expect(result.isPersonalBest).toBe(false);
    expect(result.improvementPct).toBeLessThan(0);
  });

  test('lower_better: a faster (smaller) time is an improvement', () => {
    const result = comparePerformance(23, 25, 'lower_better'); // e.g. minutes for a 5k
    expect(result.isPersonalBest).toBe(true);
    expect(result.improvementPct).toBeGreaterThan(0);
  });

  test('an unchanged result is neither an improvement nor a personal best', () => {
    const result = comparePerformance(80, 80, 'higher_better');
    expect(result.improvementPct).toBe(0);
    expect(result.isPersonalBest).toBe(false);
  });
});
