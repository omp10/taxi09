import assert from 'node:assert/strict';
import { priceTravelPackage, GST_RATE, TCS_RATE } from '../src/modules/taxi/user/services/travelPackagePricingService.js';

const intl = { slug: 'thailand', title: 'Thailand Island Hopper', scope: 'international', price: 124999, oldPrice: 159999 };
const dom = { slug: 'himachal', title: 'Himachal Delight', scope: 'domestic', price: 11999, oldPrice: 16999 };
const noCoupon = { code: '', percent: 0, discount: 0 };

// Domestic: 5% GST, no TCS
let q = priceTravelPackage({ pkg: dom, travellers: 2, coupon: noCoupon });
assert.equal(q.scope, 'tour');
assert.equal(q.baseFare, 23998);
assert.equal(q.gst, 1200);
assert.equal(q.tcs, 0, 'TCS is overseas only');
assert.equal(q.tcsRate, 0);
assert.equal(q.totalAmount, 25198);
assert.equal(q.savings, 10000);

// International: 5% GST + 5% TCS
q = priceTravelPackage({ pkg: intl, travellers: 1, coupon: noCoupon });
assert.equal(q.scope, 'international');
assert.equal(q.baseFare, 124999);
assert.equal(q.gst, 6250);
assert.equal(q.tcs, 6250);
assert.equal(q.totalAmount, 137499);

// A discount reduces the GST base but never the TCS base
q = priceTravelPackage({ pkg: intl, travellers: 1, coupon: { code: 'GLOBAL10', percent: 10, discount: 12500 } });
assert.equal(q.taxable, 112499);
assert.equal(q.gst, 5625, 'GST follows the discounted fare');
assert.equal(q.tcs, 6250, 'TCS stays on the pre-discount fare');
assert.equal(q.totalAmount, 124374);

// Traveller count is clamped
assert.equal(priceTravelPackage({ pkg: dom, travellers: 0, coupon: noCoupon }).travellers, 1);
assert.equal(priceTravelPackage({ pkg: dom, travellers: -3, coupon: noCoupon }).travellers, 1);
assert.equal(priceTravelPackage({ pkg: dom, coupon: noCoupon }).travellers, 1);

// A discount larger than the fare cannot make the total negative
q = priceTravelPackage({ pkg: dom, travellers: 1, coupon: { code: 'BIG', percent: 0, discount: 999999 } });
assert.equal(q.taxable, 0);
assert.equal(q.gst, 0);
assert.equal(q.totalAmount, 0);

// oldPrice below price is not a saving
assert.equal(priceTravelPackage({ pkg: { ...dom, oldPrice: 100 }, coupon: noCoupon }).savings, 0);

assert.throws(() => priceTravelPackage({ pkg: null, coupon: noCoupon }), /not found/i);

assert.equal(GST_RATE, 0.05);
assert.equal(TCS_RATE, 0.05);

console.log('travel package pricing: all assertions passed');

// --- add-ons -------------------------------------------------------------
const withExtras = {
  ...intl,
  addOns: [
    { id: 'visa', label: 'Visa', price: 6500, perPerson: true, active: true },
    { id: 'insurance', label: 'Insurance', price: 1200, perPerson: true, active: true },
    { id: 'lounge', label: 'Lounge', price: 2000, perPerson: false, active: true },
    { id: 'retired', label: 'Gone', price: 9999, active: false },
  ],
};

let e = priceTravelPackage({ pkg: withExtras, travellers: 2, coupon: noCoupon, addOns: ['visa', 'lounge'] });
assert.equal(e.addOns.find((a) => a.id === 'visa').price, 13000, 'perPerson x2');
assert.equal(e.addOns.find((a) => a.id === 'lounge').price, 2000, 'one-off stays flat');
assert.equal(e.addOnsTotal, 15000);
assert.equal(e.taxable, e.baseFare + 15000);
assert.equal(e.gst, Math.round(e.taxable * 0.05));
assert.equal(e.tcs, Math.round(e.baseFare * 0.05), 'TCS still follows the package fare only');
assert.equal(e.totalAmount, e.taxable + e.gst + e.tcs);

// Unknown, inactive and duplicate ids are dropped; client prices ignored
e = priceTravelPackage({ pkg: withExtras, travellers: 1, coupon: noCoupon, addOns: ['visa', 'visa', 'nope', 'retired'] });
assert.equal(e.addOnsTotal, 6500);
e = priceTravelPackage({ pkg: withExtras, travellers: 1, coupon: noCoupon, addOns: [{ id: 'visa', price: 0 }] });
assert.equal(e.addOnsTotal, 6500);

// No extras leaves the total untouched
assert.equal(priceTravelPackage({ pkg: withExtras, travellers: 1, coupon: noCoupon }).addOnsTotal, 0);

console.log('travel package add-ons: all assertions passed');
