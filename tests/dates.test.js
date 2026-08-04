const { getTodayStr, getTomorrowStr, getColombiaHour } = require('../src/utils/dates');

describe('Date Helper Utilities', () => {
  test('getTodayStr returns YYYY-MM-DD date string', () => {
    const today = getTodayStr();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('getTomorrowStr returns next day date string', () => {
    const tomorrow = getTomorrowStr();
    expect(tomorrow).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('getColombiaHour returns a number between 0 and 23', () => {
    const hour = getColombiaHour();
    expect(typeof hour).toBe('number');
    expect(hour).toBeGreaterThanOrEqual(0);
    expect(hour).toBeLessThanOrEqual(23);
  });
});
