/**
 * Replace the homepage "How it works" videos with the one real video.
 * The placeholder clips were stand-ins seeded during build.
 *
 *   node scratch/set_home_video.mjs
 */
import 'dotenv/config';
import mongoose from 'mongoose';

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI, {
    dbName: process.env.MONGODB_DB_NAME || 'appzeto_taxi',
  });

  const blocks = mongoose.connection.db.collection('taxicontentblocks');
  const before = await blocks.findOne({ key: 'home.videos' });
  console.log('before:', JSON.stringify(before?.items?.map((i) => i.youtubeUrl)));

  const result = await blocks.updateOne(
    { key: 'home.videos' },
    {
      $set: {
        items: [
          {
            title: 'How Taxi09 works',
            youtubeUrl: 'https://youtu.be/xPXxxq5I-ww',
            caption: 'Book a car, pick it up, drive away - the whole thing end to end.',
          },
        ],
        updatedAt: new Date(),
      },
    },
  );
  console.log('matched', result.matchedCount, 'modified', result.modifiedCount);

  const after = await blocks.findOne({ key: 'home.videos' });
  console.log('after:', JSON.stringify(after?.items));

  await mongoose.disconnect();
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
