import mongoose from 'mongoose';

/**
 * A scheduled shared-taxi departure that riders buy individual seats on.
 *
 * Unlike every other cab flow this is inventory, not dispatch: the trip exists
 * before anyone books, and seats are finite. `seats` therefore carries the
 * authoritative per-seat state - a booking flips a seat to `booked` inside a
 * transaction, so two riders cannot both take A2.
 */
const seatSchema = new mongoose.Schema(
  {
    _id: false,
    label: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['available', 'booked', 'blocked'],
      default: 'available',
    },
    // Set when status is 'booked', so a cancellation can free the right seat.
    bookingReference: { type: String, default: '', trim: true },
  },
  { _id: false },
);

const sharedTaxiTripSchema = new mongoose.Schema(
  {
    fromLabel: { type: String, required: true, trim: true },
    toLabel: { type: String, required: true, trim: true },

    // Stored as YYYY-MM-DD: the listing screen groups departures by day and
    // never needs a timezone-sensitive comparison.
    travelDate: { type: String, required: true, trim: true, index: true },
    departure: { type: String, default: '', trim: true },
    duration: { type: String, default: '', trim: true },

    pricePerSeat: { type: Number, required: true, min: 0 },

    vehicleName: { type: String, default: '', trim: true },
    vehiclePlate: { type: String, default: '', trim: true },
    driverName: { type: String, default: '', trim: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },

    seats: { type: [seatSchema], default: [] },

    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

sharedTaxiTripSchema.index({ active: 1, travelDate: 1, departure: 1 });

/** Seats a rider may still choose. Derived, never stored, so it cannot drift. */
sharedTaxiTripSchema.virtual('seatsAvailable').get(function seatsAvailable() {
  return this.seats.filter((seat) => seat.status === 'available').length;
});

sharedTaxiTripSchema.set('toJSON', { virtuals: true });
sharedTaxiTripSchema.set('toObject', { virtuals: true });

export const SharedTaxiTrip =
  mongoose.models.TaxiSharedTaxiTrip ||
  mongoose.model('TaxiSharedTaxiTrip', sharedTaxiTripSchema);

export default SharedTaxiTrip;
