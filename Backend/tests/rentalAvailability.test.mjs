import assert from 'node:assert/strict';
import { windowsOverlap } from '../src/modules/taxi/user/services/rentalAvailabilityService.js';

const D = (s) => new Date(s);
const req = [D('2026-06-10T10:00'), D('2026-06-12T10:00')];
const overlaps = (s, e) => windowsOverlap(D(s), D(e), req[0], req[1]);

// Clashes
assert.equal(overlaps('2026-06-09T10:00', '2026-06-11T10:00'), true, 'starts before, ends inside');
assert.equal(overlaps('2026-06-11T10:00', '2026-06-13T10:00'), true, 'starts inside, ends after');
assert.equal(overlaps('2026-06-09T10:00', '2026-06-13T10:00'), true, 'fully contains the request');
assert.equal(overlaps('2026-06-10T12:00', '2026-06-11T12:00'), true, 'sits fully inside');
assert.equal(overlaps('2026-06-10T10:00', '2026-06-12T10:00'), true, 'identical window');

// No clash
assert.equal(overlaps('2026-06-05T10:00', '2026-06-09T10:00'), false, 'entirely before');
assert.equal(overlaps('2026-06-13T10:00', '2026-06-15T10:00'), false, 'entirely after');

// Touching windows must NOT clash - a car returned at 10:00 can go out at 10:00
assert.equal(overlaps('2026-06-08T10:00', '2026-06-10T10:00'), false, 'ends exactly at pickup');
assert.equal(overlaps('2026-06-12T10:00', '2026-06-14T10:00'), false, 'starts exactly at return');

// A one-minute gap either side is still free
assert.equal(overlaps('2026-06-08T10:00', '2026-06-10T09:59'), false);
assert.equal(overlaps('2026-06-12T10:01', '2026-06-14T10:00'), false);
// A one-minute encroachment clashes
assert.equal(overlaps('2026-06-08T10:00', '2026-06-10T10:01'), true);

console.log('rental availability: all assertions passed');
