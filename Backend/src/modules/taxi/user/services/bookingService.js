import { ApiError } from '../../../../utils/ApiError.js';
import { HotelBooking } from '../../admin/content/models/HotelBooking.js';
import { PackageBooking } from '../../admin/content/models/PackageBooking.js';
import * as contentService from '../../admin/content/services/contentService.js';
import { priceHotelStay } from './hotelPricingService.js';
import { quotePackage } from './travelPackagePricingService.js';
import { getMemberDiscountPercent } from './membershipService.js';

/**
 * Creation and listing for hotel and package bookings.
 *
 * The client sends what it chose - a slug, a room, dates, traveller count - and
 * the server re-prices it before writing. No amount from the request is ever
 * persisted, so a tampered payload cannot change what is charged.
 */

const reference = (prefix) =>
  `${prefix}${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

const clean = (value) => String(value || '').trim();

// A booking is always created unpaid. Only a verified gateway callback or an
// admin action may mark it paid - otherwise the client could simply claim it.

/* ------------------------------------------------------------------ hotels */

export const createHotelBooking = async ({ userId, payload }) => {
  const hotel = await contentService.getHotelBySlug(payload.slug || payload.hotelSlug);

  // Re-priced here; the request's own totals are ignored, and the membership
  // discount is read from the database rather than taken from the request.
  const quote = priceHotelStay({
    hotel,
    memberDiscountPercent: await getMemberDiscountPercent(userId),
    roomKey: payload.roomKey,
    checkIn: payload.checkIn,
    checkOut: payload.checkOut,
    rooms: payload.rooms,
    guests: payload.guests,
    addOns: payload.addOns,
  });

  if (!quote.totalAmount) {
    throw new ApiError(400, 'This stay could not be priced');
  }

  return HotelBooking.create({
    bookingReference: reference('HTL'),
    userId,
    guestName: clean(payload.guestName),
    guestPhone: clean(payload.guestPhone),
    hotelSlug: hotel.slug,
    hotelName: hotel.name,
    hotelCity: hotel.city,
    hotelImage: hotel.image || hotel.gallery?.[0] || '',
    roomKey: quote.roomKey,
    roomName: quote.roomName,
    checkIn: clean(payload.checkIn),
    checkOut: clean(payload.checkOut),
    nights: quote.nights,
    rooms: quote.rooms,
    guests: quote.guests,
    nightlyRate: quote.nightlyRate,
    roomCharges: quote.roomCharges,
    addOns: quote.addOns,
    addOnsTotal: quote.addOnsTotal,
    taxPercent: quote.taxPercent,
    taxes: quote.taxes,
    memberDiscountPercent: quote.memberDiscountPercent,
    memberDiscount: quote.memberDiscount,
    totalAmount: quote.totalAmount,
    paymentStatus: 'pending',
    paymentMethod: clean(payload.paymentMethod),
  });
};

export const listMyHotelBookings = (userId) =>
  HotelBooking.find({ userId }).sort({ createdAt: -1 }).lean();

/* ---------------------------------------------------------------- packages */

export const createPackageBooking = async ({ userId, payload }) => {
  const pkg = await contentService.getTravelPackageBySlug(payload.slug || payload.packageSlug);

  const quote = await quotePackage({
    pkg,
    memberDiscountPercent: await getMemberDiscountPercent(userId),
    travellers: payload.travellers,
    couponCode: payload.couponCode,
    addOns: payload.addOns,
  });

  if (!quote.totalAmount) {
    throw new ApiError(400, 'This package could not be priced');
  }

  return PackageBooking.create({
    bookingReference: reference('PKG'),
    userId,
    travellerName: clean(payload.travellerName),
    travellerPhone: clean(payload.travellerPhone),
    scope: quote.scope,
    packageSlug: pkg.slug,
    packageTitle: quote.title,
    packageImage: pkg.image || pkg.gallery?.[0] || '',
    region: pkg.country || pkg.state || '',
    durationDays: Number(pkg.durationDays || 0),
    departureDate: clean(payload.departureDate || pkg.departureDate),
    travellers: quote.travellers,
    perPerson: quote.perPerson,
    baseFare: quote.baseFare,
    addOns: quote.addOns,
    addOnsTotal: quote.addOnsTotal,
    couponCode: quote.couponCode,
    discount: quote.discount,
    gstRate: quote.gstRate,
    gst: quote.gst,
    memberDiscountPercent: quote.memberDiscountPercent,
    memberDiscount: quote.memberDiscount,
    tcsRate: quote.tcsRate,
    tcs: quote.tcs,
    totalAmount: quote.totalAmount,
    paymentStatus: 'pending',
    paymentMethod: clean(payload.paymentMethod),
  });
};

export const listMyPackageBookings = (userId) =>
  PackageBooking.find({ userId }).sort({ createdAt: -1 }).lean();
