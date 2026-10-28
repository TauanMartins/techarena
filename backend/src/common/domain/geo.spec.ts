import { assertGeo } from './geo.js';
it('accepts coordinates at zero and rejects incomplete or invalid locations', () => {
  expect(() => assertGeo({ lat: 0, longitude: 0, radiusKm: 1 })).not.toThrow();
  for (const query of [
    { lat: 0 },
    { longitude: 0 },
    { lat: 91, longitude: 0 },
    { lat: 0, longitude: 181 },
    { radiusKm: 1 },
  ])
    expect(() => assertGeo(query)).toThrow();
});
