/**
 * Seed script: enable the bus service and create popular bus routes.
 * Idempotent - matches on serviceNumber, so re-running updates instead of duplicating.
 * Usage: node scripts/seedBusRoutes.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BusService } from '../src/modules/taxi/admin/models/BusService.js';
import { AdminBusinessSetting } from '../src/modules/taxi/admin/models/AdminBusinessSetting.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGODB_URI;
const MONGO_DB = process.env.MONGODB_DB_NAME || 'appzeto_taxi';

if (!MONGO_URI) {
  console.error('❌  MONGODB_URI is not set in .env');
  process.exit(1);
}

const AISLE = { kind: 'aisle', id: '', label: '', variant: 'seat', status: 'available' };

// 2+2 seater, 10 rows -> 40 seats. Aisle sits between the pairs.
const buildSeaterDeck = (rows = 10) =>
  Array.from({ length: rows }, (_, rowIndex) =>
    ['A', 'B', 'aisle', 'C', 'D'].map((slot) => {
      if (slot === 'aisle') return { ...AISLE };
      const label = `${rowIndex + 1}${slot}`;
      return {
        kind: 'seat',
        id: label,
        label,
        variant: slot === 'A' || slot === 'D' ? 'window' : 'aisle',
        status: 'available',
      };
    }),
  );

// 2+1 sleeper berths, 6 rows per deck -> 18 berths a deck, 36 total.
const buildSleeperDeck = (rows = 6, prefix = 'L') =>
  Array.from({ length: rows }, (_, rowIndex) =>
    ['A', 'B', 'aisle', 'C'].map((slot) => {
      if (slot === 'aisle') return { ...AISLE };
      const label = `${prefix}${rowIndex + 1}${slot}`;
      return {
        kind: 'seat',
        id: label,
        label,
        variant: 'sleeper',
        status: 'available',
      };
    }),
  );

const isSleeper = (item) => String(item.busCategory || '').toLowerCase() === 'sleeper';

// Exterior shot varies per bus; interiors are shared across the fleet.
const EXTERIOR_IMAGES = [
  '/taxi09_bus_hero_city.png',
  '/taxi09_bus_hero_night.png',
  '/taxi09_bus_hero_hills.png',
];

const INTERIOR_IMAGES = [
  '/taxi09_bus_interior_1.jpg',
  '/taxi09_bus_interior_2.jpg',
  '/taxi09_bus_interior_3.jpg',
];

const CANCELLATION_RULES = [
  { id: 'gt-24h', label: 'More than 24 hours before departure', hoursBeforeDeparture: 24, refundType: 'percentage', refundValue: 90, notes: '10% deducted' },
  { id: 'gt-12h', label: '12-24 hours before departure', hoursBeforeDeparture: 12, refundType: 'percentage', refundValue: 50, notes: '50% deducted' },
  { id: 'lt-12h', label: 'Less than 12 hours before departure', hoursBeforeDeparture: 0, refundType: 'none', refundValue: 0, notes: 'No refund' },
];

// Each corridor carries several competing operators so the results list has
// something to sort and filter.
const CORRIDORS = [
  {
    key: 'IDR-BPL',
    route: { routeName: 'Indore - Bhopal Express', originCity: 'Indore, MP', destinationCity: 'Bhopal, MP', distanceKm: '195', durationHours: '4h 00m' },
    operators: [
      { operatorName: 'Taxi09 Travels', busName: 'Taxi09 Express', coachType: 'AC Seater', busCategory: 'Seater', seatPrice: 699, rating: 4.5, ratingCount: 214, schedules: [{ departureTime: '06:30', arrivalTime: '10:30', label: 'Morning' }, { departureTime: '17:00', arrivalTime: '21:00', label: 'Evening' }] },
      { operatorName: 'Zingbus Plus', busName: 'Volvo Multi Axle', coachType: 'AC Sleeper', busCategory: 'Sleeper', seatPrice: 899, rating: 4.6, ratingCount: 892, schedules: [{ departureTime: '21:00', arrivalTime: '01:15', label: 'Night' }] },
      { operatorName: 'Intercity SmartBus', busName: 'SmartBus 2+1', coachType: 'AC Sleeper', busCategory: 'Sleeper', seatPrice: 799, rating: 4.4, ratingCount: 641, schedules: [{ departureTime: '22:00', arrivalTime: '02:20', label: 'Night' }] },
      { operatorName: 'City Travels', busName: 'Scania Seater', coachType: 'AC Seater', busCategory: 'Seater', seatPrice: 749, rating: 4.2, ratingCount: 318, schedules: [{ departureTime: '23:00', arrivalTime: '03:45', label: 'Late Night' }] },
      { operatorName: 'Jai Mahakal Travels', busName: 'Mahakal Deluxe', coachType: 'Non AC Sleeper', busCategory: 'Sleeper', seatPrice: 649, rating: 4.3, ratingCount: 205, schedules: [{ departureTime: '23:30', arrivalTime: '04:15', label: 'Late Night' }] },
    ],
  },
  {
    key: 'IDR-UJN',
    route: { routeName: 'Indore - Ujjain Shuttle', originCity: 'Indore, MP', destinationCity: 'Ujjain, MP', distanceKm: '55', durationHours: '1h 30m' },
    operators: [
      { operatorName: 'Taxi09 Travels', busName: 'Taxi09 Mahakal', coachType: 'AC Seater', busCategory: 'Seater', seatPrice: 599, rating: 4.5, ratingCount: 176, schedules: [{ departureTime: '07:00', arrivalTime: '08:30', label: 'Morning' }, { departureTime: '14:00', arrivalTime: '15:30', label: 'Afternoon' }] },
      { operatorName: 'Simhastha Express', busName: 'Shipra Shuttle', coachType: 'AC Seater', busCategory: 'Seater', seatPrice: 449, rating: 4.1, ratingCount: 402, schedules: [{ departureTime: '09:30', arrivalTime: '11:00', label: 'Morning' }, { departureTime: '18:30', arrivalTime: '20:00', label: 'Evening' }] },
      { operatorName: 'City Travels', busName: 'Ujjain Rapid', coachType: 'Non AC Seater', busCategory: 'Seater', seatPrice: 299, rating: 3.9, ratingCount: 148, schedules: [{ departureTime: '06:00', arrivalTime: '07:45', label: 'Early' }] },
    ],
  },
  {
    key: 'BPL-JBP',
    route: { routeName: 'Bhopal - Jabalpur Night Rider', originCity: 'Bhopal, MP', destinationCity: 'Jabalpur, MP', distanceKm: '312', durationHours: '6h 30m' },
    operators: [
      { operatorName: 'Taxi09 Travels', busName: 'Taxi09 Narmada', coachType: 'AC Sleeper', busCategory: 'Sleeper', seatPrice: 799, rating: 4.5, ratingCount: 233, schedules: [{ departureTime: '22:30', arrivalTime: '05:00', label: 'Night' }] },
      { operatorName: 'Narmada Travels', busName: 'Narmada Volvo', coachType: 'AC Sleeper', busCategory: 'Sleeper', seatPrice: 949, rating: 4.4, ratingCount: 511, schedules: [{ departureTime: '21:30', arrivalTime: '04:15', label: 'Night' }] },
      { operatorName: 'Intercity SmartBus', busName: 'SmartBus 2+1', coachType: 'AC Seater', busCategory: 'Seater', seatPrice: 699, rating: 4.2, ratingCount: 287, schedules: [{ departureTime: '08:00', arrivalTime: '14:45', label: 'Day' }] },
    ],
  },
  {
    key: 'IDR-KOT',
    route: { routeName: 'Indore - Kota Highway', originCity: 'Indore, MP', destinationCity: 'Kota, RJ', distanceKm: '330', durationHours: '7h 00m' },
    operators: [
      { operatorName: 'Taxi09 Travels', busName: 'Taxi09 Chambal', coachType: 'AC Sleeper', busCategory: 'Sleeper', seatPrice: 999, rating: 4.5, ratingCount: 129, schedules: [{ departureTime: '21:00', arrivalTime: '04:00', label: 'Night' }] },
      { operatorName: 'Chambal Roadlines', busName: 'Chambal Express', coachType: 'AC Seater', busCategory: 'Seater', seatPrice: 849, rating: 4.0, ratingCount: 96, schedules: [{ departureTime: '22:15', arrivalTime: '05:30', label: 'Night' }] },
      { operatorName: 'Rajasthan Travels', busName: 'Kota Deluxe', coachType: 'Non AC Sleeper', busCategory: 'Sleeper', seatPrice: 699, rating: 3.8, ratingCount: 74, schedules: [{ departureTime: '20:00', arrivalTime: '03:30', label: 'Night' }] },
    ],
  },
];

// Flatten corridors into one BusService per operator.
const ROUTES = CORRIDORS.flatMap((corridor) =>
  corridor.operators.map((operator, index) => {
    const suffix = String(index + 1).padStart(2, '0');
    return {
      ...operator,
      serviceNumber: `T09-${corridor.key}-${suffix}`,
      registrationNumber: `MP09 ${corridor.key.slice(0, 2)} ${1000 + index}`,
      route: corridor.route,
      coverImage: EXTERIOR_IMAGES[index % EXTERIOR_IMAGES.length],
      galleryImages: [EXTERIOR_IMAGES[index % EXTERIOR_IMAGES.length], ...INTERIOR_IMAGES],
      schedules: operator.schedules.map((schedule, scheduleIndex) => ({
        ...schedule,
        id: `sch-${corridor.key}-${suffix}-${scheduleIndex + 1}`.toLowerCase(),
      })),
    };
  }),
);

const buildDoc = (item) => ({
  operatorName: item.operatorName,
  busName: item.busName,
  serviceNumber: item.serviceNumber,
  coachType: item.coachType,
  busCategory: item.busCategory,
  registrationNumber: item.registrationNumber,
  busColor: '#f5b700',
  image: item.coverImage,
  coverImage: item.coverImage,
  galleryImages: item.galleryImages,
  seatPrice: item.seatPrice,
  fareCurrency: 'INR',
  variantPricing: {
    seat: item.seatPrice,
    window: item.seatPrice + 50,
    aisle: item.seatPrice,
    sleeper: item.seatPrice + 100,
  },
  status: 'active',
  rating: item.rating ?? 4.3,
  ratingCount: item.ratingCount ?? 100,
  amenities: ['Water Bottle', 'Charging Point', 'Blanket', 'Reading Light', 'GPS Tracking'],
  boardingPolicy: 'Please reach the boarding point 15 minutes before departure.',
  cancellationPolicy: 'Free cancellation up to 24 hours before departure.',
  cancellationRules: CANCELLATION_RULES,
  luggagePolicy: 'One suitcase and one handbag per passenger.',
  blueprint: isSleeper(item)
    ? {
        templateKey: 'sleeper_2_1',
        layoutConfig: {
          lower: { enabled: true, rows: 6, leftSeats: 2, rightSeats: 1, seatType: 'sleeper' },
          upper: { enabled: true, rows: 6, leftSeats: 2, rightSeats: 1, seatType: 'sleeper' },
        },
        lowerDeck: buildSleeperDeck(6, 'L'),
        upperDeck: buildSleeperDeck(6, 'U'),
      }
    : {
        templateKey: 'seater_2_2',
        layoutConfig: {
          lower: { enabled: true, rows: 10, leftSeats: 2, rightSeats: 2, seatType: 'seat' },
          upper: { enabled: false, rows: 0, leftSeats: 0, rightSeats: 0, seatType: 'seat' },
        },
        lowerDeck: buildSeaterDeck(10),
        upperDeck: [],
      },
  route: {
    ...item.route,
    stops: [
      { id: `${item.serviceNumber}-p1`, city: item.route.originCity, pointName: `${item.route.originCity.split(',')[0]} Bus Stand`, stopType: 'pickup', departureTime: item.schedules[0].departureTime },
      { id: `${item.serviceNumber}-d1`, city: item.route.destinationCity, pointName: `${item.route.destinationCity.split(',')[0]} Bus Stand`, stopType: 'drop', arrivalTime: item.schedules[0].arrivalTime },
    ],
  },
  // activeDays empty => schedule runs every day (see isScheduleAvailableOnDate)
  schedules: item.schedules.map((schedule) => ({ ...schedule, activeDays: [], status: 'active' })),
});

const run = async () => {
  await mongoose.connect(MONGO_URI, { dbName: MONGO_DB });

  const settings = await AdminBusinessSetting.findOneAndUpdate(
    { scope: 'default' },
    { $set: { 'transport_ride.enable_bus_service': '1' } },
    { upsert: true, new: true },
  );
  console.log(`✅ bus service enabled (enable_bus_service = ${settings.transport_ride?.enable_bus_service})`);

  for (const item of ROUTES) {
    const result = await BusService.updateOne(
      { serviceNumber: item.serviceNumber },
      { $set: buildDoc(item) },
      { upsert: true },
    );
    const action = result.upsertedCount ? '✅ created' : '♻️  updated';
    console.log(`${action}: ${item.route.originCity} -> ${item.route.destinationCity} (Rs${item.seatPrice})`);
  }

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('❌  Seed failed:', err);
  process.exit(1);
});
