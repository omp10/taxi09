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
  const { results } = await contentService.listHotels({ city: req.query.city, active: true });
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

  ok(res, priceHotelStay({
    hotel,
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

  ok(res, await quotePackage({
    pkg,
    travellers: payload.travellers,
    couponCode: payload.couponCode,
    addOns: payload.addOns,
  }));
});

export const getPublicContentBlocks = asyncHandler(async (req, res) =>
  ok(res, { blocks: await contentService.getContentBlockMap(req.query.keys) }),
);
