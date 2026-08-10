// End-to-end proof that a hotel coupon is honoured: quote, booking and stored
// record must all agree, and an invalid code must be refused.
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const BASE = 'http://localhost:5000/api/users';
const PHONE = '7223077890';

const req = async (method, path, body, token) => {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = {}; try { data = await res.json(); } catch {}
  return { ok: res.ok, status: res.status, data: data.data ?? data, message: data.message };
};

await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB_NAME });
const { RentalCoupon } = await import('../src/modules/taxi/admin/models/RentalCoupon.js');
const { HotelBooking } = await import('../src/modules/taxi/admin/content/models/HotelBooking.js');

const CODE = 'QAHOTEL25';
await RentalCoupon.deleteOne({ code: CODE });
await RentalCoupon.create({
  code: CODE, description: 'QA', type: 'percent', amount: 25, cap: 0,
  min_booking_amount: 0, expiry_date: new Date(Date.now() + 86400000),
  applies_to: ['hotel'], active: true,
});
console.log(`created coupon ${CODE}: 25% off, scope=hotel`);

await req('POST', '/auth/send-otp', { phone: PHONE });
const token = (await req('POST', '/auth/verify-otp', { phone: PHONE, otp: '0000' })).data.token;
const day = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

const hotel = (await req('GET', '/hotels', null, token)).data.results[0];
const roomKey = (hotel.rooms || []).find((r) => r.active !== false)?.key;
const base = { slug: hotel.slug, roomKey, checkIn: day(1), checkOut: day(3), rooms: 1, guests: 2 };

const plain = await req('POST', '/hotels/quote', base, token);
const withCode = await req('POST', '/hotels/quote', { ...base, couponCode: CODE }, token);
console.log('\n--- quote ---');
console.log(`  no coupon   room ₹${plain.data.roomCharges} tax ₹${plain.data.taxes} total ₹${plain.data.totalAmount}`);
console.log(`  ${CODE}  room ₹${withCode.data.roomCharges} coupon -₹${withCode.data.couponDiscount} tax ₹${withCode.data.taxes} total ₹${withCode.data.totalAmount}`);
const expected = Math.round(plain.data.roomCharges * 0.25);
console.log(`  ${withCode.data.couponDiscount === expected ? 'PASS' : 'FAIL'} discount is 25% of room charges (expected ₹${expected})`);
console.log(`  ${withCode.data.totalAmount < plain.data.totalAmount ? 'PASS' : 'FAIL'} total actually dropped`);
console.log(`  ${withCode.data.taxes < plain.data.taxes ? 'PASS' : 'FAIL'} GST charged on the discounted subtotal`);

const booked = await req('POST', '/hotel-bookings', { ...base, couponCode: CODE, guestName: 'QA Tester', guestPhone: PHONE }, token);
console.log('\n--- booking ---');
console.log(`  ${booked.ok ? 'PASS' : 'FAIL'} created ${booked.data.bookingReference || booked.message}`);
const stored = booked.ok ? await HotelBooking.findById(booked.data._id).lean() : null;
if (stored) {
  console.log(`  stored couponCode=${stored.couponCode} couponDiscount=₹${stored.couponDiscount} total=₹${stored.totalAmount}`);
  console.log(`  ${stored.totalAmount === withCode.data.totalAmount ? 'PASS' : 'FAIL'} charged total matches the quoted total`);
}

console.log('\n--- rejections ---');
const bogus = await req('POST', '/hotels/quote', { ...base, couponCode: 'NOTAREALCODE' }, token);
console.log(`  ${bogus.status === 400 ? 'PASS' : 'FAIL'} unknown code refused: "${bogus.message}"`);
const wrongScope = await req('POST', '/hotels/quote', { ...base, couponCode: 'GLOBAL10' }, token);
console.log(`  ${wrongScope.status === 400 ? 'PASS' : 'FAIL'} non-hotel code refused: "${wrongScope.message}"`);

// packages must still work after the shared-resolver refactor
const pkg = (await req('GET', '/travel-packages', null, token)).data.results[0];
const pq = await req('POST', '/travel-packages/quote', { slug: pkg.slug, travellers: 2 }, token);
console.log(`\n  ${pq.ok && pq.data.totalAmount > 0 ? 'PASS' : 'FAIL'} package quote still prices (₹${pq.data.totalAmount})`);

if (stored) await HotelBooking.deleteOne({ _id: stored._id });
await RentalCoupon.deleteOne({ code: CODE });
console.log('\ncleaned up QA coupon and booking');
process.exit(0);
