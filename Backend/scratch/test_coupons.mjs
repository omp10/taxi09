// Confirms what the coupon UI was claiming vs what the server actually charges.
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

await req('POST', '/auth/send-otp', { phone: PHONE });
const token = (await req('POST', '/auth/verify-otp', { phone: PHONE, otp: '0000' })).data.token;
const day = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

// ---- hotel: the removed UI promised 40% off with FIRST40 ----
const hotel = (await req('GET', '/hotels', null, token)).data.results[0];
const roomKey = (hotel.rooms || []).find((r) => r.active !== false)?.key;
const base = { slug: hotel.slug, roomKey, checkIn: day(1), checkOut: day(3), rooms: 1, guests: 2 };

const plain = await req('POST', '/hotels/quote', base, token);
const withCode = await req('POST', '/hotels/quote', { ...base, couponCode: 'FIRST40' }, token);
console.log('--- hotel ---');
console.log(`  no coupon      total ₹${plain.data.totalAmount}`);
console.log(`  FIRST40 sent   total ₹${withCode.data.totalAmount}`);
console.log(`  => ${plain.data.totalAmount === withCode.data.totalAmount
  ? 'identical: the server never honoured it, so the old "40% off" toast was a lie'
  : 'DIFFERENT: hotel coupons do work server side'}`);

// ---- package: coupons ARE resolved server side ----
const pkg = (await req('GET', '/travel-packages', null, token)).data.results[0];
const pPlain = await req('POST', '/travel-packages/quote', { slug: pkg.slug, travellers: 2 }, token);
const pFake = await req('POST', '/travel-packages/quote', { slug: pkg.slug, travellers: 2, couponCode: 'GLOBAL10' }, token);
console.log('\n--- travel package ---');
console.log(`  no coupon        total ₹${pPlain.data.totalAmount} discount ₹${pPlain.data.discount ?? 0}`);
console.log(`  GLOBAL10 sent    total ₹${pFake.data.totalAmount} discount ₹${pFake.data.discount ?? 0}`);
console.log(`  => GLOBAL10 (the old hardcoded code) is ${(pFake.data.discount ?? 0) > 0 ? 'a real coupon' : 'NOT in the promo table - the client used to accept it anyway'}`);
process.exit(0);
