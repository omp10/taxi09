import { ApiError } from '../../../../../utils/ApiError.js';
import { TravelPackage } from '../models/TravelPackage.js';
import { Hotel } from '../models/Hotel.js';
import { ContentBlock } from '../models/ContentBlock.js';
import { HireDriver } from '../models/HireDriver.js';
import { Blog } from '../models/Blog.js';
import { Review } from '../models/Review.js';
import { RentalBookingRequest } from '../../models/RentalBookingRequest.js';
import { MembershipPlan } from '../models/MembershipPlan.js';

/**
 * Keeps `location` in step with the lat/lng an admin types. GeoJSON wants
 * [lng, lat], and a hotel without both simply has no point.
 */
const buildHotelLocation = (payload) => {
  const latitude = Number(payload.latitude);
  const longitude = Number(payload.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return { latitude: null, longitude: null, location: undefined };
  }
  return {
    latitude,
    longitude,
    location: { type: 'Point', coordinates: [longitude, latitude] },
  };
};

const PROPERTY_TYPES = ['Hotel', 'Resort', 'Apartment', 'Guest House', 'Villa', 'Homestay', 'Hostel'];

const clean = (value) => String(value ?? '').trim();

const slugify = (value) =>
  clean(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

const toArray = (value) => {
  if (Array.isArray(value)) return value.map((item) => clean(item)).filter(Boolean);
  if (typeof value === 'string' && value.trim()) {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [];
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

/** Ensures a unique slug, appending -2, -3 … when a title collides. */
const ensureUniqueSlug = async (Model, base, currentId) => {
  const root = slugify(base) || 'item';
  let candidate = root;
  let suffix = 1;

  // eslint-disable-next-line no-await-in-loop
  while (await Model.exists({ slug: candidate, ...(currentId ? { _id: { $ne: currentId } } : {}) })) {
    suffix += 1;
    candidate = `${root}-${suffix}`;
  }
  return candidate;
};

/* ------------------------------------------------------------------ */
/* Travel packages                                                     */
/* ------------------------------------------------------------------ */

const normalizePackagePayload = (payload = {}) => {
  const price = toNumber(payload.price, NaN);
  if (!clean(payload.title)) throw new ApiError(400, 'Package title is required');
  if (!Number.isFinite(price) || price < 0) throw new ApiError(400, 'A valid price is required');

  const scope = payload.scope === 'international' ? 'international' : 'domestic';

  return {
    scope,
    title: clean(payload.title),
    state: clean(payload.state),
    country: clean(payload.country),
    category: clean(payload.category),
    badge: clean(payload.badge),
    badgeTone: clean(payload.badgeTone) || 'bg-[#FFC107] text-[#111827]',
    stops: toArray(payload.stops),
    includes: toArray(payload.includes),
    excludes: toArray(payload.excludes),
    perks: toArray(payload.perks),
    highlights: toArray(payload.highlights),
    image: clean(payload.image),
    gallery: toArray(payload.gallery),
    photos: toNumber(payload.photos, 0),
    durationDays: Math.max(1, toNumber(payload.durationDays, 1)),
    durationLabel: clean(payload.durationLabel),
    departureDate: clean(payload.departureDate),
    rating: Math.min(5, Math.max(0, toNumber(payload.rating, 0))),
    reviews: clean(payload.reviews) || '0',
    price,
    oldPrice: toNumber(payload.oldPrice, 0),
    sortOrder: toNumber(payload.sortOrder, 0),
    active: payload.active !== false && payload.active !== 'false',
  };
};

export const listTravelPackages = async ({ scope, active } = {}) => {
  const filter = {};
  if (scope) filter.scope = scope;
  if (active !== undefined) filter.active = active === true || active === 'true';

  const results = await TravelPackage.find(filter).sort({ sortOrder: 1, createdAt: -1 }).lean();
  return { results, total: results.length };
};

export const createTravelPackage = async (payload) => {
  const normalized = normalizePackagePayload(payload);
  const slug = await ensureUniqueSlug(TravelPackage, payload.slug || normalized.title);
  return TravelPackage.create({ ...normalized, slug });
};

export const updateTravelPackage = async (id, payload) => {
  const existing = await TravelPackage.findById(id);
  if (!existing) throw new ApiError(404, 'Package not found');

  const normalized = normalizePackagePayload({ ...existing.toObject(), ...payload });
  // Only a slug the admin actually typed changes the address. Regenerating it
  // from a renamed title would silently 404 every link already shared, and
  // orphan the slug snapshotted on past bookings.
  if (payload.slug) {
    normalized.slug = await ensureUniqueSlug(TravelPackage, payload.slug || normalized.title, id);
  }

  Object.assign(existing, normalized);
  await existing.save();
  return existing;
};

export const toggleTravelPackage = async (id) => {
  const existing = await TravelPackage.findById(id);
  if (!existing) throw new ApiError(404, 'Package not found');
  existing.active = !existing.active;
  await existing.save();
  return existing;
};

export const deleteTravelPackage = async (id) => {
  const deleted = await TravelPackage.findByIdAndDelete(id);
  if (!deleted) throw new ApiError(404, 'Package not found');
  return { id };
};

/* ------------------------------------------------------------------ */
/* Hotels                                                              */
/* ------------------------------------------------------------------ */

const normalizeRoom = (room = {}, index = 0) => ({
  key: slugify(room.key || room.name || `room-${index + 1}`),
  name: clean(room.name) || `Room ${index + 1}`,
  category: clean(room.category) || 'Deluxe',
  sqft: toNumber(room.sqft, 0),
  adults: Math.max(1, toNumber(room.adults, 2)),
  children: Math.max(0, toNumber(room.children, 0)),
  bed: clean(room.bed) || '1 King Bed',
  priceMultiplier: Math.max(0, toNumber(room.priceMultiplier, 1)),
  perks: toArray(room.perks),
  image: clean(room.image),
  roomsLeft: Math.max(0, toNumber(room.roomsLeft, 0)),
  active: room.active !== false,
});

const normalizeHotelPayload = (payload = {}) => {
  const price = toNumber(payload.price, NaN);
  if (!clean(payload.name)) throw new ApiError(400, 'Hotel name is required');
  if (!clean(payload.city)) throw new ApiError(400, 'City is required');
  if (!Number.isFinite(price) || price < 0) throw new ApiError(400, 'A valid nightly price is required');

  return {
    name: clean(payload.name),
    city: clean(payload.city),
    area: clean(payload.area),
    distance: clean(payload.distance),
    badge: clean(payload.badge),
    image: clean(payload.image),
    gallery: toArray(payload.gallery),
    amenities: toArray(payload.amenities),
    facilities: toArray(payload.facilities),
    // Star class is a whole number; anything outside 1-5 means unclassified.
    starRating: Math.min(5, Math.max(0, Math.round(toNumber(payload.starRating, 0)))),
    ...buildHotelLocation(payload),
    propertyType: PROPERTY_TYPES.includes(clean(payload.propertyType)) ? clean(payload.propertyType) : '',
    rating: Math.min(5, Math.max(0, toNumber(payload.rating, 0))),
    reviews: clean(payload.reviews) || '0',
    price,
    oldPrice: toNumber(payload.oldPrice, 0),
    checkInTime: clean(payload.checkInTime) || '2:00 PM',
    checkOutTime: clean(payload.checkOutTime) || '11:00 AM',
    rooms: Array.isArray(payload.rooms) ? payload.rooms.map(normalizeRoom) : [],
    sortOrder: toNumber(payload.sortOrder, 0),
    active: payload.active !== false && payload.active !== 'false',
  };
};

/** Great-circle distance in km, for labelling results against a search point. */
const distanceKm = (lat1, lng1, lat2, lng2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)) * 10) / 10;
};

