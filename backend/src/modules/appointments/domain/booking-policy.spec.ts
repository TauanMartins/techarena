import { assertCalendarDate, assertFutureSlot } from './booking-policy.js';
it('rejects rolled-over dates and slots that already started', () => {
  expect(() => assertCalendarDate('2026-02-30')).toThrow();
  expect(() => assertCalendarDate('2028-02-29')).not.toThrow();
  const now = new Date('2026-10-28T12:00:00Z');
  expect(() => assertFutureSlot(now, now)).toThrow();
  expect(() =>
    assertFutureSlot(new Date('2026-10-28T12:00:01Z'), now),
  ).not.toThrow();
});
