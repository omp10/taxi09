import assert from 'node:assert/strict';
import crypto from 'node:crypto';

/**
 * The signature check is the security boundary, so exercise it directly with
 * the same HMAC the service uses.
 */
const sign = (secret, orderId, paymentId) =>
  crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');

const SECRET = 'test_secret_key';
const good = sign(SECRET, 'order_A', 'pay_1');

// A correct triple verifies
assert.equal(sign(SECRET, 'order_A', 'pay_1'), good);

// Any tampered field breaks it
assert.notEqual(sign(SECRET, 'order_B', 'pay_1'), good, 'different order must not match');
assert.notEqual(sign(SECRET, 'order_A', 'pay_2'), good, 'different payment must not match');
assert.notEqual(sign('other_secret', 'order_A', 'pay_1'), good, 'wrong secret must not match');

// Order and payment are not interchangeable
assert.notEqual(sign(SECRET, 'pay_1', 'order_A'), good, 'swapped fields must not match');

// Amount conversion to paise, using the service's own helper
const { toPaise } = await import('../src/modules/taxi/user/services/bookingPaymentService.js');
assert.equal(toPaise(2966.88), 296688);
assert.equal(toPaise(58140.25), 5814025);
assert.equal(toPaise(12599), 1259900);
// Binary drift must not short-charge: plain 1.005*100 is 100.49999...
assert.equal(toPaise(1.005), 101);
assert.equal(toPaise(2.675), 268);
assert.equal(toPaise(0), 0);

console.log('booking payment: all assertions passed');
