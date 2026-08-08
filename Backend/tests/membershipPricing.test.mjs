import assert from 'node:assert/strict';
import { priceMembership } from '../src/modules/taxi/user/services/membershipService.js';

/* The Gold tier from the design: ₹699 list, ₹499 charged, GST inside the price. */
const gold = priceMembership({ price: 499, oldPrice: 699 });

assert.equal(gold.totalAmount, 499, 'the member is charged the advertised price');
assert.equal(gold.listPrice, 699);
assert.equal(gold.discount, 200, '699 - 499');
assert.equal(gold.discountPercent, 29);
// GST is contained in the price, not added: 499 / 1.18 = 422.88, so tax is 76.12
assert.equal(gold.gst, 76);
assert.equal(gold.baseFare + gold.gst, gold.totalAmount, 'the parts must add up to the total');

/* No strike-through price means no discount, and the total is unaffected. */
const plain = priceMembership({ price: 999, oldPrice: 0 });
assert.equal(plain.listPrice, 999);
assert.equal(plain.discount, 0);
assert.equal(plain.discountPercent, 0);
assert.equal(plain.totalAmount, 999);

/* An oldPrice below the price must never produce a negative discount. */
const odd = priceMembership({ price: 1999, oldPrice: 500 });
assert.equal(odd.discount, 0, 'a nonsense list price cannot make the discount negative');
assert.equal(odd.totalAmount, 1999);

/* A free tier stays free rather than dividing by zero into a NaN. */
const free = priceMembership({ price: 0, oldPrice: 0 });
assert.equal(free.totalAmount, 0);
assert.equal(free.gst, 0);
assert.equal(free.discountPercent, 0);

console.log('membership pricing: all assertions passed');
