import { asyncHandler } from '../../../../../utils/asyncHandler.js';
import { ApiError } from '../../../../../utils/ApiError.js';
import * as contentService from '../services/contentService.js';
import { quoteHotelStay as priceHotelStayWithCoupon } from '../../../user/services/hotelPricingService.js';
import { quotePackage } from '../../../user/services/travelPackagePricingService.js';

const ok = (res, data, status = 200) => res.status(status).json({ success: true, data });

/* ---------------- Travel packages ---------------- */

export const adminListTravelPackages = asyncHandler(async (req, res) =>
  ok(res, await contentService.listTravelPackages({ scope: req.query.scope, active: req.query.active })),
);

export const adminCreateTravelPackage = asyncHandler(async (req, res) =>
  ok(res, await contentService.createTravelPackage(req.body), 201),
);

export const adminUpdateTravelPackage = asyncHandler(async (req, res) =>
  ok(res, await contentService.updateTravelPackage(req.params.id, req.body)),
);

export const adminToggleTravelPackage = asyncHandler(async (req, res) =>
  ok(res, await contentService.toggleTravelPackage(req.params.id)),
);

export const adminDeleteTravelPackage = asyncHandler(async (req, res) =>
  ok(res, await contentService.deleteTravelPackage(req.params.id)),
);

/* ---------------- Hotels ---------------- */

export const adminListHotels = asyncHandler(async (req, res) =>
  ok(res, await contentService.listHotels({ city: req.query.city, active: req.query.active })),
);

export const adminCreateHotel = asyncHandler(async (req, res) =>
  ok(res, await contentService.createHotel(req.body), 201),
);

export const adminUpdateHotel = asyncHandler(async (req, res) =>
  ok(res, await contentService.updateHotel(req.params.id, req.body)),
);

export const adminToggleHotel = asyncHandler(async (req, res) =>
  ok(res, await contentService.toggleHotel(req.params.id)),
);

export const adminDeleteHotel = asyncHandler(async (req, res) =>
  ok(res, await contentService.deleteHotel(req.params.id)),
);

/* ---------------- Content blocks ---------------- */

export const adminListContentBlocks = asyncHandler(async (req, res) =>
  ok(res, await contentService.listContentBlocks({ keys: req.query.keys })),
);

export const adminUpsertContentBlock = asyncHandler(async (req, res) =>
  ok(res, await contentService.upsertContentBlock(req.body)),
);

export const adminDeleteContentBlock = asyncHandler(async (req, res) =>
  ok(res, await contentService.deleteContentBlock(req.params.id)),
);

/* ---------------- Hire drivers ---------------- */

export const adminListHireDrivers = asyncHandler(async (req, res) =>
  ok(res, await contentService.listHireDrivers({ hireType: req.query.hireType, city: req.query.city })),
);

export const adminCreateHireDriver = asyncHandler(async (req, res) =>
  ok(res, await contentService.createHireDriver(req.body), 201),
);

export const adminUpdateHireDriver = asyncHandler(async (req, res) =>
  ok(res, await contentService.updateHireDriver(req.params.id, req.body)),
);

export const adminToggleHireDriver = asyncHandler(async (req, res) =>
  ok(res, await contentService.toggleHireDriver(req.params.id)),
);

export const adminDeleteHireDriver = asyncHandler(async (req, res) =>
  ok(res, await contentService.deleteHireDriver(req.params.id)),
);

/* ---------------- Public (no auth) ---------------- */

export const getPublicHireDrivers = asyncHandler(async (req, res) => {
  const { results } = await contentService.listHireDrivers({
    hireType: req.query.hireType || 'permanent',
    city: req.query.city,
    active: true,
    available: true,
  });
  ok(res, { results });
});


export const getPublicTravelPackages = asyncHandler(async (req, res) => {
  const scope = req.query.scope === 'international' ? 'international' : 'domestic';
  const { results } = await contentService.listTravelPackages({ scope, active: true });
  ok(res, { results });
});

export const getPublicHotels = asyncHandler(async (req, res) => {
  const { results } = await contentService.listHotels({
    city: req.query.city,
    q: req.query.q,
    lat: req.query.lat,
    lng: req.query.lng,
    radiusKm: req.query.radiusKm,
    active: true,
  });
  ok(res, { results });
});

export const getPublicTravelPackageBySlug = asyncHandler(async (req, res) =>
  ok(res, await contentService.getTravelPackageBySlug(req.params.slug)),
);

