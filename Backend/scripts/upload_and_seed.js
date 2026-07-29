import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
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

const run = async () => {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI, { dbName: MONGO_DB });
  console.log('Connected to MongoDB');

  const topPath = path.resolve(__dirname, '../../frontend/public/taxi09_home_top_banner.png');
  const bottomPath = path.resolve(__dirname, '../../frontend/public/taxi09_home_bottom_banner.png');

  if (!fs.existsSync(topPath) || !fs.existsSync(bottomPath)) {
    throw new Error(`Missing generated banner files. Expected ${topPath} and ${bottomPath}`);
  }

  const topBannerUrl = `${FRONTEND_ORIGIN}/taxi09_home_top_banner.png`;
  const bottomBannerUrl = `${FRONTEND_ORIGIN}/taxi09_home_bottom_banner.png`;

  console.log('Cleaning up existing banners from database...');
  await Banner.deleteMany({});
  console.log('Banners cleared');

  const banners = [
    {
      title: 'Get 10% Off On All Bookings 1',
      image: topBannerUrl,
      type: 'top',
      link_type: 'deep_link',
      deep_link: '/taxi/user/ride/select-location',
      redirect_url: '/taxi/user/ride/select-location',
      active: true,
    },
    {
      title: 'Get 10% Off On All Bookings 2',
      image: topBannerUrl,
      type: 'top',
      link_type: 'deep_link',
      deep_link: '/taxi/user/ride/select-location',
      redirect_url: '/taxi/user/ride/select-location',
      active: true,
    },
    {
      title: 'Get 10% Off On All Bookings 3',
      image: topBannerUrl,
      type: 'top',
      link_type: 'deep_link',
      deep_link: '/taxi/user/ride/select-location',
      redirect_url: '/taxi/user/ride/select-location',
      active: true,
    },
    {
      title: 'Get 10% Off On All Bookings 4',
      image: topBannerUrl,
      type: 'top',
      link_type: 'deep_link',
      deep_link: '/taxi/user/ride/select-location',
      redirect_url: '/taxi/user/ride/select-location',
      active: true,
    },
    {
      title: 'Travel Packages - Explore Incredible Places',
      image: bottomBannerUrl,
      type: 'bottom',
      link_type: 'deep_link',
      deep_link: '/taxi/user/cab/spiritual',
      redirect_url: '/taxi/user/cab/spiritual',
      active: true,
    },
  ];

  console.log('Inserting redesigned banners...');
  for (const banner of banners) {
    await Banner.create(banner);
    console.log(`Seeded banner: [${banner.type}] ${banner.title}`);
  }

  console.log('Seeding successfully completed');
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
