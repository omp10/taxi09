/**
 * Moves the package coupon codes that used to be hardcoded in the frontend
 * into the Coupons admin, so they can be edited or retired without a deploy.
 *
 *   node scripts/seedPackageCoupons.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;
const MONGO_DB = process.env.MONGODB_DB_NAME || 'appzeto_taxi';

// Two years out - the admin can shorten these at any time.
const EXPIRY = new Date('2028-12-31T23:59:59.000Z');

const COUPONS = [
  {
    code: 'GLOBAL10',
    description: '10% off international packages',
    type: 'percent',
    amount: 10,
    applies_to: ['international'],
  },
  {
    code: 'FLYFREE',
    description: '15% off international packages',
    type: 'percent',
    amount: 15,
    applies_to: ['international'],
  },
  {
    code: 'EXPLORE10',
    description: '10% off domestic tour packages',
    type: 'percent',
    amount: 10,
    applies_to: ['tour'],
  },
];

const run = async () => {
  if (!MONGO_URI) throw new Error('MONGODB_URI is not set');

  await mongoose.connect(MONGO_URI, { dbName: MONGO_DB });
  const { RentalCoupon } = await import('../src/modules/taxi/admin/models/RentalCoupon.js');

  let created = 0;
  let updated = 0;

  for (const coupon of COUPONS) {
    const result = await RentalCoupon.updateOne(
      { code: coupon.code },
      {
        $set: { ...coupon, active: true },
        // Don't stomp an expiry the admin has already adjusted.
        $setOnInsert: { expiry_date: EXPIRY, cap: 0, min_booking_amount: 0 },
      },
      { upsert: true },
    );
    result.upsertedCount ? (created += 1) : (updated += 1);
    console.log(`  ${coupon.code} - ${coupon.amount}% ${coupon.applies_to.join(', ')}`);
  }

  console.log(`\npackage coupons: ${created} created, ${updated} updated`);

  // Existing rental coupons predate `applies_to`; default them so their
  // behaviour is unchanged now that the field decides scope.
  const backfilled = await RentalCoupon.updateMany(
    { $or: [{ applies_to: { $exists: false } }, { applies_to: { $size: 0 } }] },
    { $set: { applies_to: ['rental'] } },
  );
  console.log(`backfilled ${backfilled.modifiedCount} existing coupon(s) to applies_to: ['rental']`);

  await mongoose.disconnect();
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
