import mongoose from 'mongoose';
import { pathToFileURL } from 'node:url';
import { SharedTaxiTrip } from '../content/models/SharedTaxiTrip.js';

/**
 * Test departures for exercising the shared-taxi flow end to end.
 *
 * These are NOT sample content: a departure is live inventory, so anything
 * written here is genuinely bookable by a real customer and no driver will
 * turn up for it. Every row is prefixed with TEST so it is obvious in both the
 * admin list and the rider-facing screen, and the script can remove exactly
 * what it created:
 *
 *   node scripts/... seedSharedTaxiTestTrips.js            # create
 *   node scripts/... seedSharedTaxiTestTrips.js --remove   # delete them again
 *
 * Delete them once testing is done.
 */

const TEST_PREFIX = 'TEST';

const dayFromNow = (offset) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const SEAT_ROWS = ['A', 'B', 'C', 'D'];

/** `booked` marks seats as already taken so the seat map is not uniformly free. */
const seats = (count, booked = []) =>
  Array.from({ length: count }, (_, index) => {
    const label = `${SEAT_ROWS[Math.floor(index / 2)]}${(index % 2) + 1}`;
    return {
      label,
      status: booked.includes(label) ? 'booked' : 'available',
      bookingReference: booked.includes(label) ? `${TEST_PREFIX}-PREBOOKED` : '',
    };
  });

const TRIPS = [
  {
    fromLabel: `${TEST_PREFIX} - Indore (Vijay Nagar)`,
    toLabel: 'Bhopal (MP Nagar)',
    travelDate: dayFromNow(1),
    departure: '07:30 AM',
    duration: '3h 15m',
    pricePerSeat: 249,
    vehicleName: 'Toyota Innova',
    vehiclePlate: 'MP09 TE 0001',
    driverName: 'Test Driver One',
    rating: 4.8,
    seats: seats(8, ['A1', 'B2']),
    active: true,
  },
  {
    fromLabel: `${TEST_PREFIX} - Indore (Rajwada)`,
    toLabel: 'Ujjain (Mahakal)',
    travelDate: dayFromNow(1),
    departure: '09:00 AM',
    duration: '1h 10m',
    pricePerSeat: 119,
    vehicleName: 'Maruti Ertiga',
    vehiclePlate: 'MP09 TE 0002',
    driverName: 'Test Driver Two',
    rating: 4.6,
    seats: seats(6, ['A2']),
    active: true,
  },
  {
    fromLabel: `${TEST_PREFIX} - Indore (Palasia)`,
    toLabel: 'Dewas',
    travelDate: dayFromNow(2),
    departure: '11:30 AM',
    duration: '45m',
    pricePerSeat: 79,
    vehicleName: 'Swift Dzire',
    vehiclePlate: 'MP09 TE 0003',
    driverName: 'Test Driver Three',
    rating: 4.9,
    seats: seats(4),
    active: true,
  },
];

export const seedSharedTaxiTestTrips = async ({ remove = false } = {}) => {
  const filter = { fromLabel: { $regex: `^${TEST_PREFIX} - ` } };

  if (remove) {
    const result = await SharedTaxiTrip.deleteMany(filter);
    console.log(`Removed ${result.deletedCount} test departure(s).`);
    return true;
  }

  // Replaced rather than duplicated, so re-running does not fill the listing
  // with copies of the same test rows.
  await SharedTaxiTrip.deleteMany(filter);
  const created = await SharedTaxiTrip.insertMany(TRIPS);

  console.log(`Created ${created.length} TEST departure(s):`);
  created.forEach((trip) => {
    const free = trip.seats.filter((seat) => seat.status === 'available').length;
    console.log(`  ${trip.travelDate} ${trip.departure}  ${trip.fromLabel} -> ${trip.toLabel}  (${free}/${trip.seats.length} seats free)`);
  });
  console.log('\nThese are LIVE and bookable. Remove them with --remove when done.');

  return true;
};

export default seedSharedTaxiTestTrips;

// `npm run seed:shared-taxi-test` / `... -- --remove` from Backend/.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { connectDatabase } = await import('../../../../config/database.js');
  try {
    await connectDatabase();
    await seedSharedTaxiTestTrips({ remove: process.argv.includes('--remove') });
  } catch (error) {
    console.error('Failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}
