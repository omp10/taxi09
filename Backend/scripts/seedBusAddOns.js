/**
 * Moves the bus extras out of the code and into the database.
 *
 * These two were hardcoded in the controller, so an admin could not add one or
 * change a price without a deploy. They are ordinary editable rows now.
 *
 * Only fills a service that has no extras yet, so re-running never overwrites
 * prices an admin has since changed.
 *
 *   node scripts/seedBusAddOns.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const DEFAULT_ADD_ONS = [
  { id: 'insurance', label: 'Travel Insurance', hint: 'Secure your journey', price: 49, perSeat: false, active: true },
  { id: 'meal_veg', label: 'Meal (Veg)', hint: 'Dinner on board', price: 99, perSeat: true, active: true },
];

const run = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');

  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB_NAME || 'appzeto_taxi' });
  const { BusService } = await import('../src/modules/taxi/admin/models/BusService.js');

  const services = await BusService.find({}).select('operatorName busName addOns');
  let filled = 0;

  for (const service of services) {
    if ((service.addOns || []).length > 0) {
      console.log(`skip    ${service.operatorName || service.busName} (${service.addOns.length} already set)`);
      continue;
    }

    service.addOns = DEFAULT_ADD_ONS;
    await service.save();
    filled += 1;
    console.log(`seeded  ${service.operatorName || service.busName}`);
  }

  console.log(`\n${filled} of ${services.length} bus services given the default extras`);
  await mongoose.disconnect();
};

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
