/**
 * Seeds the taxi vehicle classes and their fares.
 *
 * These values previously lived as hardcoded arrays in the AirportCab and
 * SpiritualTripVehicle screens. Seeding them into Vehicle + SetPrice means the
 * existing Admin > Vehicle Types and Admin > Set Prices pages become the single
 * place they are edited - no new admin screen needed.
 *
 *   node scripts/seedVehicleFares.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const CLASSES = [
  {
    name: 'Mini Cab',
    short_description: 'Swift, Alto, WagonR',
    capacity: 4,
    icon_types: 'car',
    base_price: 499,
    base_distance: 3,
    price_per_distance: 12,
    time_price: 1,
    airport_surge: 50,
    outstation_base_price: 800,
    outstation_base_distance: 10,
    outstation_price_per_distance: 11,
    order_number: 1,
  },
  {
    name: 'Sedan',
    short_description: 'Dzire, Amaze, Aspire',
    capacity: 4,
    icon_types: 'car',
    base_price: 699,
    base_distance: 3,
    price_per_distance: 15,
    time_price: 1.5,
    airport_surge: 75,
    outstation_base_price: 1100,
    outstation_base_distance: 10,
    outstation_price_per_distance: 14,
    order_number: 2,
  },
  {
    name: 'SUV',
    short_description: 'Ertiga, Innova, Crysta',
    capacity: 6,
    icon_types: 'suv',
    base_price: 999,
    base_distance: 3,
    price_per_distance: 19,
    time_price: 2,
    airport_surge: 100,
    outstation_base_price: 1600,
    outstation_base_distance: 10,
    outstation_price_per_distance: 18,
    order_number: 3,
  },
  {
    name: 'Traveller',
    short_description: 'Force Traveller, Tempo',
    capacity: 12,
    icon_types: 'van',
    base_price: 1899,
    base_distance: 5,
    price_per_distance: 26,
    time_price: 3,
    airport_surge: 150,
    outstation_base_price: 3200,
    outstation_base_distance: 10,
    outstation_price_per_distance: 24,
    order_number: 4,
  },
];

const run = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');

  // Must match the server's database, which pins dbName explicitly - without
  // it the driver silently uses the URI's default db ("test").
  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB_NAME || 'appzeto_taxi' });
  const { Vehicle } = await import('../src/modules/taxi/admin/models/Vehicle.js');
  const { SetPrice } = await import('../src/modules/taxi/admin/models/SetPrice.js');
  const { ServiceLocation } = await import('../src/modules/taxi/admin/models/ServiceLocation.js');

  // Fares are per service location; pin to the first configured one so the
  // admin's Set Prices page shows these rows under a real location.
  const location = await ServiceLocation.findOne({}).select('_id name').lean();
  console.log(location ? `Service location: ${location.name}` : 'No service location - seeding fares unscoped');

  for (const item of CLASSES) {
    const { base_price, base_distance, price_per_distance, time_price, airport_surge,
            outstation_base_price, outstation_base_distance, outstation_price_per_distance,
            order_number, ...vehicleFields } = item;

    await Vehicle.updateOne(
      { name: item.name, transport_type: 'taxi' },
      { $set: { ...vehicleFields, transport_type: 'taxi', status: 1, active: true } },
      { upsert: true },
    );

    const vehicle = await Vehicle.findOne({ name: item.name, transport_type: 'taxi' }).select('_id').lean();

    await SetPrice.updateOne(
      { vehicle_type: vehicle._id, transport_type: 'taxi', service_location_id: location?._id || null },
      {
        $set: {
          base_price, base_distance, price_per_distance, time_price, airport_surge,
          outstation_base_price, outstation_base_distance, outstation_price_per_distance,
          enable_airport_ride: 1,
          enable_outstation_ride: 1,
          pricing_scope: 'ride',
          order_number,
          status: 1,
          active: true,
        },
      },
      { upsert: true },
    );

    console.log(`  ${item.name} - base Rs.${base_price}, Rs.${price_per_distance}/km`);
  }

  console.log(`\nSeeded ${CLASSES.length} vehicle classes with fares.`);
  await mongoose.disconnect();
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