/**
 * @param q       free text matched against name, city and area
 * @param lat/lng when given, results are ordered by distance from that point
 * @param radiusKm limit for the geo search (default 25km)
 */
export const listHotels = async ({ city, active, q, lat, lng, radiusKm } = {}) => {
  const filter = {};
  if (city) filter.city = city;
  if (active !== undefined) filter.active = active === true || active === 'true';

  const term = clean(q);
  if (term) {
    filter.$or = [
      { name: { $regex: term, $options: 'i' } },
      { city: { $regex: term, $options: 'i' } },
      { area: { $regex: term, $options: 'i' } },
    ];
  }

  const latitude = Number(lat);
  const longitude = Number(lng);
  const hasPoint = Number.isFinite(latitude) && Number.isFinite(longitude);

  if (hasPoint) {
    const radius = Math.max(1, Number(radiusKm) || 25);
    // $near returns nearest-first, so no extra sort is needed.
    filter.location = {
      $near: {
        $geometry: { type: 'Point', coordinates: [longitude, latitude] },
        $maxDistance: radius * 1000,
      },
    };
  }

  const query = Hotel.find(filter);
  if (!hasPoint) query.sort({ sortOrder: 1, createdAt: -1 });

  const results = (await query.lean()).map((hotel) =>
    hasPoint && hotel.latitude != null && hotel.longitude != null
      ? { ...hotel, distanceKm: distanceKm(latitude, longitude, hotel.latitude, hotel.longitude) }
      : hotel,
  );

  return { results, total: results.length };
};

