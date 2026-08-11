/**
 * Add more drivers to the Hire Drivers roster.
 * Upserts by slug, so running it twice does not duplicate anyone.
 *
 *   node scratch/seed_more_drivers.mjs
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { HireDriver } from '../src/modules/taxi/admin/content/models/HireDriver.js';

const PHOTOS = [
  '/taxi09_driver_d1.jpg',
  '/taxi09_driver_d2.jpg',
  '/taxi09_driver_d3.jpg',
  '/taxi09_driver_p2.jpg',
  '/taxi09_driver_p3.jpg',
  '/taxi09_driver_p4.jpg',
];

const drivers = [
  {
    name: 'Deepak Chouhan', city: 'Indore', rating: 4.9, experience: '9+ Years', trips: '4100+',
    badge: 'Top Rated', languages: ['Hindi', 'English'], vehicleName: 'Maruti Ertiga', vehiclePlate: 'MP09 CD 4412',
    about: 'Nine years on the Indore-Bhopal highway. I know every stop worth taking and every one worth skipping.',
    monthlySalary: 24000, dailyRate: 1300, hourlyRate: 190, etaMinutes: 14, distanceKm: 4.1,
  },
  {
    name: 'Sunil Rathore', city: 'Indore', rating: 4.7, experience: '5+ Years', trips: '1900+',
    languages: ['Hindi', 'Marathi'], vehicleName: 'Hyundai Aura', vehiclePlate: 'MP09 EF 7781',
    about: 'Wedding season is my busiest time. Ten hours of waiting and I will still open the door with a smile.',
    monthlySalary: 20000, dailyRate: 1100, hourlyRate: 160, etaMinutes: 21, distanceKm: 7.4,
  },
  {
    name: 'Farhan Sheikh', city: 'Bhopal', rating: 4.8, experience: '7+ Years', trips: '2800+',
    languages: ['Hindi', 'English', 'Urdu'], vehicleName: 'Toyota Innova', vehiclePlate: 'MP04 GH 2290',
    about: 'I drive families to Ujjain and Omkareshwar most weekends. Children fall asleep in my car, which I take as a compliment.',
    monthlySalary: 23000, dailyRate: 1250, hourlyRate: 185, etaMinutes: 25, distanceKm: 9.2,
  },
  {
    name: 'Praveen Jadhav', city: 'Indore', rating: 4.6, experience: '4+ Years', trips: '1400+',
    languages: ['Hindi', 'Marathi'], vehicleName: 'Maruti Swift Dzire', vehiclePlate: 'MP09 IJ 5533',
    about: 'Early morning airport runs are mine. If your flight is at six, I am outside at four.',
    monthlySalary: 19000, dailyRate: 1000, hourlyRate: 150, etaMinutes: 16, distanceKm: 5.6,
  },
  {
    name: 'Manoj Patidar', city: 'Ujjain', rating: 4.9, experience: '11+ Years', trips: '5200+',
    badge: 'Most Trusted', languages: ['Hindi'], vehicleName: 'Mahindra Scorpio', vehiclePlate: 'MP13 KL 9087',
    about: 'Eleven years, not one claim. I would rather reach ten minutes late than take a chance on a wet road.',
    monthlySalary: 26000, dailyRate: 1450, hourlyRate: 210, etaMinutes: 28, distanceKm: 12.5,
  },
  {
    name: 'Arjun Nair', city: 'Indore', rating: 4.8, experience: '6+ Years', trips: '2300+',
    languages: ['Hindi', 'English', 'Malayalam'], vehicleName: 'Honda City', vehiclePlate: 'MP09 MN 3311',
    about: 'Corporate pickups all week. Clean car, ironed shirt, and I never make a client wait at reception.',
    monthlySalary: 22500, dailyRate: 1200, hourlyRate: 175, etaMinutes: 19, distanceKm: 6.8,
  },
  {
    name: 'Ravi Solanki', city: 'Dewas', rating: 4.7, experience: '8+ Years', trips: '3000+',
    languages: ['Hindi', 'English'], vehicleName: 'Maruti Ciaz', vehiclePlate: 'MP41 OP 6644',
    about: 'Long outstation trips suit me. Give me a route and I will plan the tea stops before we leave.',
    monthlySalary: 21500, dailyRate: 1150, hourlyRate: 170, etaMinutes: 32, distanceKm: 15.1,
  },
];

const slugify = (value) =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI, {
    dbName: process.env.MONGODB_DB_NAME || 'appzeto_taxi',
  });

  const existing = await HireDriver.countDocuments({});

  for (const [index, driver] of drivers.entries()) {
    await HireDriver.findOneAndUpdate(
      { slug: slugify(driver.name) },
      {
        $set: {
          ...driver,
          slug: slugify(driver.name),
          photo: PHOTOS[index % PHOTOS.length],
          hireTypes: ['permanent', 'monthly', 'outstation'],
          verified: true,
          available: true,
          active: true,
          sortOrder: existing + index + 1,
        },
      },
      { upsert: true, setDefaultsOnInsert: true },
    );
  }

  console.log(`drivers: ${existing} before, ${await HireDriver.countDocuments({ active: true })} active now`);
  await mongoose.disconnect();
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
