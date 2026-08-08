/**
 * Seeds the package extras that were previously priced in the mobile detail
 * screen (visa assistance, travel insurance) so the server charges them.
 *
 *   node scripts/seedPackageAddOns.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const INTERNATIONAL = [
  { id: 'visa', label: 'Visa Assistance', price: 6500, perPerson: true, active: true },
  { id: 'insurance', label: 'Travel Insurance', price: 1200, perPerson: true, active: true },
];

const DOMESTIC = [
  { id: 'insurance', label: 'Travel Insurance', price: 499, perPerson: true, active: true },
];

const run = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');

  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB_NAME || 'appzeto_taxi' });
  const { TravelPackage } = await import('../src/modules/taxi/admin/content/models/TravelPackage.js');

  const packages = await TravelPackage.find({}).select('_id title scope addOns');
  let seeded = 0;
  let skipped = 0;

  for (const pkg of packages) {
    if (Array.isArray(pkg.addOns) && pkg.addOns.length) {
      skipped += 1;
      continue;
    }
    pkg.addOns = pkg.scope === 'international' ? INTERNATIONAL : DOMESTIC;
    await pkg.save();
    seeded += 1;
    console.log(`  ${pkg.title} (${pkg.scope}) - ${pkg.addOns.length} extras`);
  }

  console.log(`\nSeeded ${seeded} packages, skipped ${skipped}.`);
  await mongoose.disconnect();
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