export const getTravelPackageBySlug = async (slug) => {
  const pkg = await TravelPackage.findOne({ slug: clean(slug).toLowerCase() }).lean();
  if (!pkg) throw new ApiError(404, 'Package not found');
  return pkg;
};

export const getHotelBySlug = async (slug) => {
  const hotel = await Hotel.findOne({ slug: clean(slug).toLowerCase() }).lean();
  if (!hotel) throw new ApiError(404, 'Hotel not found');
  return hotel;
};

export const createHotel = async (payload) => {
  const normalized = normalizeHotelPayload(payload);
  const slug = await ensureUniqueSlug(Hotel, payload.slug || normalized.name);
  return Hotel.create({ ...normalized, slug });
};

export const updateHotel = async (id, payload) => {
  const existing = await Hotel.findById(id);
  if (!existing) throw new ApiError(404, 'Hotel not found');

  const normalized = normalizeHotelPayload({ ...existing.toObject(), ...payload });
  // Only a slug the admin actually typed changes the address. Regenerating it
  // from a renamed title would silently 404 every link already shared, and
  // orphan the slug snapshotted on past bookings.
  if (payload.slug) {
    normalized.slug = await ensureUniqueSlug(Hotel, payload.slug || normalized.name, id);
  }

  Object.assign(existing, normalized);
  await existing.save();
  return existing;
};

export const toggleHotel = async (id) => {
  const existing = await Hotel.findById(id);
  if (!existing) throw new ApiError(404, 'Hotel not found');
  existing.active = !existing.active;
  await existing.save();
  return existing;
};

export const deleteHotel = async (id) => {
  const deleted = await Hotel.findByIdAndDelete(id);
  if (!deleted) throw new ApiError(404, 'Hotel not found');
  return { id };
};

/* ------------------------------------------------------------------ */
/* Content blocks                                                      */
/* ------------------------------------------------------------------ */

export const listContentBlocks = async ({ keys } = {}) => {
  const filter = {};
  if (keys) {
    const list = Array.isArray(keys) ? keys : String(keys).split(',');
    filter.key = { $in: list.map((item) => clean(item)).filter(Boolean) };
  }
  const results = await ContentBlock.find(filter).sort({ key: 1 }).lean();
  return { results, total: results.length };
};

/** Public shape: `{ "tours.hero": [...], "tours.categories": [...] }` */
export const getContentBlockMap = async (keys) => {
  const { results } = await listContentBlocks({ keys });
  return results.reduce((map, block) => {
    if (block.active) map[block.key] = block.items;
    return map;
  }, {});
};

export const upsertContentBlock = async (payload = {}) => {
  const key = clean(payload.key);
  if (!key) throw new ApiError(400, 'Block key is required');

  const update = {
    label: clean(payload.label),
    description: clean(payload.description),
    items: Array.isArray(payload.items) ? payload.items : [],
    active: payload.active !== false && payload.active !== 'false',
  };

  return ContentBlock.findOneAndUpdate({ key }, { $set: update }, { upsert: true, new: true });
};