export const getPublicHotelBySlug = asyncHandler(async (req, res) =>
  ok(res, await contentService.getHotelBySlug(req.params.slug)),
);

/**
 * Prices a stay without booking it. The hotel screens render this verbatim so
 * the totals on screen always match what the server will charge.
 */
export const quoteHotelStay = asyncHandler(async (req, res) => {
  const payload = req.body || {};
  const hotel = await contentService.getHotelBySlug(payload.slug || payload.hotelSlug);
  const { getMemberDiscountPercent } = await import('../../../user/services/membershipService.js');

  ok(res, await priceHotelStayWithCoupon({
    hotel,
    memberDiscountPercent: await getMemberDiscountPercent(req.auth?.sub),
    roomKey: payload.roomKey,
    checkIn: payload.checkIn,
    checkOut: payload.checkOut,
    rooms: payload.rooms,
    guests: payload.guests,
    addOns: payload.addOns,
    couponCode: payload.couponCode,
  }));
});

/**
 * Prices a package without booking it. Both details screens render this
 * verbatim rather than applying tax rates of their own.
 */
export const quoteTravelPackage = asyncHandler(async (req, res) => {
  const payload = req.body || {};
  const pkg = await contentService.getTravelPackageBySlug(payload.slug);
  const { getMemberDiscountPercent } = await import('../../../user/services/membershipService.js');

  ok(res, await quotePackage({
    pkg,
    memberDiscountPercent: await getMemberDiscountPercent(req.auth?.sub),
    travellers: payload.travellers,
    couponCode: payload.couponCode,
    addOns: payload.addOns,
  }));
});

export const getPublicContentBlocks = asyncHandler(async (req, res) =>
  ok(res, { blocks: await contentService.getContentBlockMap(req.query.keys) }),
);

/* ----------------------------------------------------- membership plans */

export const adminListMembershipPlans = asyncHandler(async (req, res) =>
  ok(res, await contentService.listMembershipPlans({ active: req.query.active })),
);

export const adminCreateMembershipPlan = asyncHandler(async (req, res) =>
  ok(res, await contentService.createMembershipPlan(req.body), 201),
);

export const adminUpdateMembershipPlan = asyncHandler(async (req, res) =>
  ok(res, await contentService.updateMembershipPlan(req.params.id, req.body)),
);

export const adminToggleMembershipPlan = asyncHandler(async (req, res) =>
  ok(res, await contentService.toggleMembershipPlan(req.params.id)),
);

export const adminDeleteMembershipPlan = asyncHandler(async (req, res) =>
  ok(res, await contentService.deleteMembershipPlan(req.params.id)),
);

/** Every membership sold, newest first. */
export const getAdminMemberships = asyncHandler(async (req, res) => {
  const { UserMembership } = await import('../models/UserMembership.js');

  const query = {};
  if (req.query.status) query.status = req.query.status;
  if (req.query.planSlug) query.planSlug = req.query.planSlug;

  const term = String(req.query.search || '').trim();
  if (term) {
    query.$or = ['bookingReference', 'planName'].map((field) => ({
      [field]: { $regex: term, $options: 'i' },
    }));
  }

  const results = await UserMembership.find(query)
    .populate('userId', 'name phone email')
    .sort({ createdAt: -1 })
    .limit(Math.min(500, Number(req.query.limit) || 200))
    .lean();

  ok(res, { results, total: await UserMembership.countDocuments(query) });
});

/* ------------------------------------------------------- user facing */

export const getPublicMembershipPlans = asyncHandler(async (req, res) =>
  ok(res, await contentService.listMembershipPlans({ active: true })),
);

export const getMyMembership = asyncHandler(async (req, res) => {
  const { getActiveMembership, listMyMemberships } = await import(
    '../../../user/services/membershipService.js'
  );

  ok(res, {
    active: await getActiveMembership(req.auth?.sub),
    history: await listMyMemberships(req.auth?.sub),
  });
});

export const postMembershipPurchase = asyncHandler(async (req, res) => {
  const { purchaseMembership } = await import('../../../user/services/membershipService.js');

  ok(res, await purchaseMembership({ userId: req.auth?.sub, planId: req.body?.planId }), 201);
});

/* ------------------------------------------------- attach your car */

const attachedVehicleService = () => import('../../../user/services/attachedVehicleService.js');

export const getMyAttachedVehicles = asyncHandler(async (req, res) => {
  const { listMyAttachedVehicles } = await attachedVehicleService();
  ok(res, { results: await listMyAttachedVehicles(req.auth?.sub) });
});

