import mongoose from 'mongoose';
import { pathToFileURL } from 'node:url';
import { ContentBlock } from '../content/models/ContentBlock.js';

/**
 * Seeds the admin-editable content behind the /cab flows.
 *
 * `cab.services` replaces a hardcoded array in CabHome. `cab.locations` is new:
 * the airport and pilgrimage flows need real drop coordinates to create a ride
 * at all, and previously had none. The coordinates below are the ones already
 * used elsewhere in this codebase (the coordsByPlace table in the with-driver
 * booking screen), so both flows agree on where these places are.
 *
 * Existing blocks are left untouched - re-running never overwrites admin edits.
 */
const BLOCKS = [
  {
    key: 'cab.services',
    label: 'Cab - service tiles',
    description: 'The service tiles on the /cab home screen.',
    items: [
      { id: 'shared', title: 'Shared Taxi', sub: 'Split fare with co-passengers' },
      { id: 'airport', title: 'Airport Cab', sub: 'On-time airport pickups and drops' },
      { id: 'spiritual', title: 'Spiritual Trip', sub: 'Temple and pilgrimage journeys' },
    ],
  },
  {
    key: 'cab.locations',
    label: 'Cab - known drop locations',
    description:
      'Coordinates for fixed destinations. lng/lat are required for a booking to be created, so an entry without them cannot be booked. The airport entry also carries its terminal list.',
    items: [
      {
        id: 'airport',
        label: 'Indore Airport',
        lng: 75.8011,
        lat: 22.7218,
        terminals: ['T1', 'T2', 'T3'],
      },
      { id: 'ujjain', label: 'Ujjain (Mahakaleshwar)', lng: 75.7849, lat: 23.1765 },
      { id: 'omkareshwar', label: 'Omkareshwar', lng: 76.1511, lat: 22.2444 },
      { id: 'bhopal', label: 'Bhopal', lng: 77.4126, lat: 23.2599 },
      { id: 'dewas', label: 'Dewas', lng: 76.0534, lat: 22.9676 },
      // The remaining pilgrimage destinations offered by spiritual.destinations.
      // These are approximate town-centre coordinates and should be checked
      // against the actual pickup point before the first live booking.
      { id: 'maheshwar', label: 'Maheshwar', lng: 75.5885, lat: 22.1766 },
      { id: 'amarkantak', label: 'Amarkantak', lng: 81.7550, lat: 22.6764 },
      { id: 'orchha', label: 'Orchha', lng: 78.6407, lat: 25.3518 },
      { id: 'pitambara', label: 'Pitambara Peeth (Datia)', lng: 78.4600, lat: 25.6660 },
    ],
  },
];

export const seedCabContent = async () => {
  console.log('Seeding cab content blocks...');

  let created = 0;
  let merged = 0;

  for (const block of BLOCKS) {
    const result = await ContentBlock.updateOne(
      { key: block.key },
      { $setOnInsert: { ...block, active: true } },
      { upsert: true },
    );

    if (result.upsertedCount) {
      created += 1;
      continue;
    }

    // The block already exists. For the location table, add any entry whose id
    // is missing - a new destination must reach it - but leave every existing
    // entry exactly as the admin left it.
    if (block.key !== 'cab.locations') continue;

    const existing = await ContentBlock.findOne({ key: block.key }).lean();
    const known = new Set((existing?.items || []).map((item) => String(item?.id || '')));
    const additions = block.items.filter((item) => !known.has(String(item.id)));

    if (additions.length) {
      await ContentBlock.updateOne(
        { key: block.key },
        { $push: { items: { $each: additions } } },
      );
      merged += additions.length;
    }
  }

  console.log(
    `Cab content blocks: ${created} created, ${BLOCKS.length - created} already present, ${merged} location(s) added`,
  );
  return true;
};

export default seedCabContent;

// Runnable on its own: `npm run seed:cab` from Backend/.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { connectDatabase } = await import('../../../../config/database.js');
  try {
    await connectDatabase();
    await seedCabContent();
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
