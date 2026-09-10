import { asyncHandler } from '../../../../../utils/asyncHandler.js';
import { HireDriverBooking } from '../models/HireDriverBooking.js';
import { HotelBooking } from '../models/HotelBooking.js';
import { PackageBooking } from '../models/PackageBooking.js';
import {
  createHotelBooking,
  createPackageBooking,
  listMyHotelBookings,
  listMyPackageBookings,
} from '../../../user/services/bookingService.js';
import {
  createHireDriverBooking,
  listMyHireDriverBookings,
  quoteHireDriver,
} from '../../../user/services/hireDriverBookingService.js';
import {
  createSharedTaxiBooking,
  getSharedTaxiTrip,
  listMySharedTaxiBookings,
  listSharedTaxiTrips,
  updateSharedTaxiBookingStatus,
} from '../../../user/services/sharedTaxiService.js';
import { SharedTaxiBooking } from '../models/SharedTaxiBooking.js';
import { SharedTaxiTrip } from '../models/SharedTaxiTrip.js';
import {
  createBookingPaymentOrder,
  verifyBookingPayment,
} from '../../../user/services/bookingPaymentService.js';

const ok = (res, data, status = 200) => res.status(status).json({ success: true, data });

/* ------------------------------------------------------------ user facing */

export const postHotelBooking = asyncHandler(async (req, res) =>
  ok(res, await createHotelBooking({ userId: req.auth?.sub, payload: req.body || {} }), 201),
);

export const getMyHotelBookings = asyncHandler(async (req, res) =>
  ok(res, { results: await listMyHotelBookings(req.auth?.sub) }),
);

export const postPackageBooking = asyncHandler(async (req, res) =>
  ok(res, await createPackageBooking({ userId: req.auth?.sub, payload: req.body || {} }), 201),
);

export const getMyPackageBookings = asyncHandler(async (req, res) =>
  ok(res, { results: await listMyPackageBookings(req.auth?.sub) }),
);

/* ---------------------------------------------------------- hire a driver */

// Quote first, book second: the confirmation screen renders this quote so the
// rider sees the same figure the booking is later written with.
export const postHireDriverQuote = asyncHandler(async (req, res) => {
  const { profile, ...quote } = await quoteHireDriver({
    hireDriverId: req.body?.hireDriverId,
    plan: req.body?.plan,
  });

  ok(res, {
    ...quote,
    driverName: profile?.name || '',
    vehicleName: profile?.vehicleName || '',
  });
});

export const postHireDriverBooking = asyncHandler(async (req, res) =>
  ok(res, await createHireDriverBooking({ userId: req.auth?.sub, payload: req.body || {} }), 201),
);

export const getMyHireDriverBookings = asyncHandler(async (req, res) =>
  ok(res, { results: await listMyHireDriverBookings(req.auth?.sub) }),
);

/* ------------------------------------------------------------ shared taxi */

export const getPublicSharedTaxiTrips = asyncHandler(async (req, res) =>
  ok(res, { results: await listSharedTaxiTrips({ travelDate: req.query.travelDate }) }),
);

// Seat maps are read live rather than carried in navigation state, so a rider
// who lingers on the listing does not pick from a stale map.
export const getPublicSharedTaxiTrip = asyncHandler(async (req, res) =>
  ok(res, await getSharedTaxiTrip(req.params.id)),
);

export const postSharedTaxiBooking = asyncHandler(async (req, res) =>
  ok(res, await createSharedTaxiBooking({ userId: req.auth?.sub, payload: req.body || {} }), 201),
);

export const getMySharedTaxiBookings = asyncHandler(async (req, res) =>
  ok(res, { results: await listMySharedTaxiBookings(req.auth?.sub) }),
);

export const adminListSharedTaxiTrips = asyncHandler(async (req, res) =>
  ok(res, { results: await SharedTaxiTrip.find().sort({ travelDate: -1 }).limit(300).lean() }),
);

export const adminCreateSharedTaxiTrip = asyncHandler(async (req, res) =>
  ok(res, await SharedTaxiTrip.create(req.body || {}), 201),
);

export const adminUpdateSharedTaxiTrip = asyncHandler(async (req, res) =>
  ok(res, await SharedTaxiTrip.findByIdAndUpdate(req.params.id, req.body || {}, { new: true })),
);