export const getMyAttachedVehicle = asyncHandler(async (req, res) => {
  const service = await attachedVehicleService();
  ok(res, await service.getMyAttachedVehicle({ id: req.params.id, userId: req.auth?.sub }));
});

export const postAttachedVehicle = asyncHandler(async (req, res) => {
  const { saveAttachedVehicle } = await attachedVehicleService();
  ok(res, await saveAttachedVehicle({ userId: req.auth?.sub, payload: req.body || {} }), 201);
});

export const patchAttachedVehicle = asyncHandler(async (req, res) => {
  const { saveAttachedVehicle } = await attachedVehicleService();
  ok(res, await saveAttachedVehicle({ userId: req.auth?.sub, id: req.params.id, payload: req.body || {} }));
});

export const postAttachedVehicleSubmit = asyncHandler(async (req, res) => {
  const { submitAttachedVehicle } = await attachedVehicleService();
  ok(res, await submitAttachedVehicle({ userId: req.auth?.sub, id: req.params.id }));
});

/* ------------------------------------------------------------ admin */

export const getAdminAttachedVehicles = asyncHandler(async (req, res) => {
  const { AttachedVehicle } = await import('../models/AttachedVehicle.js');

  // Drafts are the owner's private workspace and never reach the admin queue.
  const query = { status: { $ne: 'draft' } };
  if (req.query.status) query.status = req.query.status;

  const term = String(req.query.search || '').trim();
  if (term) {
    query.$or = ['reference', 'registrationNumber', 'brand', 'model', 'city'].map((field) => ({
      [field]: { $regex: term, $options: 'i' },
    }));
  }

  const results = await AttachedVehicle.find(query)
    .populate('userId', 'name phone email')
    .sort({ submittedAt: -1, createdAt: -1 })
    .limit(Math.min(500, Number(req.query.limit) || 200))
    .lean();

  ok(res, { results, total: await AttachedVehicle.countDocuments(query) });
});

export const updateAdminAttachedVehicle = asyncHandler(async (req, res) => {
  const { AttachedVehicle } = await import('../models/AttachedVehicle.js');

  const update = { reviewedAt: new Date() };
  if (req.body?.status) update.status = req.body.status;
  if (req.body?.reviewNote !== undefined) update.reviewNote = String(req.body.reviewNote || '').trim();

  const updated = await AttachedVehicle.findByIdAndUpdate(
    req.params.id,
    { $set: update },
    { new: true },
  ).lean();

  ok(res, updated);
});

/* ------------------------------------------------------- travel stories */

const storyService = () => import('../../../user/services/travelStoryService.js');

export const getPublicTravelStories = asyncHandler(async (req, res) => {
  const service = await storyService();
  ok(res, await service.listTravelStories({
    category: req.query.category,
    tab: req.query.tab,
    q: req.query.q,
    limit: req.query.limit,
    mediaType: req.query.mediaType,
  }));
});

export const getPublicTravelStoryBySlug = asyncHandler(async (req, res) => {
  const service = await storyService();
  ok(res, await service.getTravelStoryBySlug(req.params.slug));
});

export const getTravelStoryFacets = asyncHandler(async (_req, res) => {
  const service = await storyService();
  ok(res, await service.getTravelStoryFacets());
});

export const getTravelStoryPins = asyncHandler(async (_req, res) => {
  const service = await storyService();
  ok(res, { results: await service.listTravelStoryPins() });
});

export const postTravelStory = asyncHandler(async (req, res) => {
  const service = await storyService();
  const { User } = await import('../../../user/models/User.js');
  const author = await User.findById(req.auth?.sub).select('name profileImage').lean();

  ok(res, await service.createTravelStory({ userId: req.auth?.sub, author, payload: req.body || {} }), 201);
});

export const postTravelStoryLike = asyncHandler(async (req, res) => {
  const service = await storyService();
  ok(res, await service.toggleStoryLike({ slug: req.params.slug, userId: req.auth?.sub }));
});

export const getMyTravelStories = asyncHandler(async (req, res) => {
  const service = await storyService();
  ok(res, { results: await service.listMyTravelStories(req.auth?.sub) });
});

/* ------------------------------------------------------------ admin */

