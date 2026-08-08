/**
 * Seeds the hotel extras that were previously priced in the mobile checkout
 * (breakfast per night, airport pickup) so they become admin-managed and are
 * charged by the server.
 *
 *   node scripts/seedHotelAddOns.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const DEFAULT_ADD_ONS = [
  { id: 'breakfast', label: 'Breakfast', price: 350, perNight: true, active: true },
  { id: 'pickup', label: 'Airport Pickup', price: 799, perNight: false, active: true },
  { id: 'late-checkout', label: 'Late Checkout', price: 500, perNight: false, active: true },
];

const run = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');

  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB_NAME || 'appzeto_taxi' });
  const { Hotel } = await import('../src/modules/taxi/admin/content/models/Hotel.js');

  const hotels = await Hotel.find({}).select('_id name addOns');
  let seeded = 0;
  let skipped = 0;

  for (const hotel of hotels) {
    if (Array.isArray(hotel.addOns) && hotel.addOns.length) {
      skipped += 1;
      continue;
    }
    hotel.addOns = DEFAULT_ADD_ONS;
    await hotel.save();
    seeded += 1;
    console.log(`  ${hotel.name} - ${hotel.addOns.length} extras`);
  }

  console.log(`\nSeeded ${seeded} hotels, skipped ${skipped} that already had extras.`);
  await mongoose.disconnect();
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
