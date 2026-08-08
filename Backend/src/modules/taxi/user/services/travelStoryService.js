import { ApiError } from '../../../../utils/ApiError.js';
import { TravelStory } from '../../admin/content/models/TravelStory.js';

/**
 * The travel story feed.
 *
 * Facets on the page - destinations, hashtags, the headline counts - are all
 * aggregated from the stories themselves rather than stored separately, so they
 * can never drift out of step with what is actually published.
 */

const clean = (value) => String(value ?? '').trim();

const slugify = (value) =>
  clean(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70);

const ensureUniqueSlug = async (base) => {
  const root = slugify(base) || 'story';
  let candidate = root;
  let suffix = 1;

  // eslint-disable-next-line no-await-in-loop
  while (await TravelStory.exists({ slug: candidate })) {
    suffix += 1;
    candidate = `${root}-${suffix}`;
  }
  return candidate;
};

/** Roughly 200 words a minute, floored at one so nothing reads as "0 min". */
const readingMinutes = (body) => Math.max(1, Math.round(clean(body).split(/\s+/).filter(Boolean).length / 200));

const SORTS = {
  trending: { likes: -1, views: -1 },
  latest: { publishedAt: -1 },
  foryou: { featured: -1, publishedAt: -1 },
};

export const listTravelStories = async ({ category, tab, q, limit = 24 } = {}) => {
  const query = { status: 'published' };

  if (category && category !== 'All') query.category = category;

  const term = clean(q);
  if (term) {
    query.$or = ['title', 'excerpt', 'location', 'authorName'].map((field) => ({
      [field]: { $regex: term, $options: 'i' },
    }));
  }

  const sort = SORTS[String(tab || '').toLowerCase()] || SORTS.foryou;

  const results = await TravelStory.find(query)
    .sort(sort)
    .limit(Math.min(60, Number(limit) || 24))
    .lean();

  return { results };
};

export const getTravelStoryBySlug = async (slug) => {
  const story = await TravelStory.findOneAndUpdate(
    { slug: clean(slug).toLowerCase(), status: 'published' },
    { $inc: { views: 1 } },
    { new: true },
  ).lean();

  if (!story) throw new ApiError(404, 'Story not found');
  return story;
};

/**
 * Everything the sidebar needs, derived from the published stories.
 */
export const getTravelStoryFacets = async () => {
  const [categories, destinations, hashtags, totals] = await Promise.all([
    TravelStory.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    TravelStory.aggregate([
      { $match: { status: 'published', location: { $ne: '' } } },
      {
        $group: {
          _id: '$location',
          count: { $sum: 1 },
          image: { $first: '$coverImage' },
          state: { $first: '$state' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]),
    TravelStory.aggregate([
      { $match: { status: 'published' } },
      { $unwind: '$hashtags' },
      { $group: { _id: '$hashtags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]),
    TravelStory.aggregate([
      { $match: { status: 'published' } },
      {
        $group: {
          _id: null,
          stories: { $sum: 1 },
          photos: { $sum: { $size: { $ifNull: ['$gallery', []] } } },
          destinations: { $addToSet: '$location' },
          authors: { $addToSet: '$authorName' },
        },
      },
    ]),
  ]);

  const summary = totals[0] || {};

  return {
    categories: categories.map((row) => ({ label: row._id, count: row.count })),
    destinations: destinations.map((row) => ({
      label: row._id, state: row.state, count: row.count, image: row.image,
    })),
    hashtags: hashtags.map((row) => ({ tag: row._id, count: row.count })),
    totals: {
      stories: summary.stories || 0,
      travellers: (summary.authors || []).filter(Boolean).length,
      destinations: (summary.destinations || []).filter(Boolean).length,
      photos: summary.photos || 0,
    },
  };
};

/** Stories with coordinates, for the map panel. */
export const listTravelStoryPins = async () =>
  TravelStory.find({ status: 'published', latitude: { $ne: null }, longitude: { $ne: null } })
    .select('slug title location latitude longitude coverImage')
    .limit(100)
    .lean();

export const createTravelStory = async ({ userId, author = {}, payload = {} }) => {
  if (!userId) throw new ApiError(401, 'Sign in to share a story');

  const title = clean(payload.title);
  if (!title) throw new ApiError(400, 'A title is required');

  const body = clean(payload.body);

  return TravelStory.create({
    slug: await ensureUniqueSlug(title),
    title,
    excerpt: clean(payload.excerpt) || body.slice(0, 180),
    body,
    category: clean(payload.category) || 'Road Trip',
    coverImage: clean(payload.coverImage),
    gallery: Array.isArray(payload.gallery) ? payload.gallery.filter(Boolean) : [],
    userId,
    authorName: clean(author.name) || 'Traveller',
    authorAvatar: clean(author.profileImage),
    location: clean(payload.location),
    state: clean(payload.state),
    latitude: Number.isFinite(Number(payload.latitude)) ? Number(payload.latitude) : null,
    longitude: Number.isFinite(Number(payload.longitude)) ? Number(payload.longitude) : null,
    days: Math.max(0, Number(payload.days) || 0),
    distanceKm: Math.max(0, Number(payload.distanceKm) || 0),
    cost: Math.max(0, Number(payload.cost) || 0),
    readMinutes: readingMinutes(body),
    hashtags: (Array.isArray(payload.hashtags)
      ? payload.hashtags
      : clean(payload.hashtags).split(',')
    )
      .map((tag) => clean(tag).replace(/^#/, ''))
      .filter(Boolean),
    // Reader-submitted stories wait for a moderator; the admin publishes directly.
    status: 'pending',
  });
};

/**
 * Toggles a like. `likedBy` decides, so a second tap removes the like instead of
 * counting twice however many times it is sent.
 */
export const toggleStoryLike = async ({ slug, userId }) => {
  if (!userId) throw new ApiError(401, 'Sign in to like a story');

  const story = await TravelStory.findOne({ slug: clean(slug).toLowerCase() }).select('+likedBy');
  if (!story) throw new ApiError(404, 'Story not found');

  const already = (story.likedBy || []).some((id) => String(id) === String(userId));
  story.likedBy = already
    ? story.likedBy.filter((id) => String(id) !== String(userId))
    : [...story.likedBy, userId];

  story.likes = story.likedBy.length;
  await story.save();

  return { liked: !already, likes: story.likes };
};

export const listMyTravelStories = async (userId) =>
  TravelStory.find({ userId }).sort({ createdAt: -1 }).lean();
