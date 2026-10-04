const { getDateRangeToProcess, shouldPenalize } = require('../src/services/missedTaskCalc');

describe('getDateRangeToProcess', () => {
  test('no prior check yet returns null (bootstrap handled by the caller)', () => {
    expect(getDateRangeToProcess(null, '2026-10-10', 14)).toBeNull();
  });

  test('already caught up (checked through yesterday) returns null', () => {
    expect(getDateRangeToProcess('2026-10-09', '2026-10-10', 14)).toBeNull();
  });

  test('one day behind processes just yesterday', () => {
    const result = getDateRangeToProcess('2026-10-08', '2026-10-10', 14);
    expect(result).toEqual({ startDate: '2026-10-09', endDate: '2026-10-09' });
  });

  test('never processes today itself, only up to yesterday', () => {
    const result = getDateRangeToProcess('2026-10-06', '2026-10-09', 14);
    expect(result.endDate).toBe('2026-10-08');
  });

  test('a long absence is capped rather than backfilling everything at once', () => {
    const result = getDateRangeToProcess('2026-09-01', '2026-10-10', 14);
    expect(result.startDate).toBe('2026-09-02');
    // 14 days starting from startDate
    expect(result.endDate).toBe('2026-09-15');
  });
});

describe('shouldPenalize', () => {
  test('a stat that has never been worked on is always eligible', () => {
    expect(shouldPenalize(null, '2026-10-10', 2)).toBe(true);
  });

  test('worked on yesterday (within the grace window) is protected', () => {
    expect(shouldPenalize('2026-10-09', '2026-10-10', 2)).toBe(false);
  });

  test('worked on the same day as the miss is protected', () => {
    expect(shouldPenalize('2026-10-10', '2026-10-10', 2)).toBe(false);
  });

  test('exactly at the grace boundary becomes eligible', () => {
    // last worked 2 days before the missed date
    expect(shouldPenalize('2026-10-08', '2026-10-10', 2)).toBe(true);
  });

  test('well past the grace window is eligible', () => {
    expect(shouldPenalize('2026-09-01', '2026-10-10', 2)).toBe(true);
  });
});
