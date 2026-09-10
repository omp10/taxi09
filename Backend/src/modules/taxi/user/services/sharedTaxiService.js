import mongoose from 'mongoose';
import { ApiError } from '../../../../utils/ApiError.js';
import { SharedTaxiBooking } from '../../admin/content/models/SharedTaxiBooking.js';
import { SharedTaxiTrip } from '../../admin/content/models/SharedTaxiTrip.js';

/**
 * Listing and seat booking for shared taxi departures.
 *
 * The seat reservation is the whole point of this file. Two riders opening the
 * same trip both see A2 free; whoever posts second must be rejected, not
 * silently given a seat someone else holds. That is enforced by a conditional
 * update - the seats are matched as `available` in the same operation that
 * flips them to `booked`, so the database, not this process, arbitrates.
 */

const reference = () =>
  `STX${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

const clean = (value) => String(value || '').trim();

/** Today in the YYYY-MM-DD form trips are keyed by. */
const todayKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export const listSharedTaxiTrips = async ({ travelDate } = {}) => {
  const query = { active: true };

  // Default to upcoming departures rather than every trip ever seeded, so an
  // old row cannot show up as if it were bookable.
  query.travelDate = clean(travelDate) || { $gte: todayKey() };

  const trips = await SharedTaxiTrip.find(query).sort({ travelDate: 1, departure: 1 }).lean();

  return trips.map((trip) => ({
    ...trip,
    seatsAvailable: (trip.seats || []).filter((seat) => seat.status === 'available').length,
  }));
};

export const getSharedTaxiTrip = async (tripId) => {
  if (!mongoose.Types.ObjectId.isValid(clean(tripId))) {
    throw new ApiError(400, 'A valid trip must be selected');
  }

  const trip = await SharedTaxiTrip.findById(tripId).lean();
  if (!trip || trip.active === false) {
    throw new ApiError(404, 'This trip is no longer available');
  }

  return {
    ...trip,
    seatsAvailable: (trip.seats || []).filter((seat) => seat.status === 'available').length,
  };
};

export const createSharedTaxiBooking = async ({ userId, payload = {} }) => {
  const tripId = clean(payload.tripId);
  if (!mongoose.Types.ObjectId.isValid(tripId)) {
    throw new ApiError(400, 'A valid trip must be selected');
  }

  const seatLabels = [...new Set(
    (Array.isArray(payload.seatLabels) ? payload.seatLabels : [])
      .map(clean)
      .filter(Boolean),
  )];

  if (!seatLabels.length) {
    throw new ApiError(400, 'Select at least one seat');
  }

  const trip = await SharedTaxiTrip.findById(tripId).lean();
  if (!trip || trip.active === false) {
    throw new ApiError(404, 'This trip is no longer available');
  }

  const known = new Set((trip.seats || []).map((seat) => seat.label));
  const unknown = seatLabels.filter((label) => !known.has(label));
  if (unknown.length) {
    throw new ApiError(400, `Unknown seat(s): ${unknown.join(', ')}`);
  }

  const bookingReference = reference();

  // Priced from the trip, never from the request.
  const pricePerSeat = Math.max(0, Number(trip.pricePerSeat || 0));
  const totalAmount = pricePerSeat * seatLabels.length;

  // Every named seat must still be 'available' at write time for this to match.
  // If another rider took one first, matchedCount is 0 and nothing is written.
  const claim = await SharedTaxiTrip.updateOne(
    {
      _id: trip._id,
      active: true,
      // One clause per seat: all of them must still be free for this to match.
      // $and is required because repeating the `seats` key in a single object
      // would collapse to the last clause only.
      $and: seatLabels.map((label) => ({
        seats: { $elemMatch: { label, status: 'available' } },
      })),
    },
    {
      $set: Object.fromEntries(
        seatLabels.flatMap((label, index) => [
          [`seats.$[seat_${index}].status`, 'booked'],
          [`seats.$[seat_${index}].bookingReference`, bookingReference],
        ]),
      ),
    },
    {
      arrayFilters: seatLabels.map((label, index) => ({
        [`seat_${index}.label`]: label,
        [`seat_${index}.status`]: 'available',
      })),
    },
  );

  if (!claim.modifiedCount) {
    throw new ApiError(409, 'Those seats were just taken. Please pick another seat.');
  }

  try {
    return await SharedTaxiBooking.create({
      bookingReference,
      userId,
      tripId: trip._id,
      fromLabel: clean(trip.fromLabel),
      toLabel: clean(trip.toLabel),
      travelDate: clean(trip.travelDate),
      departure: clean(trip.departure),
      vehicleName: clean(trip.vehicleName),
      driverName: clean(trip.driverName),
      seatLabels,
      pricePerSeat,
      totalAmount,
      passengerName: clean(payload.passengerName),
      passengerPhone: clean(payload.passengerPhone),
      paymentMethod: clean(payload.paymentMethod) || 'cash',
    });
  } catch (error) {
    // The seats are already held under this reference; releasing them keeps the
    // trip bookable rather than stranding seats nobody owns.
    await SharedTaxiTrip.updateOne(
      { _id: trip._id },
      {
        $set: {
          'seats.$[held].status': 'available',
          'seats.$[held].bookingReference': '',
        },
      },
      { arrayFilters: [{ 'held.bookingReference': bookingReference }] },
    ).catch(() => {});

    throw error;
  }
};

/**
 * Admin status change. Cancelling has to hand the seats back: they were flipped
 * to 'booked' against this booking's reference, and leaving them held would
 * quietly shrink the trip every time a booking is cancelled.
 */
export const updateSharedTaxiBookingStatus = async (bookingId, { status, paid } = {}) => {
  if (!mongoose.Types.ObjectId.isValid(clean(bookingId))) {
    throw new ApiError(400, 'A valid booking must be selected');
  }

  const booking = await SharedTaxiBooking.findById(bookingId);
  if (!booking) {
    throw new ApiError(404, 'Booking not found');
  }

  const nextStatus = clean(status);
  const isCancelling = nextStatus === 'cancelled' && booking.status !== 'cancelled';

  if (nextStatus) booking.status = nextStatus;
  if (typeof paid === 'boolean') booking.paid = paid;
  await booking.save();

  if (isCancelling) {
    await SharedTaxiTrip.updateOne(
      { _id: booking.tripId },
      {
        $set: {
          'seats.$[held].status': 'available',
          'seats.$[held].bookingReference': '',
        },
      },
      { arrayFilters: [{ 'held.bookingReference': booking.bookingReference }] },
    );
  }

  return booking.toObject();
};

export const listMySharedTaxiBookings = async (userId) =>
  SharedTaxiBooking.find({ userId }).sort({ createdAt: -1 }).lean();