export const deleteContentBlock = async (id) => {
  const deleted = await ContentBlock.findByIdAndDelete(id);
  if (!deleted) throw new ApiError(404, 'Content block not found');
  return { id };
};


/* ------------------------------------------------------------------ */
/* Hire drivers                                                        */
/* ------------------------------------------------------------------ */

const HIRE_TYPES = ['permanent', 'monthly', 'outstation', 'hourly'];

const normalizeHireDriverPayload = (payload = {}) => {
  if (!clean(payload.name)) throw new ApiError(400, 'Driver name is required');

  const hireTypes = toArray(payload.hireTypes)
    .map((item) => item.toLowerCase())
    .filter((item) => HIRE_TYPES.includes(item));

  return {
    name: clean(payload.name),
    photo: clean(payload.photo),
    badge: clean(payload.badge),
    rating: Math.min(5, Math.max(0, toNumber(payload.rating, 0))),
    trips: clean(payload.trips) || '0',
    experience: clean(payload.experience),
    about: clean(payload.about),
    languages: toArray(payload.languages),
    vehicleName: clean(payload.vehicleName),
    vehiclePlate: clean(payload.vehiclePlate).toUpperCase(),
    vehicleColor: clean(payload.vehicleColor),
    vehicleClass: clean(payload.vehicleClass),
    vehicleImage: clean(payload.vehicleImage),
    seats: toNumber(payload.seats, 0),
    amenities: toArray(payload.amenities),
    city: clean(payload.city),
    etaMinutes: Math.max(0, toNumber(payload.etaMinutes, 0)),
    distanceKm: Math.max(0, toNumber(payload.distanceKm, 0)),
    hireTypes: hireTypes.length ? hireTypes : ['permanent'],
    monthlySalary: Math.max(0, toNumber(payload.monthlySalary, 0)),
    dailyRate: Math.max(0, toNumber(payload.dailyRate, 0)),
    hourlyRate: Math.max(0, toNumber(payload.hourlyRate, 0)),
    verified: payload.verified === true || payload.verified === 'true',
    available: payload.available !== false && payload.available !== 'false',
    sortOrder: toNumber(payload.sortOrder, 0),
    active: payload.active !== false && payload.active !== 'false',
  };
};

const serializeBlog = (item = {}) => ({
  id: String(item._id || ''),
  _id: item._id,
  slug: item.slug || '',
  title: item.title || '',
  excerpt: item.excerpt || '',
  content: item.content || '',
  coverImage: item.coverImage || '',
  gallery: Array.isArray(item.gallery) ? item.gallery.filter(Boolean) : [],
  author: item.author || '',
  category: item.category || '',
  tags: Array.isArray(item.tags) ? item.tags : [],
  readMinutes: Number(item.readMinutes || 0),
  status: item.status || 'draft',
  featured: Boolean(item.featured),
  publishedAt: item.publishedAt || null,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

const normalizeBlogPayload = (payload = {}) => {
  const text = (value) => String(value ?? '').trim();
  const body = text(payload.content);

  return {
    title: text(payload.title),
    excerpt: text(payload.excerpt),
    content: body,
    coverImage: text(payload.coverImage),
    gallery: (Array.isArray(payload.gallery) ? payload.gallery : []).map(text).filter(Boolean),
    author: text(payload.author),
    category: text(payload.category),
    tags: (Array.isArray(payload.tags) ? payload.tags : String(payload.tags || '').split(','))
      .map(text)
      .filter(Boolean),
    // Roughly 200 words a minute, so the estimate is derived rather than typed.
    readMinutes: Number(payload.readMinutes) > 0
      ? Number(payload.readMinutes)
      : Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 200)),
    status: payload.status === 'published' ? 'published' : 'draft',
    featured: Boolean(payload.featured),
    publishedAt: payload.publishedAt ? new Date(payload.publishedAt) : new Date(),
  };
};

