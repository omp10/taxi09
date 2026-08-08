/**
 * Seeds the travel story feed.
 *
 * Coordinates are the real positions of each place, so the map panel and the
 * "top destinations" aggregation show something truthful. Re-running updates
 * by slug rather than duplicating.
 *
 *   node scripts/seedTravelStories.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const IMG = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=70`;

const STORIES = [
  {
    slug: 'manali-to-leh-the-road-of-dreams',
    title: 'Manali to Leh – The Road of Dreams',
    category: 'Road Trip',
    location: 'Manali', state: 'Himachal Pradesh', latitude: 32.2432, longitude: 77.1892,
    days: 7, distanceKm: 650, cost: 21500, readMinutes: 8,
    authorName: 'Rohan Mehta', authorVerified: true,
    hashtags: ['RoadTrip', 'HimalayanDiaries', 'TravelWithTaxi09'],
    coverImage: IMG('1506905925346-21bda4d32df4'),
    excerpt: 'Five mountain passes, one unforgettable week, and a road that keeps climbing.',
    featured: true,
  },
  {
    slug: 'spiti-valley-adventure-like-never-before',
    title: 'Spiti Valley Adventure Like Never Before',
    category: 'Adventure',
    location: 'Spiti Valley', state: 'Himachal Pradesh', latitude: 32.2464, longitude: 78.0349,
    days: 5, distanceKm: 320, cost: 18900, readMinutes: 6,
    authorName: 'Ananya Singh', authorVerified: true,
    hashtags: ['HimalayanDiaries', 'HiddenGems'],
    coverImage: IMG('1464822759023-fed622ff2c3b'),
    excerpt: 'Cold desert, monasteries above the clouds, and the quietest nights I have known.',
    featured: true,
  },
  {
    slug: 'gokarna-beach-escape-a-perfect-getaway',
    title: 'Gokarna Beach Escape – A Perfect Getaway',
    category: 'Beach',
    location: 'Gokarna', state: 'Karnataka', latitude: 14.5479, longitude: 74.3188,
    days: 3, distanceKm: 180, cost: 8400, readMinutes: 5,
    authorName: 'Vivek Rao', authorVerified: true,
    hashtags: ['WeekendGetaway', 'HiddenGems'],
    coverImage: IMG('1507525428034-b723cf961d3e'),
    excerpt: 'Five beaches, one cliff walk, and sunsets worth the overnight bus.',
  },
  {
    slug: 'kedarnath-yatra-a-spiritual-journey',
    title: 'Kedarnath Yatra – A Spiritual Journey',
    category: 'Pilgrimage',
    location: 'Kedarnath', state: 'Uttarakhand', latitude: 30.7346, longitude: 79.0669,
    days: 6, distanceKm: 240, cost: 12300, readMinutes: 7,
    authorName: 'Priya Nair', authorVerified: true,
    hashtags: ['Pilgrimage', 'HimalayanDiaries'],
    coverImage: IMG('1571536802807-30451e3955d8'),
    excerpt: 'Sixteen kilometres uphill, and a silence at the top that stays with you.',
  },
  {
    slug: 'coorg-on-two-wheels-pure-bliss',
    title: 'Coorg on Two Wheels – Pure Bliss',
    category: 'Bike Ride',
    location: 'Coorg', state: 'Karnataka', latitude: 12.3375, longitude: 75.8069,
    days: 4, distanceKm: 250, cost: 6700, readMinutes: 6,
    authorName: 'Arjun Verma', authorVerified: true,
    hashtags: ['RoadTrip', 'WeekendGetaway'],
    coverImage: IMG('1558981806-ec527fa84c39'),
    excerpt: 'Coffee estates, wet tarmac and a bike that finally felt like it belonged.',
  },
  {
    slug: 'old-delhi-food-walk-a-foodies-paradise',
    title: "Old Delhi Food Walk – A Foodie's Paradise",
    category: 'Food Journey',
    location: 'Old Delhi', state: 'Delhi', latitude: 28.6562, longitude: 77.2410,
    days: 2, distanceKm: 40, cost: 2800, readMinutes: 4,
    authorName: 'Megha Kapoor', authorVerified: true,
    hashtags: ['FoodTrail', 'HiddenGems'],
    coverImage: IMG('1601050690597-df0568f70950'),
    excerpt: 'Twelve stops between Chandni Chowk and Jama Masjid, and no regrets.',
  },
  {
    slug: 'camping-under-the-stars-tosh-experience',
    title: 'Camping Under the Stars – Tosh Experience',
    category: 'Camping',
    location: 'Tosh', state: 'Himachal Pradesh', latitude: 32.0997, longitude: 77.3450,
    days: 3, distanceKm: 120, cost: 4600, readMinutes: 5,
    authorName: 'Dev Sharma', authorVerified: true,
    hashtags: ['HimalayanDiaries', 'WeekendGetaway'],
    coverImage: IMG('1504280390367-361c6d9f38f4'),
    excerpt: 'A tent, a bonfire, and the clearest sky I have ever slept under.',
  },
  {
    slug: 'ziro-valley-a-photographers-heaven',
    title: "Ziro Valley – A Photographer's Heaven",
    category: 'Photography',
    location: 'Ziro Valley', state: 'Arunachal Pradesh', latitude: 27.5992, longitude: 93.8375,
    days: 4, distanceKm: 300, cost: 9200, readMinutes: 5,
    authorName: 'Karan Shah', authorVerified: true,
    hashtags: ['HiddenGems', 'TravelWithTaxi09'],
    coverImage: IMG('1470071459604-3b5ec3a7fe05'),
    excerpt: 'Rice fields, pine ridges and the Apatani valley in early morning fog.',
  },
];

const run = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');

  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB_NAME || 'appzeto_taxi' });
  const { TravelStory } = await import('../src/modules/taxi/admin/content/models/TravelStory.js');

  for (const story of STORIES) {
    const payload = {
      ...story,
      status: 'published',
      gallery: [story.coverImage],
      body: `${story.excerpt}\n\nA full write-up of the trip, day by day.`,
    };

    const existing = await TravelStory.findOne({ slug: story.slug });
    if (existing) {
      // Engagement counts belong to readers, so seeding must not reset them.
      const { likes, views, comments, ...editable } = payload;
      Object.assign(existing, editable);
      await existing.save();
      console.log(`updated  ${story.title}`);
    } else {
      await TravelStory.create(payload);
      console.log(`created  ${story.title}`);
    }
  }

  console.log(`\n${await TravelStory.countDocuments({ status: 'published' })} published stories`);
  await mongoose.disconnect();
};

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
