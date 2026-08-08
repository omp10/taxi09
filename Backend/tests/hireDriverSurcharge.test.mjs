import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Exercise the surcharge normalizer through the module's own source so the
// catalogue and the test can't drift apart.
// Resolved against this file, not the working directory, so the suite passes
// wherever it is run from.
const src = readFileSync(
  fileURLToPath(new URL('../src/modules/taxi/services/rideService.js', import.meta.url)),
  'utf8',
);
const start = src.indexOf('const HIRE_DRIVER_JOURNEY_OPTIONS');
const end = src.indexOf('const ensureUserWallet');
const { normalizeHireDriver } = await import(
  'data:text/javascript,' + encodeURIComponent(src.slice(start, end) + '\nexport { normalizeHireDriver };')
);

// map form (what the booking screen holds)
let r = normalizeHireDriver({ journeyOptions: { night: true, hill: false, luggage: true }, hireType: 'Local (Hourly)' });
assert.equal(r.surchargeTotal, 650, 'night 500 + luggage 150');
assert.equal(r.journeyOptions.length, 2);

// array form
r = normalizeHireDriver({ journeyOptions: ['hill', 'stops'] });
assert.equal(r.surchargeTotal, 550);

// unknown keys are dropped, not trusted
r = normalizeHireDriver({ journeyOptions: ['night', 'free_ferrari', '__proto__'] });
assert.equal(r.surchargeTotal, 500);
assert.deepEqual(r.journeyOptions.map(o => o.key), ['night']);

// a client-supplied price is ignored entirely
r = normalizeHireDriver({ journeyOptions: [{ key: 'night', price: 1 }] });
assert.equal(r.surchargeTotal, 0, 'objects are not valid keys');

assert.equal(normalizeHireDriver(null), null);
assert.equal(normalizeHireDriver({}).surchargeTotal, 0);

console.log('hire-driver surcharge pricing: all assertions passed');