/** Admin listing: everything, newest first. */
export const listBlogs = async ({ status, search } = {}) => {
  const filter = {};
  if (status) filter.status = status;
  if (String(search || '').trim()) filter.title = { $regex: String(search).trim(), $options: 'i' };

  const results = await Blog.find(filter).sort({ featured: -1, publishedAt: -1 }).lean();
  return { results: results.map(serializeBlog), total: results.length };
};

/** Public listing: published only. */
export const listPublicBlogs = async ({ limit = 12 } = {}) => {
  const results = await Blog.find({ status: 'published' })
    .sort({ featured: -1, publishedAt: -1 })
    .limit(Math.min(Number(limit) || 12, 50))
    .lean();
  return { results: results.map(serializeBlog), total: results.length };
};

export const getPublicBlogBySlug = async (slug) => {
  const found = await Blog.findOne({ slug: String(slug || '').toLowerCase(), status: 'published' }).lean();
  if (!found) throw new ApiError(404, 'Post not found');
  return serializeBlog(found);
};

export const createBlog = async (payload) => {
  const normalized = normalizeBlogPayload(payload);
  if (!normalized.title) throw new ApiError(400, 'Title is required');

  const slug = await ensureUniqueSlug(Blog, payload.slug || normalized.title);
  const created = await Blog.create({ ...normalized, slug });
  return serializeBlog(created.toObject());
};

export const updateBlog = async (id, payload) => {
  const existing = await Blog.findById(id);
  if (!existing) throw new ApiError(404, 'Post not found');

  const normalized = normalizeBlogPayload({ ...existing.toObject(), ...payload });
  Object.assign(existing, normalized);
  await existing.save();
  return serializeBlog(existing.toObject());
};

export const deleteBlog = async (id) => {
  const removed = await Blog.findByIdAndDelete(id);
  if (!removed) throw new ApiError(404, 'Post not found');
  return { id: String(id) };
};

const serializeReview = (item = {}) => ({
  id: String(item._id || ''),
  rating: Number(item.rating || 0),
  title: item.title || '',
  comment: item.comment || '',
  images: Array.isArray(item.images) ? item.images.filter(Boolean) : [],
  userName: item.userName || 'Verified customer',
  vehicleId: item.vehicleId ? String(item.vehicleId) : null,
  bookingType: item.bookingType || '',
  status: item.status || 'pending',
  response: item.response || '',
  respondedAt: item.respondedAt || null,
  createdAt: item.createdAt,
  // Always true on a stored review: one cannot be created without a completed
  // booking of the reviewer's own. Sent so the UI does not have to infer it.
  verified: true,
});

/**
 * Confirm this booking is the reviewer's and is actually finished.
 *
 * This is what "verified" means here. Only rentals are wired up: the other
 * booking types have their own models and lifecycles, and pretending to check
 * one it cannot see would make the badge a lie.
 */
const assertReviewableBooking = async ({ bookingId, bookingType, userId }) => {
  if (bookingType !== 'rental') {
    throw new ApiError(400, 'Reviews are only open on rental bookings at the moment');
  }

  const booking = await RentalBookingRequest.findById(bookingId).lean();
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (String(booking.userId) !== String(userId)) {
    throw new ApiError(403, 'You can only review your own booking');
  }
  if (booking.status !== 'completed') {
    throw new ApiError(400, 'You can review a booking once the trip is complete');
  }
  return booking;
};

export const createReview = async (userId, userName, payload = {}) => {
  const rating = Number(payload.rating);
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    throw new ApiError(400, 'Give a rating between 1 and 5');
  }

  const bookingId = String(payload.bookingId || '').trim();
  if (!bookingId) throw new ApiError(400, 'A booking is required to leave a review');

  const bookingType = String(payload.bookingType || 'rental').trim();
  const booking = await assertReviewableBooking({ bookingId, bookingType, userId });

  // The unique index on bookingId is the real guard; this only turns the
  // duplicate-key error into a message worth reading.
  if (await Review.exists({ bookingId })) {
    throw new ApiError(409, 'You have already reviewed this booking');
  }

  const created = await Review.create({
    userId,
    userName: String(userName || '').trim(),
    bookingId,
    bookingType,
    vehicleId: booking.vehicleId || booking.rentalVehicleId || null,
    rating: Math.round(rating),
    title: String(payload.title || '').trim(),
    comment: String(payload.comment || '').trim(),
    images: (Array.isArray(payload.images) ? payload.images : []).map((i) => String(i).trim()).filter(Boolean),
    status: 'pending',
  });

  return serializeReview(created.toObject());
};

