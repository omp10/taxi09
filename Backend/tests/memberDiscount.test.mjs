import assert from 'node:assert/strict';
import { priceHotelStay } from '../src/modules/taxi/user/services/hotelPricingService.js';
import { priceTravelPackage } from '../src/modules/taxi/user/services/travelPackagePricingService.js';
import { priceRentalBooking } from '../src/modules/taxi/user/services/rentalPricingService.js';

/* ------------------------------------------------------------------ hotel */

const hotel = {
  slug: 'h', name: 'H', price: 2000,
  rooms: [{ key: 'deluxe', name: 'Deluxe', priceMultiplier: 1 }],
};
const stay = { hotel, roomKey: 'deluxe', checkIn: '2027-01-01', checkOut: '2027-01-03', rooms: 1 };

const plain = priceHotelStay(stay);
const member = priceHotelStay({ ...stay, memberDiscountPercent: 10 });

// 2 nights x 2000 = 4000, 12% GST (under the 7,500 tariff threshold)
assert.equal(plain.roomCharges, 4000);
assert.equal(plain.taxes, 480);
assert.equal(plain.totalAmount, 4480);

assert.equal(member.memberDiscount, 400, '10% of the 4,000 room charge');
// Tax follows what is actually paid: 3,600 x 12% = 432, not the undiscounted 480.
assert.equal(member.taxes, 432, 'GST is charged on the discounted amount');
assert.equal(member.totalAmount, 4032);
assert.ok(member.totalAmount < plain.totalAmount, 'a member pays less');

// The tariff decides the GST slab, so a discount cannot drop it into a cheaper band.
const luxury = {
  hotel: { slug: 'l', name: 'L', price: 8000, rooms: [{ key: 'suite', name: 'Suite', priceMultiplier: 1 }] },
  roomKey: 'suite', checkIn: '2027-01-01', checkOut: '2027-01-02', rooms: 1,
};
assert.equal(priceHotelStay(luxury).taxPercent, 18);
assert.equal(
  priceHotelStay({ ...luxury, memberDiscountPercent: 20 }).taxPercent,
  18,
  'discounting an 8,000 tariff below 7,500 must not move it to the 12% slab',
);

/* --------------------------------------------------------------- package */

const pkg = { slug: 'p', title: 'P', scope: 'international', price: 50000 };
const noCoupon = { code: '', percent: 0, discount: 0 };

const pkgPlain = priceTravelPackage({ pkg, travellers: 2, coupon: noCoupon });
const pkgMember = priceTravelPackage({ pkg, travellers: 2, coupon: noCoupon, memberDiscountPercent: 10 });

assert.equal(pkgPlain.baseFare, 100000);
assert.equal(pkgMember.memberDiscount, 10000);
assert.ok(pkgMember.totalAmount < pkgPlain.totalAmount);

// TCS follows the gross fare under s.206C(1G) - a discount must not reduce it.
assert.equal(pkgMember.tcs, pkgPlain.tcs, 'TCS is unchanged by the membership');
assert.equal(pkgMember.tcs, 5000, '5% of the 100,000 pre-discount fare');
// GST, by contrast, follows what is actually paid.
assert.ok(pkgMember.gst < pkgPlain.gst, 'GST drops with the discounted fare');

/* A coupon and a membership stack, and can never exceed the fare. */
const stacked = priceTravelPackage({
  pkg,
  travellers: 2,
  coupon: { code: 'SAVE', percent: 50, discount: 50000 },
  memberDiscountPercent: 20,
});
assert.equal(stacked.discount, 50000, 'the coupon still comes off first');
assert.equal(stacked.memberDiscount, 10000, '20% of the 50,000 that remains');
assert.ok(stacked.totalAmount > 0, 'stacking cannot drive the total negative');

/* A 100% member discount zeroes the fare but still leaves TCS payable. */
const free = priceTravelPackage({ pkg, travellers: 1, coupon: noCoupon, memberDiscountPercent: 100 });
assert.equal(free.gst, 0);
assert.equal(free.tcs, 2500, 'TCS survives even a fully discounted fare');

/* ---------------------------------------------------------------- rental */

const vehicle = {
  name: 'Car',
  pricing: [{ id: 'p1', label: '6 Hours', price: 1000, durationHours: 6, extraHourPrice: 100 }],
  advancePayment: { enabled: true, paymentMode: 'percentage', amount: 50 },
};

const rentPlain = priceRentalBooking({ vehicle, packageId: 'p1' });
const rentMember = priceRentalBooking({ vehicle, packageId: 'p1', memberDiscountPercent: 20 });

assert.equal(rentPlain.totalCost, 1000);
assert.equal(rentPlain.payableNow, 500);

assert.equal(rentMember.memberDiscount, 200);
assert.equal(rentMember.totalCost, 800);
// The advance is a share of the total, so it follows the discount down.
assert.equal(rentMember.payableNow, 400, 'the advance is taken on the discounted total');
assert.equal(rentMember.balanceDue, 400);
assert.equal(rentMember.payableNow + rentMember.balanceDue, rentMember.totalCost);

/* ------------------------------------------------------- non-members ---- */

// Absent or nonsense percentages must leave every price exactly as it was.
for (const bad of [undefined, 0, null, -25, 'abc', NaN]) {
  assert.equal(priceHotelStay({ ...stay, memberDiscountPercent: bad }).totalAmount, plain.totalAmount);
  assert.equal(priceRentalBooking({ vehicle, packageId: 'p1', memberDiscountPercent: bad }).totalCost, 1000);
}

// Over 100 is clamped rather than inverting the price.
assert.equal(priceRentalBooking({ vehicle, packageId: 'p1', memberDiscountPercent: 500 }).totalCost, 0);

console.log('member discount: all assertions passed');
