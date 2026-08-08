/**
 * Adds map coordinates to the demo hotels so search can work by proximity.
 *
 * Each value is the real position of the area the hotel sits in (Connaught
 * Place, Candolim Beach and so on), not an invented point.
 *
 *   node scripts/seedHotelCoordinates.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// slug -> [latitude, longitude] of the stated area
const COORDS = {
  'the-grand-orion': [28.6315, 77.2167],          // Connaught Place, New Delhi
  'hotel-sapphire-inn': [17.4126, 78.4392],       // Banjara Hills, Hyderabad
  'palm-vista-resort': [15.5180, 73.7626],        // Candolim Beach, Goa
  'heritage-lake-palace': [24.5760, 73.6800],     // Lake Pichola, Udaipur
  'marine-bay-suites': [18.9220, 72.8332],        // Colaba, Mumbai
  'the-imperial-courtyard': [28.6519, 77.1909],   // Karol Bagh, Delhi
  'saffron-business-suites': [28.5533, 77.1216],  // Aerocity, New Delhi
  'coral-cove-beach-villas': [15.5736, 73.7407],  // Anjuna, North Goa
  'pink-city-haveli': [26.9239, 75.8267],         // Hawa Mahal, Jaipur
  'harbour-view-residency': [19.0596, 72.8295],   // Bandra West, Mumbai
  'deccan-grand-hyderabad': [17.4401, 78.3489],   // Gachibowli, Hyderabad
  'aravalli-hill-retreat': [24.5926, 73.6784],    // Fateh Sagar, Udaipur
};

const run = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');

  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB_NAME || 'appzeto_taxi' });
  const { Hotel } = await import('../src/modules/taxi/admin/content/models/Hotel.js');

  let updated = 0;
  let missing = 0;

  for (const [slug, [latitude, longitude]] of Object.entries(COORDS)) {
    const result = await Hotel.updateOne(
      { slug },
      {
        $set: {
          latitude,
          longitude,
          // GeoJSON is [lng, lat] - the reverse of how it reads above.
          location: { type: 'Point', coordinates: [longitude, latitude] },
        },
      },
    );
    result.matchedCount ? (updated += 1) : (missing += 1);
    console.log(`  ${slug.padEnd(26)} ${latitude}, ${longitude}${result.matchedCount ? '' : '  (no such hotel)'}`);
  }

  // The index has to exist before $near will run.
  await Hotel.syncIndexes();

  console.log(`\n${updated} hotel(s) positioned, ${missing} slug(s) not found. 2dsphere index synced.`);
  await mongoose.disconnect();
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