export const getAdminTravelStories = asyncHandler(async (req, res) => {
  const { TravelStory } = await import('../models/TravelStory.js');

  const query = {};
  if (req.query.status) query.status = req.query.status;

  const term = String(req.query.search || '').trim();
  if (term) {
    query.$or = ['title', 'location', 'authorName'].map((field) => ({
      [field]: { $regex: term, $options: 'i' },
    }));
  }

  const results = await TravelStory.find(query)
    .sort({ createdAt: -1 })
    .limit(Math.min(500, Number(req.query.limit) || 200))
    .lean();

  ok(res, { results, total: await TravelStory.countDocuments(query) });
});

export const adminUpdateTravelStory = asyncHandler(async (req, res) => {
  const { TravelStory } = await import('../models/TravelStory.js');

  const update = {};
  ['title', 'excerpt', 'body', 'category', 'coverImage', 'location', 'state',
   'authorName', 'status'].forEach((key) => {
    if (req.body?.[key] !== undefined) update[key] = req.body[key];
  });
  ['days', 'distanceKm', 'cost', 'latitude', 'longitude'].forEach((key) => {
    if (req.body?.[key] !== undefined) update[key] = Number(req.body[key]) || 0;
  });
  if (req.body?.featured !== undefined) update.featured = Boolean(req.body.featured);
  if (req.body?.hashtags !== undefined) {
    update.hashtags = (Array.isArray(req.body.hashtags) ? req.body.hashtags : String(req.body.hashtags).split(','))
      .map((tag) => String(tag).trim().replace(/^#/, ''))
      .filter(Boolean);
  }

  ok(res, await TravelStory.findByIdAndUpdate(req.params.id, { $set: update }, { new: true }).lean());
});

export const adminDeleteTravelStory = asyncHandler(async (req, res) => {
  const { TravelStory } = await import('../models/TravelStory.js');
  const deleted = await TravelStory.findByIdAndDelete(req.params.id);
  if (!deleted) throw new ApiError(404, 'Story not found');
  ok(res, { id: req.params.id });
});

/* ---------------------------------------------------- internship & courses */

const internship = () => import('../../../user/services/internshipService.js');

export const getPublicInternshipTracks = asyncHandler(async (_req, res) =>
  ok(res, await (await internship()).listInternshipTracks({ active: true })),
);

export const getPublicCourses = asyncHandler(async (req, res) =>
  ok(res, await (await internship()).listCourses({ active: true, mode: req.query.mode })),
);

export const getPublicCourseBySlug = asyncHandler(async (req, res) =>
  ok(res, await (await internship()).getCourseBySlug(req.params.slug)),
);

export const getPublicInternshipStats = asyncHandler(async (_req, res) =>
  ok(res, await (await internship()).getInternshipStats()),
);

export const getVerifyCertificate = asyncHandler(async (req, res) =>
  ok(res, await (await internship()).verifyCertificate(req.params.number)),
);

export const postInternshipApplication = asyncHandler(async (req, res) =>
  ok(res, await (await internship()).applyForInternship({ userId: req.auth?.sub, payload: req.body || {} }), 201),
);

export const getMyInternshipApplications = asyncHandler(async (req, res) => {
  const service = await internship();
  ok(res, {
    applications: await service.listMyApplications(req.auth?.sub),
    certificates: await service.listMyCertificates(req.auth?.sub),
  });
});

/* ------------------------------------------------------------------ admin */

export const adminListInternshipTracks = asyncHandler(async (_req, res) =>
  ok(res, await (await internship()).listInternshipTracks()),
);

export const adminSaveInternshipTrack = asyncHandler(async (req, res) =>
  ok(res, await (await internship()).saveInternshipTrack({ id: req.params.id, payload: req.body || {} })),
);

export const adminDeleteInternshipTrack = asyncHandler(async (req, res) => {
  const { InternshipTrack } = await import('../models/Internship.js');
  const deleted = await InternshipTrack.findByIdAndDelete(req.params.id);
  if (!deleted) throw new ApiError(404, 'Track not found');
  ok(res, { id: req.params.id });
});

export const adminListCourses = asyncHandler(async (_req, res) =>
  ok(res, await (await internship()).listCourses()),
);

export const adminSaveCourse = asyncHandler(async (req, res) =>
  ok(res, await (await internship()).saveCourse({ id: req.params.id, payload: req.body || {} })),
);

export const adminDeleteCourse = asyncHandler(async (req, res) => {
  const { Course } = await import('../models/Internship.js');
  const deleted = await Course.findByIdAndDelete(req.params.id);
  if (!deleted) throw new ApiError(404, 'Course not found');
  ok(res, { id: req.params.id });
});

export const adminListApplications = asyncHandler(async (req, res) => {
  const { InternshipApplication } = await import('../models/Internship.js');

  const query = {};
  if (req.query.status) query.status = req.query.status;
  const term = String(req.query.search || '').trim();
  if (term) {
    query.$or = ['reference', 'fullName', 'phone', 'email', 'trackTitle', 'courseTitle'].map((f) => ({
      [f]: { $regex: term, $options: 'i' },
    }));
  }

  const results = await InternshipApplication.find(query)
    .populate('userId', 'name phone email')
    .sort({ createdAt: -1 })
    .limit(Math.min(500, Number(req.query.limit) || 200))
    .lean();

  ok(res, { results, total: await InternshipApplication.countDocuments(query) });
});

export const adminUpdateApplication = asyncHandler(async (req, res) => {
  const { InternshipApplication } = await import('../models/Internship.js');

  const update = {};
  if (req.body?.status) update.status = req.body.status;
  if (req.body?.reviewNote !== undefined) update.reviewNote = String(req.body.reviewNote || '').trim();

  ok(res, await InternshipApplication.findByIdAndUpdate(req.params.id, { $set: update }, { new: true }).lean());
});

export const adminIssueCertificate = asyncHandler(async (req, res) =>
  ok(res, await (await internship()).issueCertificate({ applicationId: req.params.id }), 201),
);

export const adminListCertificates = asyncHandler(async (_req, res) => {
  const { Certificate } = await import('../models/Internship.js');
  ok(res, { results: await Certificate.find().sort({ issuedAt: -1 }).limit(500).lean() });
});

/* ------------------------------------------------------------ platform */

/**
 * Headline counts for the marketing strip.
 *
 * Counted from the database rather than written into the page, so the figures
 * cannot claim more than the platform actually has. A count of zero is returned
 * as zero; it is the page's job to hide a tile it cannot fill.
 */
export const getPlatformStats = asyncHandler(async (_req, res) => {
  const [{ User }, { RentalVehicleType }, { Ride }] = await Promise.all([
    import('../../../user/models/User.js'),
    import('../../../admin/models/RentalVehicleType.js'),
    import('../../../user/models/Ride.js'),
  ]);
  const { Hotel } = await import('../models/Hotel.js');
  const { TravelPackage } = await import('../models/TravelPackage.js');

  const [customers, rentalVehicles, hotels, packages, ridesCompleted, hotelCities] = await Promise.all([
    User.countDocuments({}),
    RentalVehicleType.countDocuments({ status: 'active' }),
    Hotel.countDocuments({ active: true }),
    TravelPackage.countDocuments({ active: true }),
    Ride.countDocuments({ status: 'completed' }).catch(() => 0),
    Hotel.distinct('city', { active: true }),
  ]);

  ok(res, {
    customers,
    rentalVehicles,
    hotels,
    packages,
    ridesCompleted,
    cities: hotelCities.filter(Boolean).length,
  });
});


/* ------------------------------------------------------------------ Blogs */
export const adminListBlogs = asyncHandler(async (req, res) =>
  ok(res, await contentService.listBlogs(req.query)),
);
export const adminCreateBlog = asyncHandler(async (req, res) =>
  ok(res, await contentService.createBlog(req.body)),
);
export const adminUpdateBlog = asyncHandler(async (req, res) =>
  ok(res, await contentService.updateBlog(req.params.id, req.body)),
);
export const adminDeleteBlog = asyncHandler(async (req, res) =>
  ok(res, await contentService.deleteBlog(req.params.id)),
);
export const getPublicBlogs = asyncHandler(async (req, res) =>
  ok(res, await contentService.listPublicBlogs(req.query)),
);
export const getPublicBlog = asyncHandler(async (req, res) =>
  ok(res, await contentService.getPublicBlogBySlug(req.params.slug)),
);


/* ---------------------------------------------------------------- Reviews */
export const adminListReviews = asyncHandler(async (req, res) =>
  ok(res, await contentService.listReviews(req.query)),
);
export const adminModerateReview = asyncHandler(async (req, res) =>
  ok(res, await contentService.moderateReview(req.params.id, req.body)),
);
export const getPublicReviews = asyncHandler(async (req, res) =>
  ok(res, await contentService.listPublicReviews(req.query)),
);
export const postReview = asyncHandler(async (req, res) =>
  ok(res, await contentService.createReview(req.user?.id || req.user?._id, req.user?.name, req.body), 201),
);

export const getMyReviewedBookings = asyncHandler(async (req, res) =>
  ok(res, await contentService.listMyReviewedBookings(req.user?.id || req.user?._id)),
);
