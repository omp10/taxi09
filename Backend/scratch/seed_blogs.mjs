/**
 * Seed a few blog posts and give the roster drivers a line of their own.
 * Reads the connection string from Backend/.env - no credentials in here.
 *
 *   node scratch/seed_blogs.mjs
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { Blog } from '../src/modules/taxi/admin/content/models/Blog.js';
import { HireDriver } from '../src/modules/taxi/admin/content/models/HireDriver.js';

const IMG = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=70`;

const posts = [
  {
    slug: 'weekend-drives-from-indore',
    title: 'Five weekend drives from Indore you can finish by Sunday night',
    excerpt: 'Mandu, Maheshwar, Omkareshwar and two more - with the road you actually want to take.',
    category: 'Travel',
    author: 'Taxi09 Team',
    coverImage: IMG('1469854523086-cc02fe5d8800'),
    tags: ['indore', 'weekend', 'road trip'],
    featured: true,
    content:
      'Indore sits within three hours of more forts, rivers and ghats than most people realise. Here are five drives you can leave for on Saturday morning and still be home for Sunday dinner.\n\n' +
      'Mandu is the obvious first pick. Ninety kilometres on the Mhow road, then a climb through the Vindhyas that turns green the moment the monsoon starts. Go for Jahaz Mahal at sunset, stay the night, and drive back after breakfast.\n\n' +
      'Maheshwar is the quieter one. The ghats on the Narmada are best at first light, so leave Indore by five if you want the river to yourself. The road is good the whole way.\n\n' +
      'Omkareshwar works if you want a temple town without the crowd of Ujjain. Two hours out, and the island walk takes another two.\n\n' +
      'Patalpani and Tincha falls are the short ones - under an hour, and worth it between July and October when there is actually water. Park where the road ends and walk the last stretch.\n\n' +
      'Hanuwantiya is the long one at four hours, but the backwaters at the end make it the trip people repeat. Take a hatchback if it is just two of you; take an SUV if the boot has to carry a tent.',
  },
  {
    slug: 'self-drive-checklist',
    title: 'What to check before you drive off in a self drive car',
    excerpt: 'Two minutes at handover saves an argument at return. Here is the list.',
    category: 'Self Drive',
    author: 'Taxi09 Team',
    coverImage: IMG('1449965408869-eaa3f722e40d'),
    tags: ['self drive', 'checklist'],
    content:
      'Every self drive booking ends the same way it starts: with a walk around the car. Do it properly and the return is a formality.\n\n' +
      'Photograph all four corners, both bumpers and the roof before you get in. Our app asks for the odometer photo anyway, so add the body shots while you are there.\n\n' +
      'Check the fuel gauge against the paperwork. You return the car at the level you took it - nothing more.\n\n' +
      'Open the boot. The spare, the jack and the toolkit should all be there, and it is far easier to say so now than at eleven at night on a highway.\n\n' +
      'Test the air conditioning, the wipers and the headlights before you leave the lot. Sit in the seat, set the mirrors, and only then start the trip on the app.',
  },
  {
    slug: 'monthly-driver-vs-daily',
    title: 'Hiring a driver monthly or by the day - which one actually costs less',
    excerpt: 'The break-even is lower than most people expect, and it is not about distance.',
    category: 'Hire a Driver',
    author: 'Taxi09 Team',
    coverImage: IMG('1502877338535-766e1452684a'),
    tags: ['hire driver', 'pricing'],
    content:
      'Daily hire looks cheaper until you count the days. The question is not how far you drive, it is how many days a month you need someone behind the wheel.\n\n' +
      'A daily booking suits airport runs, weddings and the odd outstation trip. You pay for the day and you are done.\n\n' +
      'Monthly makes sense the moment you need a driver more than twelve days a month, or every weekday for an office commute. The same driver learns your route and your timings, which is worth more than the rate difference.\n\n' +
      'Hourly sits in between and is the one most people underuse. If you need four hours on a Tuesday afternoon, book four hours.',
  },
  {
    slug: 'first-time-renter-guide',
    title: 'Renting a car for the first time? Start here',
    excerpt: 'Documents, deposit, fuel policy and the kilometre limit, explained once.',
    category: 'Guides',
    author: 'Taxi09 Team',
    coverImage: IMG('1503376780353-7e6692767b70'),
    tags: ['rental', 'guide', 'beginner'],
    content:
      'Four things decide what a rental costs you, and all four are visible before you pay.\n\n' +
      'Documents: a valid driving licence held for at least a year, plus one photo ID. Bring the originals to the store.\n\n' +
      'Deposit: refundable, held against damage and fines, and returned after the car is checked back in. It is shown in your total before payment, not sprung on you at the counter.\n\n' +
      'Fuel: you take the car at a level and return it at the same level. Nobody profits from the tank.\n\n' +
      'Kilometres: every plan includes a limit and a per kilometre rate beyond it. If you are driving to Bhopal and back in a day, pick the higher limit up front - it is cheaper than the excess.',
  },
  {
    slug: 'why-we-photograph-the-odometer',
    title: 'Why we photograph the odometer at pickup and drop',
    excerpt: 'It is thirty seconds of work that settles every kilometre dispute before it starts.',
    category: 'Behind the scenes',
    author: 'Taxi09 Team',
    coverImage: IMG('1517672651691-24622a91b550'),
    tags: ['policy', 'trust'],
    content:
      'Both the customer and the driver photograph the odometer, and neither trip starts until both are in.\n\n' +
      'The reason is simple. Kilometre charges are the single most argued line on any rental bill, and an argument about a number nobody wrote down has no ending.\n\n' +
      'Two photographs with two timestamps mean the reading at pickup and the reading at drop are facts, not opinions. The bill is then just arithmetic, and it is the same arithmetic for everyone.',
  },
];

const driverLines = [
  'I have driven in Indore for eight years. Ask me for a shortcut and I will already be on it.',
  'Airport runs before sunrise are my favourite. Empty roads and a customer who reaches the gate early.',
  'I keep water and a phone charger in the back. Small things, but people remember them.',
  'Twelve years without a claim. I would rather reach five minutes late than take a risk on the highway.',
  'I speak Hindi, English and Marathi, so outstation trips are never quiet.',
  'My car is cleaned every morning before the first booking. That is not negotiable for me.',
];

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI, {
    dbName: process.env.MONGODB_DB_NAME || 'appzeto_taxi',
  });

  for (const post of posts) {
    const words = post.content.split(/\s+/).filter(Boolean).length;
    await Blog.findOneAndUpdate(
      { slug: post.slug },
      { ...post, status: 'published', readMinutes: Math.max(1, Math.round(words / 200)), publishedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }
  console.log(`blogs: ${await Blog.countDocuments({ status: 'published' })} published`);

  const drivers = await HireDriver.find({}).sort({ sortOrder: 1, createdAt: 1 });
  let filled = 0;
  for (const [index, driver] of drivers.entries()) {
    if (String(driver.about || '').trim()) continue;
    driver.about = driverLines[index % driverLines.length];
    await driver.save();
    filled += 1;
  }
  console.log(`drivers: ${filled} of ${drivers.length} given a line`);

  await mongoose.disconnect();
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