/**
 * Published reviews plus the average, computed at read time rather than kept
 * on the vehicle - a stored average goes stale the moment one is hidden.
 */
export const listPublicReviews = async ({ vehicleId, limit = 20 } = {}) => {
  const filter = { status: 'published' };
  if (vehicleId) filter.vehicleId = vehicleId;

  const results = await Review.find(filter)
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(limit) || 20, 100))
    .lean();

  const total = await Review.countDocuments(filter);
  const sum = results.reduce((running, item) => running + Number(item.rating || 0), 0);

  return {
    results: results.map(serializeReview),
    total,
    // Null rather than 0 when there is nothing to average: "no rating yet" and
    // "rated zero" are different things and must not render the same.
    average: results.length ? Number((sum / results.length).toFixed(1)) : null,
  };
};

/**
 * Which of this user's bookings already carry a review.
 *
 * Returns ids only - the booking list needs to know which prompts to hide,
 * not what anyone wrote. Its own authenticated endpoint rather than a flag on
 * the public feed, so there is no query parameter that turns a public read
 * into a personal one.
 */
export const listMyReviewedBookings = async (userId) => {
  const rows = await Review.find({ userId }).select('bookingId').lean();
  return { bookingIds: rows.map((row) => String(row.bookingId)) };
};

export const listReviews = async ({ status, vehicleId } = {}) => {
  const filter = {};
  if (status) filter.status = status;
  if (vehicleId) filter.vehicleId = vehicleId;

  const results = await Review.find(filter).sort({ createdAt: -1 }).lean();
  return { results: results.map(serializeReview), total: results.length };
};

export const moderateReview = async (id, payload = {}) => {
  const review = await Review.findById(id);
  if (!review) throw new ApiError(404, 'Review not found');

  if (payload.status) {
    if (!['pending', 'published', 'rejected'].includes(payload.status)) {
      throw new ApiError(400, 'Status must be pending, published or rejected');
    }
    review.status = payload.status;
  }
  if (payload.moderationNote !== undefined) {
    review.moderationNote = String(payload.moderationNote || '').trim();
  }
  if (payload.response !== undefined) {
    review.response = String(payload.response || '').trim();
    review.respondedAt = review.response ? new Date() : null;
  }

  await review.save();
  return serializeReview(review.toObject());
};

export const listHireDrivers = async ({ hireType, city, active, available } = {}) => {
  const filter = {};
  if (hireType) filter.hireTypes = hireType;
  if (city) filter.city = city;
  if (active !== undefined) filter.active = active === true || active === 'true';
  if (available !== undefined) filter.available = available === true || available === 'true';

  const results = await HireDriver.find(filter).sort({ sortOrder: 1, rating: -1 }).lean();
  return { results, total: results.length };
};

export const createHireDriver = async (payload) => {
  const normalized = normalizeHireDriverPayload(payload);
  const slug = await ensureUniqueSlug(HireDriver, payload.slug || normalized.name);
  return HireDriver.create({ ...normalized, slug });
};

export const updateHireDriver = async (id, payload) => {
  const existing = await HireDriver.findById(id);
  if (!existing) throw new ApiError(404, 'Driver not found');

  const normalized = normalizeHireDriverPayload({ ...existing.toObject(), ...payload });
  // Only a slug the admin actually typed changes the address. Regenerating it
  // from a renamed title would silently 404 every link already shared, and
  // orphan the slug snapshotted on past bookings.
  if (payload.slug) {
    normalized.slug = await ensureUniqueSlug(HireDriver, payload.slug || normalized.name, id);
  }

  Object.assign(existing, normalized);
  await existing.save();
  return existing;
};

