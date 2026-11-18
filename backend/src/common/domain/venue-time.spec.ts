import { venueTime } from './venue-time.js';
it('converts Brasília wall time independently of the server timezone', () => {
  expect(venueTime('2035-11-18', '10:00:00').toISOString()).toBe(
    '2035-11-18T13:00:00.000Z',
  );
  expect(venueTime('2035-11-18', '23:00:00').toISOString()).toBe(
    '2035-11-19T02:00:00.000Z',
  );
});
