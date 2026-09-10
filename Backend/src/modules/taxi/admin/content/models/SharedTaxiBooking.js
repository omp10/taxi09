import mongoose from 'mongoose';

/**
 * Seats one rider holds on a shared-taxi departure.
 *
 * The matching seats on SharedTaxiTrip are flipped to `booked` in the same
 * transaction that writes this document, so the trip's seat map and the
 * bookings against it can never disagree.
 */
const sharedTaxiBookingSchema = new mongoose.Schema(
  {
    bookingReference: { type: String, required: true, unique: true, trim: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'TaxiUser', required: true, index: true },

    tripId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TaxiSharedTaxiTrip',
      required: true,
      index: true,
    },

    // Snapshotted so the booking still reads correctly if the trip is edited
    // or delisted afterwards.
    fromLabel: { type: String, default: '', trim: true },
    toLabel: { type: String, default: '', trim: true },
    travelDate: { type: String, default: '', trim: true },
    departure: { type: String, default: '', trim: true },
    vehicleName: { type: String, default: '', trim: true },
    driverName: { type: String, default: '', trim: true },

    seatLabels: { type: [String], default: [] },
    pricePerSeat: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, default: 0, min: 0 },

    passengerName: { type: String, default: '', trim: true },
    passengerPhone: { type: String, default: '', trim: true },

    status: {
      type: String,
      enum: ['confirmed', 'cancelled', 'completed'],
      default: 'confirmed',
      index: true,
    },
    // Created unpaid; only an admin action or a verified gateway callback may
    // change this, never the client.
    paid: { type: Boolean, default: false },
    paymentMethod: { type: String, default: 'cash', trim: true },
  },
  { timestamps: true },
);

sharedTaxiBookingSchema.index({ userId: 1, createdAt: -1 });

export const SharedTaxiBooking =
  mongoose.models.TaxiSharedTaxiBooking ||
  mongoose.model('TaxiSharedTaxiBooking', sharedTaxiBookingSchema);

export default SharedTaxiBooking;
