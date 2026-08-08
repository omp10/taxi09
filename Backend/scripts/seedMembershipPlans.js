/**
 * Seeds the three starter membership tiers.
 *
 * These are ordinary admin-editable rows - the seed only gives the admin
 * something to edit rather than a blank screen. Re-running updates the existing
 * tiers by slug instead of duplicating them.
 *
 *   node scripts/seedMembershipPlans.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const PLANS = [
  {
    slug: 'gold',
    name: 'Gold',
    tagline: 'MEMBER',
    discountPercent: 10,
    price: 499,
    oldPrice: 699,
    durationMonths: 3,
    theme: 'gold',
    sortOrder: 1,
    benefits: [
      { icon: 'clock', title: 'Priority Booking', subtitle: 'Faster confirmations' },
      { icon: 'shield-check', title: 'Free Cancellation', subtitle: 'Up to 24 hrs before trip' },
      { icon: 'tag', title: 'Exclusive Deals', subtitle: 'Partner offers' },
    ],
  },
  {
    slug: 'platinum',
    name: 'Platinum',
    tagline: 'MEMBER',
    discountPercent: 15,
    price: 999,
    oldPrice: 1499,
    durationMonths: 6,
    theme: 'silver',
    sortOrder: 2,
    benefits: [
      { icon: 'clock', title: 'Priority Booking', subtitle: 'Faster confirmations' },
      { icon: 'shield-check', title: 'Free Cancellation', subtitle: 'Up to 24 hrs before trip' },
      { icon: 'tag', title: 'Exclusive Deals', subtitle: 'Partner offers' },
      { icon: 'headset', title: 'Extended Support', subtitle: '24x7 priority support' },
    ],
  },
  {
    slug: 'black',
    name: 'Black',
    tagline: 'MEMBER',
    discountPercent: 20,
    price: 1999,
    oldPrice: 2999,
    durationMonths: 12,
    theme: 'black',
    sortOrder: 3,
    benefits: [
      { icon: 'clock', title: 'Priority Booking', subtitle: 'Faster confirmations' },
      { icon: 'shield-check', title: 'Free Cancellation', subtitle: 'Up to 24 hrs before trip' },
      { icon: 'plane', title: 'Airport Lounge Access', subtitle: '2 complimentary / year' },
      { icon: 'gift', title: 'Free Add-on', subtitle: '1 free add-on per trip' },
      { icon: 'headset', title: 'Extended Support', subtitle: '24x7 priority support' },
    ],
  },
];

const run = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');

  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB_NAME || 'appzeto_taxi' });
  const { MembershipPlan } = await import('../src/modules/taxi/admin/content/models/MembershipPlan.js');

  for (const plan of PLANS) {
    const existing = await MembershipPlan.findOne({ slug: plan.slug });
    if (existing) {
      Object.assign(existing, plan);
      await existing.save();
      console.log(`updated  ${plan.name.padEnd(9)} ₹${plan.price} / ${plan.durationMonths} months · ${plan.discountPercent}% off`);
    } else {
      await MembershipPlan.create(plan);
      console.log(`created  ${plan.name.padEnd(9)} ₹${plan.price} / ${plan.durationMonths} months · ${plan.discountPercent}% off`);
    }
  }

  await mongoose.disconnect();
};

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
