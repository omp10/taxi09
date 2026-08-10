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

const run = async () => {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI, { dbName: MONGO_DB });
  console.log('Connected to MongoDB');

  const bannerUrl = `${FRONTEND_ORIGIN}/taxi09_internship_banner.png`;

  console.log('Upserting internship banner...');
  const bannerData = {
    title: 'Taxi09 Travel Academy Internship Program',
    image: bannerUrl,
    desktopImage: bannerUrl,
    type: 'internship',
    link_type: 'deep_link',
    deep_link: '/taxi/user/internship',
    redirect_url: '/taxi/user/internship',
    active: true,
  };

  const existing = await Banner.findOne({ type: 'internship' });
  if (existing) {
    Object.assign(existing, bannerData);
    await existing.save();
    console.log('Updated existing internship banner');
  } else {
    await Banner.create(bannerData);
    console.log('Created new internship banner');
  }

  console.log('Seeding successfully completed');
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
