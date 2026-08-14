/**
 * Fill in packageIncludes for the cars so the section can be seen.
 * Scooters are left alone deliberately - FASTag and state tax do not apply.
 *
 *   node scratch/seed_package_includes.mjs
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { RentalVehicleType } from '../src/modules/taxi/admin/models/RentalVehicleType.js';

const CAR_INCLUDES = ['Insurance', 'Roadside 24x7', 'FASTag', 'Toll Tax', 'State Tax'];
const TWO_WHEELER_INCLUDES = ['Insurance', 'Roadside 24x7'];

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI, {
    dbName: process.env.MONGODB_DB_NAME || 'appzeto_taxi',
  });

  const vehicles = await RentalVehicleType.find({});
  let filled = 0;

  for (const vehicle of vehicles) {
    if ((vehicle.packageIncludes || []).length) continue;
    const category = String(vehicle.vehicleCategory || '').toLowerCase();
    const twoWheeler = category.includes('bike') || category.includes('scoot');
    vehicle.packageIncludes = twoWheeler ? TWO_WHEELER_INCLUDES : CAR_INCLUDES;
    await vehicle.save();
    filled += 1;
  }

  console.log(`packageIncludes set on ${filled} of ${vehicles.length} vehicles`);
  await mongoose.disconnect();
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
