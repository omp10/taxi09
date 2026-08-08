import assert from 'node:assert/strict';
import { priceHireDriverTrip } from '../src/modules/taxi/user/services/hireDriverPricingService.js';

// Mirrors a real Set Prices row (Sedan: base ₹699 covering 3 km, ₹15/km, ₹1.5/min).
const fare = {
  id: 'sedan', name: 'Sedan', capacity: 4,
  basePrice: 699, baseDistance: 3, pricePerDistance: 15, timePrice: 1.5, serviceTaxPercent: 5,
};

let q = priceHireDriverTrip({ fare, distanceKm: 55, durationMinutes: 80 });
assert.equal(q.chargeableKm, 52, 'base fare covers the first 3 km');
assert.equal(q.distanceFare, 780);
assert.equal(q.timeFare, 120);
assert.equal(q.subtotal, 1599);
assert.equal(q.taxes, 79.95, '5% of subtotal');
assert.equal(q.totalFare, 1678.95);

// A trip inside the base distance is never charged negative distance
q = priceHireDriverTrip({ fare, distanceKm: 2, durationMinutes: 0 });
assert.equal(q.chargeableKm, 0);
assert.equal(q.distanceFare, 0);
assert.equal(q.totalFare, 733.95);

// Missing distance/duration degrade to the base fare, not NaN
q = priceHireDriverTrip({ fare });
assert.equal(q.totalFare, 733.95);

// Negative inputs are clamped rather than trusted
q = priceHireDriverTrip({ fare, distanceKm: -100, durationMinutes: -50 });
assert.equal(q.distanceFare, 0);
assert.equal(q.timeFare, 0);

// No tax configured means no tax line
q = priceHireDriverTrip({ fare: { ...fare, serviceTaxPercent: 0 }, distanceKm: 55, durationMinutes: 80 });
assert.equal(q.taxes, 0);
assert.equal(q.totalFare, 1599);

assert.throws(() => priceHireDriverTrip({ fare: null }), /not available/i);

console.log('hire-driver fare pricing: all assertions passed');