export const adminDeleteSharedTaxiTrip = asyncHandler(async (req, res) => {
  await SharedTaxiTrip.findByIdAndDelete(req.params.id);
  ok(res, { deleted: true });
});

export const adminListSharedTaxiBookings = asyncHandler(async (req, res) =>
  ok(res, { results: await SharedTaxiBooking.find().sort({ createdAt: -1 }).limit(300).lean() }),
);

/**
 * Ops fulfilment: move an engagement through its lifecycle, and mark it paid.
 * Only admin may set `paid` - a booking is always created unpaid.
 */
export const adminUpdateHireDriverBooking = asyncHandler(async (req, res) => {
  const update = {};
  if (req.body?.status) update.status = String(req.body.status).trim();
  if (typeof req.body?.paid === 'boolean') update.paid = req.body.paid;

  ok(
    res,
    await HireDriverBooking.findByIdAndUpdate(req.params.id, { $set: update }, { new: true }).lean(),
  );
});

// Delegated so cancelling releases the seats - see the service for why.
export const adminUpdateSharedTaxiBooking = asyncHandler(async (req, res) =>
  ok(res, await updateSharedTaxiBookingStatus(req.params.id, {
    status: req.body?.status,
    paid: req.body?.paid,
  })),
);

export const adminListHireDriverBookings = asyncHandler(async (req, res) => {
  const query = {};
  if (req.query.status) query.status = String(req.query.status).trim();

  ok(res, {
    results: await HireDriverBooking.find(query).sort({ createdAt: -1 }).limit(200).lean(),
  });
});

/* --------------------------------------------------------------- payment */

export const postBookingPaymentOrder = asyncHandler(async (req, res) =>
  ok(res, await createBookingPaymentOrder({
    kind: req.params.kind,
    bookingId: req.params.id,
    userId: req.auth?.sub,
  })),
);

export const postBookingPaymentVerify = asyncHandler(async (req, res) =>
  ok(res, await verifyBookingPayment({
    kind: req.params.kind,
    bookingId: req.params.id,
    userId: req.auth?.sub,
    orderId: req.body?.razorpay_order_id,
    paymentId: req.body?.razorpay_payment_id,
    signature: req.body?.razorpay_signature,
  })),
);

/* ----------------------------------------------------------------- admin */

const buildQuery = ({ status, paymentStatus, search }, searchFields) => {
  const query = {};
  if (status) query.status = status;
  if (paymentStatus) query.paymentStatus = paymentStatus;

  const term = String(search || '').trim();
  if (term) {
    query.$or = searchFields.map((field) => ({ [field]: { $regex: term, $options: 'i' } }));
  }
  return query;
};

export const getAdminHotelBookings = asyncHandler(async (req, res) => {
  const query = buildQuery(req.query, ['bookingReference', 'hotelName', 'hotelCity', 'guestName', 'guestPhone']);
  const results = await HotelBooking.find(query)
    .populate('userId', 'name phone email')
    .sort({ createdAt: -1 })
    .limit(Math.min(500, Number(req.query.limit) || 200))
    .lean();

  ok(res, { results, total: await HotelBooking.countDocuments(query) });
});

export const getAdminPackageBookings = asyncHandler(async (req, res) => {
  const query = buildQuery(req.query, ['bookingReference', 'packageTitle', 'region', 'travellerName', 'travellerPhone']);
  if (req.query.scope) query.scope = req.query.scope;

  const results = await PackageBooking.find(query)
    .populate('userId', 'name phone email')
    .sort({ createdAt: -1 })
    .limit(Math.min(500, Number(req.query.limit) || 200))
    .lean();

  ok(res, { results, total: await PackageBooking.countDocuments(query) });
});

/**
 * Admin is the only path that can mark a booking paid, since bookings are
 * always created pending.
 */
const patchStatus = (Model) =>
  asyncHandler(async (req, res) => {
    const update = {};
    if (req.body?.status) update.status = req.body.status;
    if (req.body?.paymentStatus) update.paymentStatus = req.body.paymentStatus;

    const booking = await Model.findByIdAndUpdate(req.params.id, { $set: update }, { new: true }).lean();
    ok(res, booking);
  });

