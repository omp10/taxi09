import mongoose from 'mongoose';

/**
 * A travel story - a trip someone took, written up for other travellers.
 *
 * Stories can be written by users or curated by the admin, so the author is
 * kept both as a reference (when a user wrote it) and as a denormalised name,
 * which keeps the feed a single query and survives an account being removed.
 */

export const STORY_CATEGORIES = [
  'Road Trip', 'Bike Ride', 'Adventure', 'Mountains', 'Beach',
  'Pilgrimage', 'Food Journey', 'Camping', 'Photography', 'Weekend',
];

const travelStorySchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    excerpt: { type: String, default: '', trim: true },
    body: { type: String, default: '', trim: true },

    category: { type: String, default: 'Road Trip', trim: true, index: true },
    coverImage: { type: String, default: '', trim: true },
    gallery: { type: [String], default: [] },

    /**
     * A reel is a story told as a short video. `videoUrl` is what makes it one;
     * `coverImage` stays the poster frame, so a reel still has something to show
     * in the grid before anyone presses play, and the feed can mix the two.
     */
    videoUrl: { type: String, default: '', trim: true },
    durationSeconds: { type: Number, default: 0, min: 0 },

    // Author. `userId` is absent on admin-curated stories.
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'TaxiUser', default: null, index: true },
    authorName: { type: String, default: '', trim: true },
    authorAvatar: { type: String, default: '', trim: true },
    authorVerified: { type: Boolean, default: false },

    // Where it happened. Coordinates are optional and drive the map panel.
    location: { type: String, default: '', trim: true },
    state: { type: String, default: '', trim: true },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },

    // The trip itself, shown as the card's meta line.
    days: { type: Number, default: 0, min: 0 },
    distanceKm: { type: Number, default: 0, min: 0 },
    cost: { type: Number, default: 0, min: 0 },
    readMinutes: { type: Number, default: 0, min: 0 },

    hashtags: { type: [String], default: [] },

    // Engagement. `likedBy` is the source of truth; `likes` is its length, kept
    // denormalised so the feed never has to load the whole array.
    likedBy: { type: [mongoose.Schema.Types.ObjectId], default: [], select: false },
    likes: { type: Number, default: 0, min: 0 },
    comments: { type: Number, default: 0, min: 0 },
    views: { type: Number, default: 0, min: 0 },

    featured: { type: Boolean, default: false, index: true },
    status: {
      type: String,
      enum: ['pending', 'published', 'rejected'],
      default: 'published',
      index: true,
    },
    publishedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

travelStorySchema.index({ status: 1, publishedAt: -1 });
travelStorySchema.index({ title: 'text', excerpt: 'text', location: 'text' });

export const TravelStory =
  mongoose.models.TaxiTravelStory || mongoose.model('TaxiTravelStory', travelStorySchema);
