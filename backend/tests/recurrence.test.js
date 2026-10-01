const { matchesRecurrence } = require('../src/services/recurrence');

describe('matchesRecurrence', () => {
  test('a one-off task only matches its own scheduled date', () => {
    const task = { scheduled_date: '2026-10-01', recurrence_type: 'none', recurrence_config: null };
    expect(matchesRecurrence(task, '2026-10-01')).toBe(true);
    expect(matchesRecurrence(task, '2026-10-02')).toBe(false);
  });

  test('a daily task matches every date from its anchor onward, with no end date', () => {
    const task = { scheduled_date: '2026-10-01', recurrence_type: 'daily', recurrence_config: null };
    expect(matchesRecurrence(task, '2026-10-01')).toBe(true);
    expect(matchesRecurrence(task, '2027-01-01')).toBe(true);
    expect(matchesRecurrence(task, '2026-09-30')).toBe(false); // before the anchor
  });

  test('a daily task "for 2 weeks" stops matching after its end date', () => {
    const task = {
      scheduled_date: '2026-10-01',
      recurrence_type: 'daily',
      recurrence_config: { endDate: '2026-10-14' },
    };
    expect(matchesRecurrence(task, '2026-10-01')).toBe(true);
    expect(matchesRecurrence(task, '2026-10-14')).toBe(true); // end date itself is inclusive
    expect(matchesRecurrence(task, '2026-10-15')).toBe(false);
  });

  test('a weekly task on specific days still respects an end date', () => {
    const task = {
      scheduled_date: '2026-10-01', // a Thursday
      recurrence_type: 'weekly',
      recurrence_config: { daysOfWeek: [1, 3], endDate: '2026-10-20' }, // Mon/Wed
    };
    expect(matchesRecurrence(task, '2026-10-05')).toBe(true); // Monday, within range
    expect(matchesRecurrence(task, '2026-10-06')).toBe(false); // Tuesday - wrong day
    expect(matchesRecurrence(task, '2026-10-26')).toBe(false); // Monday, but past end date
  });
});