export const updateAdminHotelBooking = patchStatus(HotelBooking);
export const updateAdminPackageBooking = patchStatus(PackageBooking);

/**
 * Every booking across every product, normalised onto one shape so the unified
 * admin screen can render and sort them together.
 */
export const getAdminAllBookings = asyncHandler(async (req, res) => {
  const limit = Math.min(500, Number(req.query.limit) || 200);

  // Imported lazily: these live in the older taxi modules and pulling them in
  // at module scope would create an import cycle with the admin routes.
  const [{ Ride }, { BusBooking }, { RentalBookingRequest }] = await Promise.all([
    import('../../../user/models/Ride.js'),
    import('../../../user/models/BusBooking.js'),
    import('../../models/RentalBookingRequest.js'),
  ]);

  const asRow = (product, id, reference, title, subtitle, amount, status, paymentStatus, createdAt, customer) => ({
    product, id: String(id), reference: reference || '', title: title || '', subtitle: subtitle || '',
    amount: Number(amount || 0), status: status || '', paymentStatus: paymentStatus || '',
    createdAt, customer: customer || '',
  });

  const [hotels, packages, rides, buses, rentals, hireDrivers, sharedTaxis] = await Promise.all([
    HotelBooking.find().populate('userId', 'name phone').sort({ createdAt: -1 }).limit(limit).lean(),
    PackageBooking.find().populate('userId', 'name phone').sort({ createdAt: -1 }).limit(limit).lean(),
    Ride.find().select('rideCode fare status paymentStatus createdAt pickupAddress dropAddress serviceType').sort({ createdAt: -1 }).limit(limit).lean().catch(() => []),
    BusBooking.find().sort({ createdAt: -1 }).limit(limit).lean().catch(() => []),
    RentalBookingRequest.find().sort({ createdAt: -1 }).limit(limit).lean().catch(() => []),
    HireDriverBooking.find().populate('userId', 'name phone').sort({ createdAt: -1 }).limit(limit).lean().catch(() => []),
    SharedTaxiBooking.find().populate('userId', 'name phone').sort({ createdAt: -1 }).limit(limit).lean().catch(() => []),
  ]);

  const rows = [
    ...hotels.map((b) => asRow('Hotel', b._id, b.bookingReference, b.hotelName, `${b.roomName || 'Room'} · ${b.nights} night(s)`, b.totalAmount, b.status, b.paymentStatus, b.createdAt, b.userId?.name || b.guestName)),
    ...packages.map((b) => asRow(b.scope === 'international' ? 'International' : 'Tour', b._id, b.bookingReference, b.packageTitle, `${b.travellers} traveller(s) · ${b.region}`, b.totalAmount, b.status, b.paymentStatus, b.createdAt, b.userId?.name || b.travellerName)),
    ...rides.map((b) => asRow('Ride', b._id, b.rideCode, b.pickupAddress, b.dropAddress, b.fare, b.status, b.paymentStatus, b.createdAt, '')),
    ...buses.map((b) => asRow('Bus', b._id, b.bookingCode || b.bookingReference, b.operatorName || b.busName, `${(b.passengers || []).length || b.seatCount || 0} seat(s)`, b.totalFare ?? b.totalAmount, b.status, b.paymentStatus, b.createdAt, b.contactName)),
    ...rentals.map((b) => asRow('Rental', b._id, b.bookingReference, b.vehicleName, b.selectedPackage?.label, b.totalCost, b.status, b.paymentStatus, b.createdAt, b.customerName)),
    ...hireDrivers.map((b) => asRow('Driver', b._id, b.bookingReference, b.hireDriverName, `${b.plan} engagement`, b.totalAmount, b.status, b.paid ? 'paid' : 'pending', b.createdAt, b.userId?.name || b.customerName)),
    ...sharedTaxis.map((b) => asRow('Shared Taxi', b._id, b.bookingReference, `${b.fromLabel} to ${b.toLabel}`, `${(b.seatLabels || []).length} seat(s) · ${b.travelDate}`, b.totalAmount, b.status, b.paid ? 'paid' : 'pending', b.createdAt, b.userId?.name || b.passengerName)),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  ok(res, { results: rows, total: rows.length });
});