export const toggleHireDriver = async (id) => {
  const existing = await HireDriver.findById(id);
  if (!existing) throw new ApiError(404, 'Driver not found');
  existing.active = !existing.active;
  await existing.save();
  return existing;
};

export const deleteHireDriver = async (id) => {
  const deleted = await HireDriver.findByIdAndDelete(id);
  if (!deleted) throw new ApiError(404, 'Driver not found');
  return { id };
};

/* ------------------------------------------------------------------ */
/* Membership plans                                                    */
/* ------------------------------------------------------------------ */

const THEMES = ['gold', 'silver', 'black'];

/**
 * Benefits arrive either as objects from the admin form or as plain lines
 * ("Priority Booking: Faster confirmations") when seeded or pasted in bulk.
 */
const toBenefits = (value) => {
  const rows = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split('\n')
      : [];

  return rows
    .map((row) => {
      if (row && typeof row === 'object') {
        return {
          icon: clean(row.icon) || 'check',
          title: clean(row.title),
          subtitle: clean(row.subtitle),
        };
      }
      const [title, ...rest] = String(row || '').split(':');
      return { icon: 'check', title: clean(title), subtitle: clean(rest.join(':')) };
    })
    .filter((row) => row.title);
};

const normalizeMembershipPlanPayload = (payload = {}) => ({
  name: clean(payload.name),
  tagline: clean(payload.tagline) || 'MEMBER',
  discountPercent: Math.min(100, Math.max(0, toNumber(payload.discountPercent, 0))),
  price: Math.max(0, toNumber(payload.price, 0)),
  oldPrice: Math.max(0, toNumber(payload.oldPrice, 0)),
  durationMonths: Math.max(1, Math.round(toNumber(payload.durationMonths, 1))),
  benefits: toBenefits(payload.benefits),
  theme: THEMES.includes(clean(payload.theme)) ? clean(payload.theme) : 'gold',
  badge: clean(payload.badge),
  sortOrder: toNumber(payload.sortOrder, 0),
  active: payload.active === undefined ? true : Boolean(payload.active),
});

export const listMembershipPlans = async ({ active } = {}) => {
  const query = {};
  if (active !== undefined) query.active = Boolean(active);

  const results = await MembershipPlan.find(query).sort({ sortOrder: 1, price: 1 }).lean();
  return { results };
};

export const getMembershipPlan = async (id) => {
  const plan = await MembershipPlan.findById(id).lean();
  if (!plan) throw new ApiError(404, 'Membership plan not found');
  return plan;
};

export const createMembershipPlan = async (payload) => {
  const normalized = normalizeMembershipPlanPayload(payload);
  if (!normalized.name) throw new ApiError(400, 'Plan name is required');

  const slug = await ensureUniqueSlug(MembershipPlan, payload.slug || normalized.name);
  return MembershipPlan.create({ ...normalized, slug });
};

export const updateMembershipPlan = async (id, payload) => {
  const existing = await MembershipPlan.findById(id);
  if (!existing) throw new ApiError(404, 'Membership plan not found');

  const normalized = normalizeMembershipPlanPayload({ ...existing.toObject(), ...payload });
  // Only a slug the admin actually typed changes the address. Regenerating it
  // from a renamed title would silently 404 every link already shared, and
  // orphan the slug snapshotted on past bookings.
  if (payload.slug) {
    normalized.slug = await ensureUniqueSlug(MembershipPlan, payload.slug || normalized.name, id);
  }

  Object.assign(existing, normalized);
  await existing.save();
  return existing;
};

export const toggleMembershipPlan = async (id) => {
  const existing = await MembershipPlan.findById(id);
  if (!existing) throw new ApiError(404, 'Membership plan not found');
  existing.active = !existing.active;
  await existing.save();
  return existing;
};

export const deleteMembershipPlan = async (id) => {
  const deleted = await MembershipPlan.findByIdAndDelete(id);
  if (!deleted) throw new ApiError(404, 'Membership plan not found');
  return { id };
};
