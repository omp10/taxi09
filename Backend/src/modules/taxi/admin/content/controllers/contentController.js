import { asyncHandler } from '../../../../../utils/asyncHandler.js';
import * as contentService from '../services/contentService.js';
import { priceHotelStay } from '../../../user/services/hotelPricingService.js';
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

  ok(res, priceHotelStay({
    hotel,
    memberDiscountPercent: await getMemberDiscountPercent(req.auth?.sub),
    roomKey: payload.roomKey,
    checkIn: payload.checkIn,
    checkOut: payload.checkOut,
    rooms: payload.rooms,
    guests: payload.guests,
    addOns: payload.addOns,
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
