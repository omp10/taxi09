/**
 * Seed script: insert homepage top/bottom banners (skips titles that already exist).
 * Usage: node scripts/seedBanners.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Banner } from '../src/modules/taxi/admin/promotions/models/Banner.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGODB_URI;
const MONGO_DB = process.env.MONGODB_DB_NAME || 'appzeto_taxi';
const FRONTEND_ORIGIN = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173').replace(/\/$/, '');

if (!MONGO_URI) {
  console.error('MONGODB_URI is not set in .env');
  process.exit(1);
}

const BANNERS = [
  {
    title: 'Get 10% Off On All Bookings',
    image: `${FRONTEND_ORIGIN}/taxi09_home_top_banner.png`,
    type: 'top',
    link_type: 'deep_link',
    deep_link: '/taxi/user/ride/select-location',
    redirect_url: '/taxi/user/ride/select-location',
    active: true,
  },
  {
    title: 'Yellow Taxi City Ride',
    image: `${FRONTEND_ORIGIN}/taxi09_home_top_banner.png`,
    type: 'top',
    link_type: 'deep_link',
    deep_link: '/taxi/user/ride/select-location',
    redirect_url: '/taxi/user/ride/select-location',
    active: true,
  },
  {
    title: 'Travel Packages - Explore Incredible Places',
    image: `${FRONTEND_ORIGIN}/taxi09_home_bottom_banner.png`,
    type: 'bottom',
    link_type: 'deep_link',
    deep_link: '/taxi/user/cab/spiritual',
    redirect_url: '/taxi/user/cab/spiritual',
    active: true,
  },
  {
    title: 'Spiritual Trips - Kedarnath & More',
    image: `${FRONTEND_ORIGIN}/taxi09_home_bottom_banner.png`,
    type: 'bottom',
    link_type: 'deep_link',
    deep_link: '/taxi/user/cab/spiritual',
    redirect_url: '/taxi/user/cab/spiritual',
    active: true,
  },
];

const run = async () => {
  await mongoose.connect(MONGO_URI, { dbName: MONGO_DB });
  for (const banner of BANNERS) {
    const result = await Banner.updateOne(
      { title: banner.title },
      { $setOnInsert: banner },
      { upsert: true },
    );
    console.log(`${result.upsertedCount ? 'created' : 'exists'}: [${banner.type}] ${banner.title}`);
  }
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
