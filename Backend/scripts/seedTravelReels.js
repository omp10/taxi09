/**
 * Seeds a handful of travel reels - stories told as short video.
 *
 * The clips are placeholders, not travel footage: they are here so the player
 * can actually be exercised end to end. Each URL was checked to return video
 * before being used - Google's gtv-videos-bucket samples, which are the usual
 * choice, now answer 403. Swap `videoUrl` for real footage when there is some;
 * nothing else has to change.
 *
 * Re-running updates by slug instead of duplicating, and leaves engagement
 * counts alone since those belong to readers.
 *
 *   node scripts/seedTravelReels.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MDN = (name) => `https://interactive-examples.mdn.mozilla.net/media/cc0-videos/${name}.mp4`;
const PIXABAY = 'https://cdn.pixabay.com/video/2020/09/08/49375-459436752_tiny.mp4';

/** Three verified clips, cycled - the point is playback, not the footage. */
const CLIPS = [MDN('flower'), PIXABAY, MDN('friday')];
const CLIP = (index) => CLIPS[index % CLIPS.length];
const IMG = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=70`;

const REELS = [
  {
    slug: 'sunrise-over-pangong-reel',
    title: 'Sunrise over Pangong in 40 seconds',
    category: 'Mountains',
    location: 'Pangong Tso', state: 'Ladakh', latitude: 33.7683, longitude: 78.6631,
    days: 2, distanceKm: 220, cost: 7800,
    authorName: 'Rohan Mehta', authorVerified: true,
    hashtags: ['HimalayanDiaries', 'RoadTrip'],
    coverImage: IMG('1506905925346-21bda4d32df4'),
    videoUrl: CLIP(0), durationSeconds: 40,
    excerpt: 'We waited three hours in the cold for this light. Worth every minute.',
  },
  {
    slug: 'riding-the-atal-tunnel-reel',
    title: 'Riding through the Atal Tunnel',
    category: 'Bike Ride',
    location: 'Manali', state: 'Himachal Pradesh', latitude: 32.2432, longitude: 77.1892,
    days: 1, distanceKm: 90, cost: 2400,
    authorName: 'Arjun Verma', authorVerified: true,
    hashtags: ['RoadTrip', 'TravelWithTaxi09'],
    coverImage: IMG('1558981806-ec527fa84c39'),
    videoUrl: CLIP(1), durationSeconds: 32,
    excerpt: 'Nine kilometres under the mountain, and summer on the other side.',
  },
  {
    slug: 'goa-shacks-after-dark-reel',
    title: 'Goa shacks after dark',
    category: 'Beach',
    location: 'Gokarna', state: 'Karnataka', latitude: 14.5479, longitude: 74.3188,
    days: 3, distanceKm: 60, cost: 3200,
    authorName: 'Vivek Rao', authorVerified: true,
    hashtags: ['WeekendGetaway', 'HiddenGems'],
    coverImage: IMG('1507525428034-b723cf961d3e'),
    videoUrl: CLIP(2), durationSeconds: 26,
    excerpt: 'The music starts at nine and the sea does the rest.',
  },
  {
    slug: 'old-delhi-in-one-take-reel',
    title: 'Old Delhi in one take',
    category: 'Food Journey',
    location: 'Old Delhi', state: 'Delhi', latitude: 28.6562, longitude: 77.2410,
    days: 1, distanceKm: 12, cost: 900,
    authorName: 'Megha Kapoor', authorVerified: true,
    hashtags: ['FoodTrail'],
    coverImage: IMG('1601050690597-df0568f70950'),
    videoUrl: CLIP(3), durationSeconds: 51,
    excerpt: 'Chandni Chowk to Jama Masjid without stopping the camera once.',
  },
  {
    slug: 'spiti-in-winter-reel',
    title: 'Spiti in winter is another planet',
    category: 'Adventure',
    location: 'Spiti Valley', state: 'Himachal Pradesh', latitude: 32.2464, longitude: 78.0349,
    days: 5, distanceKm: 340, cost: 19500,
    authorName: 'Ananya Singh', authorVerified: true,
    hashtags: ['HimalayanDiaries', 'HiddenGems'],
    coverImage: IMG('1464822759023-fed622ff2c3b'),
    videoUrl: CLIP(4), durationSeconds: 60,
    excerpt: 'Minus eighteen at night, and the clearest sky I have ever filmed.',
  },
];

const run = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');

  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB_NAME || 'appzeto_taxi' });
  const { TravelStory } = await import('../src/modules/taxi/admin/content/models/TravelStory.js');

  for (const reel of REELS) {
    const payload = {
      ...reel,
      status: 'published',
      readMinutes: 1,
      gallery: [reel.coverImage],
      body: `${reel.excerpt}\n\nShot on the trip, cut down to the bits worth watching.`,
    };

    const existing = await TravelStory.findOne({ slug: reel.slug });
    if (existing) {
      // Engagement belongs to readers, so seeding must not reset it.
      const { likes, views, comments, ...editable } = payload;
      Object.assign(existing, editable);
      await existing.save();
      console.log(`updated  ${reel.title}`);
    } else {
      await TravelStory.create(payload);
      console.log(`created  ${reel.title}`);
    }
  }

  const reels = await TravelStory.countDocuments({ status: 'published', videoUrl: { $nin: ['', null] } });
  const all = await TravelStory.countDocuments({ status: 'published' });
  console.log(`\n${reels} reels of ${all} published stories`);
  await mongoose.disconnect();
};

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
