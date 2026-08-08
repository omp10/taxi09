import assert from 'node:assert/strict';
import { priceRentalBooking } from '../src/modules/taxi/user/services/rentalPricingService.js';

const vehicle = {
  pricing: [
    { id: 'p24', label: '24 Hours', durationHours: 24, price: 5832, includedKm: 120, extraKmPrice: 9, extraHourPrice: 200, active: true },
    { id: 'gone', label: 'Retired', price: 999, active: false },
  ],
  addOns: [
    { id: 'child', label: 'Child Seat', price: 150, originalPrice: 400, active: true },
    { id: 'driver', label: 'Driver Needed', price: 1200, active: true },
    { id: 'bogus', label: 'Bogus Discount', price: 200, originalPrice: 100, active: true },
    { id: 'retired', label: 'Retired Extra', price: 5000, active: false },
  ],
  advancePayment: { enabled: true, paymentMode: 'percentage', amount: 20, label: 'Advance booking payment' },
};

// Base case
let q = priceRentalBooking({ vehicle, packageId: 'p24' });
assert.equal(q.totalCost, 5832);
assert.equal(q.payableNow, 1166.4);
assert.equal(q.balanceDue, 4665.6);

// Add-ons roll into the total
q = priceRentalBooking({ vehicle, packageId: 'p24', addOns: ['child', 'driver'] });
assert.equal(q.addOnsTotal, 1350);
assert.equal(q.totalCost, 7182);
assert.equal(q.payableNow, 1436.4);

// Unknown, inactive and duplicate ids are all dropped
q = priceRentalBooking({ vehicle, packageId: 'p24', addOns: ['child', 'child', 'nope', 'retired'] });
assert.equal(q.addOnsTotal, 150, 'dedupes, drops unknown and inactive');

// A client-supplied price is never trusted
q = priceRentalBooking({ vehicle, packageId: 'p24', addOns: [{ id: 'child', price: 0 }] });
assert.equal(q.addOnsTotal, 150);

// Extra hours bill at the package rate
q = priceRentalBooking({ vehicle, packageId: 'p24', extraHours: 3 });
assert.equal(q.extraHoursTotal, 600);
assert.equal(q.totalCost, 6432);

// Advance modes
q = priceRentalBooking({ vehicle: { ...vehicle, advancePayment: { enabled: true, paymentMode: 'fixed', amount: 500 } }, packageId: 'p24' });
assert.equal(q.payableNow, 500);

q = priceRentalBooking({ vehicle: { ...vehicle, advancePayment: { enabled: true, paymentMode: 'full' } }, packageId: 'p24' });
assert.equal(q.payableNow, 5832);
assert.equal(q.balanceDue, 0);

q = priceRentalBooking({ vehicle: { ...vehicle, advancePayment: { enabled: false } }, packageId: 'p24' });
assert.equal(q.payableNow, 0, 'advance disabled means nothing due up front');

// A fixed advance larger than the booking never exceeds the total
q = priceRentalBooking({ vehicle: { ...vehicle, advancePayment: { enabled: true, paymentMode: 'fixed', amount: 999999 } }, packageId: 'p24' });
assert.equal(q.payableNow, 5832);

// Invalid / inactive packages are rejected outright
assert.throws(() => priceRentalBooking({ vehicle, packageId: 'nope' }), /invalid/i);
assert.throws(() => priceRentalBooking({ vehicle, packageId: 'gone' }), /invalid/i);

// originalPrice drives the struck-through price and the savings total
q = priceRentalBooking({ vehicle, packageId: 'p24', addOns: ['child'] });
assert.equal(q.addOnsTotal, 150, 'customer still pays the real price');
assert.equal(q.addOnsSavings, 250, '400 - 150');
assert.equal(q.addOns[0].originalPrice, 400);

// An originalPrice below the price is not a discount and must be dropped
q = priceRentalBooking({ vehicle, packageId: 'p24', addOns: ['bogus'] });
assert.equal(q.addOns[0].originalPrice, 0, 'no fake strikethrough');
assert.equal(q.addOnsSavings, 0, 'savings can never go negative');

// An add-on with no originalPrice contributes nothing to savings
q = priceRentalBooking({ vehicle, packageId: 'p24', addOns: ['driver'] });
assert.equal(q.addOnsSavings, 0);

// Mixed selection
q = priceRentalBooking({ vehicle, packageId: 'p24', addOns: ['child', 'driver', 'bogus'] });
assert.equal(q.addOnsTotal, 1550);
assert.equal(q.addOnsSavings, 250);

console.log('rental pricing: all assertions passed');
