import assert from 'node:assert/strict';
import { priceHotelStay, gstPercentFor } from '../src/modules/taxi/user/services/hotelPricingService.js';

const hotel = {
  slug: 'the-grand-orion', name: 'The Grand Orion', price: 2649, oldPrice: 3499,
  rooms: [
    { key: 'deluxe', name: 'Deluxe Room', priceMultiplier: 1, active: true },
    { key: 'suite', name: 'Suite', priceMultiplier: 3.2, active: true },
    { key: 'gone', name: 'Retired', priceMultiplier: 1, active: false },
  ],
};

// Single night, base room
let q = priceHotelStay({ hotel, roomKey: 'deluxe', checkIn: '2026-05-24', checkOut: '2026-05-25' });
assert.equal(q.nightlyRate, 2649);
assert.equal(q.nights, 1);
assert.equal(q.roomCharges, 2649);
assert.equal(q.taxPercent, 12, 'under the 7500 slab');
assert.equal(q.taxes, 317.88);
assert.equal(q.totalAmount, 2966.88);

// priceMultiplier scales the nightly rate and pushes it over the 18% slab
q = priceHotelStay({ hotel, roomKey: 'suite', checkIn: '2026-05-24', checkOut: '2026-05-25' });
assert.equal(q.nightlyRate, 8476.8);
assert.equal(q.taxPercent, 18, 'above 7500 per night');

// Multiple nights and rooms multiply, and the slab still follows the per-night rate
q = priceHotelStay({ hotel, roomKey: 'deluxe', checkIn: '2026-05-24', checkOut: '2026-05-27', rooms: 2 });
assert.equal(q.nights, 3);
assert.equal(q.rooms, 2);
assert.equal(q.roomCharges, 15894, '2649 x 3 x 2');
assert.equal(q.taxPercent, 12, 'total is over 7500 but the nightly rate is not');

// Same-day or reversed dates still bill one night, never zero or negative
assert.equal(priceHotelStay({ hotel, checkIn: '2026-05-24', checkOut: '2026-05-24' }).nights, 1);
assert.equal(priceHotelStay({ hotel, checkIn: '2026-05-27', checkOut: '2026-05-24' }).nights, 1);
assert.equal(priceHotelStay({ hotel, checkIn: 'nonsense', checkOut: '' }).nights, 1);

// Room count is clamped to a sane minimum
assert.equal(priceHotelStay({ hotel, rooms: 0 }).rooms, 1);
assert.equal(priceHotelStay({ hotel, rooms: -5 }).rooms, 1);

// Omitting the room key falls back to the first active room
assert.equal(priceHotelStay({ hotel }).roomKey, 'deluxe');

// Unknown or retired rooms are rejected rather than silently repriced
assert.throws(() => priceHotelStay({ hotel, roomKey: 'penthouse' }), /not available/i);
assert.throws(() => priceHotelStay({ hotel, roomKey: 'gone' }), /not available/i);
assert.throws(() => priceHotelStay({ hotel: null }), /not found/i);

// Savings only when oldPrice genuinely exceeds price
assert.equal(priceHotelStay({ hotel, roomKey: 'deluxe' }).savings, 850);
assert.equal(priceHotelStay({ hotel: { ...hotel, oldPrice: 0 } }).savings, 0);
assert.equal(priceHotelStay({ hotel: { ...hotel, oldPrice: 100 } }).savings, 0, 'oldPrice below price is not a saving');

assert.equal(gstPercentFor(7500), 12, 'threshold itself stays in the lower slab');
assert.equal(gstPercentFor(7501), 18);

console.log('hotel pricing: all assertions passed');

// Room rates are returned for every active room so the UI never multiplies
const rates = priceHotelStay({ hotel, roomKey: 'deluxe' }).roomRates;
assert.equal(rates.length, 2, 'inactive rooms are excluded');
assert.deepEqual(rates.map((r) => r.key), ['deluxe', 'suite']);
assert.equal(rates[0].nightlyRate, 2649);
assert.equal(rates[1].nightlyRate, 8476.8);
assert.equal(rates[0].taxPercent, 12);
assert.equal(rates[1].taxPercent, 18, 'slab is per room rate');
console.log('hotel room rates: all assertions passed');

// --- add-ons -------------------------------------------------------------
const withExtras = {
  ...hotel,
  addOns: [
    { id: 'breakfast', label: 'Breakfast', price: 350, perNight: true, active: true },
    { id: 'pickup', label: 'Airport Pickup', price: 799, perNight: false, active: true },
    { id: 'retired', label: 'Gone', price: 500, active: false },
  ],
};

// perNight bills per night per room; one-off does not
let a = priceHotelStay({ hotel: withExtras, roomKey: 'deluxe', checkIn: '2026-05-24', checkOut: '2026-05-27', rooms: 2, addOns: ['breakfast', 'pickup'] });
assert.equal(a.nights, 3);
assert.equal(a.addOns.find((x) => x.id === 'breakfast').price, 2100, '350 x 3 nights x 2 rooms');
assert.equal(a.addOns.find((x) => x.id === 'pickup').price, 799, 'one-off stays flat');
assert.equal(a.addOnsTotal, 2899);

// Extras are taxed with the room, and roll into the total
assert.equal(a.taxes, Math.round((a.roomCharges + a.addOnsTotal) * 0.12 * 100) / 100);
assert.equal(a.totalAmount, Math.round((a.roomCharges + a.addOnsTotal + a.taxes) * 100) / 100);

// Unknown, inactive and duplicate ids are dropped
a = priceHotelStay({ hotel: withExtras, roomKey: 'deluxe', addOns: ['breakfast', 'breakfast', 'nope', 'retired'] });
assert.equal(a.addOns.length, 1, 'dedupes, drops unknown and inactive');

// A client-sent price is never trusted
a = priceHotelStay({ hotel: withExtras, roomKey: 'deluxe', addOns: [{ id: 'pickup', price: 0 }] });
assert.equal(a.addOnsTotal, 799);

// No extras is still a valid stay
assert.equal(priceHotelStay({ hotel: withExtras, roomKey: 'deluxe' }).addOnsTotal, 0);

console.log('hotel add-ons: all assertions passed');
