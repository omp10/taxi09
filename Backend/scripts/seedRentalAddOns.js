/**
 * Seeds the default rental add-on catalogue onto every rental vehicle that
 * has none.
 *
 * These options were previously hardcoded in RentalVehicleDetail.jsx and
 * RentalSchedule.jsx. Once seeded they are edited per-vehicle in
 * Admin > Rental Vehicle Types, and priced server-side at booking time.
 *
 *   node scripts/seedRentalAddOns.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const DEFAULT_ADD_ONS = [
  { id: 'child', label: 'Child Seat', description: 'Safe & comfortable seating for kids', price: 150, icon: 'Armchair' },
  { id: 'driver', label: 'Driver Needed', description: 'Professional driver for your trip', price: 1200, icon: 'Users' },
  { id: 'roof', label: 'Roof Carrier', description: 'Extra luggage space for your journey', price: 250, icon: 'Car' },
  { id: 'luggage', label: 'Extra Luggage', description: 'Extra luggage space per bag', price: 100, icon: 'Luggage' },
  { id: 'wifi', label: 'Wi-Fi Device', description: 'Stay connected on the go', price: 100, icon: 'Navigation' },
  { id: 'gps', label: 'GPS Navigation', description: 'Navigate easily anywhere', price: 100, icon: 'MapPin' },
  { id: 'holder', label: 'Mobile Holder', description: 'Secure your phone while driving', price: 50, icon: 'Car' },
  { id: 'fastag', label: 'FASTag', description: 'Seamless toll payments', price: 100, icon: 'Tag' },
  { id: 'snow', label: 'Snow Chains', description: 'Better grip on snowy roads', price: 300, icon: 'Shield' },
  { id: 'umbrella', label: 'Umbrella', description: 'Be prepared for unexpected rain', price: 50, icon: 'Shield' },
].map((item) => ({ ...item, active: true }));

// Bikes cannot take a roof carrier or a chauffeur.
const BIKE_EXCLUDED = new Set(['driver', 'roof', 'child', 'snow']);

const run = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');

  // Must match the server's database, which pins dbName explicitly - without
  // it the driver silently uses the URI's default db ("test").
  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB_NAME || 'appzeto_taxi' });
  const { RentalVehicleType } = await import('../src/modules/taxi/admin/models/RentalVehicleType.js');

  const vehicles = await RentalVehicleType.find({}).select('_id name vehicleCategory addOns advancePayment');
  let seeded = 0;
  let skipped = 0;

  for (const vehicle of vehicles) {
    if (Array.isArray(vehicle.addOns) && vehicle.addOns.length) {
      skipped += 1;
      continue;
    }

    const isBike = String(vehicle.vehicleCategory || '').toLowerCase() === 'bike';
    vehicle.addOns = DEFAULT_ADD_ONS.filter((item) => !(isBike && BIKE_EXCLUDED.has(item.id)));

    // A vehicle with advance payment switched off asks for the full amount up
    // front, which is not what these listings intend - default to 20%.
    if (!vehicle.advancePayment?.enabled) {
      vehicle.advancePayment = {
        enabled: true,
        paymentMode: 'percentage',
        amount: 20,
        label: 'Advance booking payment',
        notes: 'Balance payable at pickup.',
      };
    }

    await vehicle.save();
    seeded += 1;
    console.log(`  ${vehicle.name} - ${vehicle.addOns.length} add-ons, 20% advance`);
  }

  console.log(`\nSeeded ${seeded} vehicles, skipped ${skipped} that already had add-ons.`);
  await mongoose.disconnect();
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
