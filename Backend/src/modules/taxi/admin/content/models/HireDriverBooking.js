import mongoose from 'mongoose';

/**
 * A request to engage one curated driver from the "hire a driver" listing.
 *
 * Deliberately not a Ride: a Ride is dispatched to whoever is nearest, which is
 * exactly wrong here - the rider picked a specific person, and ops fulfils that
 * engagement by hand. Modelled on PackageBooking/HotelBooking, which book
 * curated inventory the same way.
 *
 * Every amount is written by the server from hireDriverBookingService, so a
 * tampered payload cannot change what is charged.
 */
const hireDriverBookingSchema = new mongoose.Schema(
  {
    bookingReference: { type: String, required: true, unique: true, trim: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'TaxiUser', required: true, index: true },

    customerName: { type: String, default: '', trim: true },
    customerPhone: { type: String, default: '', trim: true },

    // Snapshotted so the booking still reads correctly if the profile is later
    // edited or delisted.
    hireDriverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TaxiHireDriver',
      required: true,
      index: true,
    },
    hireDriverName: { type: String, default: '', trim: true },
    hireDriverPhoto: { type: String, default: '', trim: true },
    vehicleName: { type: String, default: '', trim: true },
    vehiclePlate: { type: String, default: '', trim: true },

    plan: {
      type: String,
      enum: ['permanent', 'monthly', 'daily', 'hourly'],
      default: 'permanent',
      index: true,
    },
    startDate: { type: String, default: '', trim: true },
    driverPreference: { type: String, default: '', trim: true },
    instructions: { type: String, default: '', trim: true },

    // Priced server-side: the retainer from the driver's profile plus the fixed
    // allowances from the `hireDriver.permanentFare` content block.
    driverCharges: { type: Number, default: 0, min: 0 },
    allowances: [
      {
        _id: false,
        label: { type: String, default: '', trim: true },
        amount: { type: Number, default: 0, min: 0 },
      },
    ],
    allowancesTotal: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, default: 0, min: 0 },

    status: {
      type: String,
      enum: ['requested', 'confirmed', 'active', 'completed', 'cancelled'],
      default: 'requested',
      index: true,
    },
    // A booking is always created unpaid; only an admin action or a verified
    // gateway callback may change that.
    paid: { type: Boolean, default: false },
  },
  { timestamps: true },
);

hireDriverBookingSchema.index({ userId: 1, createdAt: -1 });

export const HireDriverBooking =
  mongoose.models.TaxiHireDriverBooking ||
  mongoose.model('TaxiHireDriverBooking', hireDriverBookingSchema);

export default HireDriverBooking;
