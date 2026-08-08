/**
 * Puts the whole self-drive fleet at one pickup branch.
 *
 * Rental vehicles are linked to service stores; without a store in the
 * customer's city the booking flow rejects the vehicle ("no rental service
 * store is configured"). This creates the branch if missing and attaches every
 * rental vehicle to it.
 *
 *   node scripts/seedRentalLocation.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Coordinates of the Vijay Nagar branch. The zone is inherited from an
// existing Indore store so the new branch lands in the same serviceable zone.
const BRANCH = {
  name: 'Vijay Nagar, Indore',
  address: 'Vijay Nagar, Indore, Madhya Pradesh 452010, India',
  latitude: 22.7533,
  longitude: 75.8937,
};

const run = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');

  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB_NAME || 'appzeto_taxi' });
  const { ServiceStore } = await import('../src/modules/taxi/admin/models/ServiceStore.js');
  const { ServiceLocation } = await import('../src/modules/taxi/admin/models/ServiceLocation.js');
  const { RentalVehicleType } = await import('../src/modules/taxi/admin/models/RentalVehicleType.js');

  const location = await ServiceLocation.findOne({}).select('_id name').lean();

  // Reuse the zone of an existing Indore store rather than inventing one.
  const sibling = await ServiceStore.findOne({ address: /Indore/i }).select('zone_id service_location_id').lean();

  let store = await ServiceStore.findOne({ name: BRANCH.name });
  if (!store) {
    store = await ServiceStore.create({
      ...BRANCH,
      location: { type: 'Point', coordinates: [BRANCH.longitude, BRANCH.latitude] },
      zone_id: sibling?.zone_id,
      service_location_id: sibling?.service_location_id || location?._id || null,
      status: 'active',
      active: true,
    });
    console.log(`created branch: ${store.name}`);
  } else {
    console.log(`branch already exists: ${store.name}`);
  }

  const vehicles = await RentalVehicleType.find({}).select('_id name serviceStoreIds');
  let attached = 0;

  for (const vehicle of vehicles) {
    const ids = (vehicle.serviceStoreIds || []).map(String);
    if (ids.includes(String(store._id))) continue;

    vehicle.serviceStoreIds = [...(vehicle.serviceStoreIds || []), store._id];
    await vehicle.save();
    attached += 1;
    console.log(`  attached ${vehicle.name}`);
  }

  console.log(`\n${attached} vehicle(s) attached, ${vehicles.length - attached} already there.`);
  console.log(`Service location: ${location?.name || 'none configured'}`);
  await mongoose.disconnect();
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
