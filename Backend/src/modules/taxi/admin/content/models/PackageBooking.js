import mongoose from 'mongoose';

/**
 * A booked travel package. Domestic tours and international packages share this
 * collection via `scope`, the same way TravelPackage does.
 *
 * Every amount is written by the server from travelPackagePricingService, so
 * GST, TCS and any coupon discount are the ones actually charged.
 */
const packageBookingSchema = new mongoose.Schema(
  {
    bookingReference: { type: String, required: true, unique: true, trim: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'TaxiUser', required: true, index: true },

    travellerName: { type: String, default: '', trim: true },
    travellerPhone: { type: String, default: '', trim: true },

    scope: { type: String, enum: ['tour', 'international'], default: 'tour', index: true },
    packageSlug: { type: String, required: true, trim: true, index: true },
    packageTitle: { type: String, default: '', trim: true },
    packageImage: { type: String, default: '', trim: true },
    region: { type: String, default: '', trim: true, index: true },
    durationDays: { type: Number, default: 0, min: 0 },
    departureDate: { type: String, default: '', trim: true },

    travellers: { type: Number, default: 1, min: 1 },
    perPerson: { type: Number, default: 0, min: 0 },
    baseFare: { type: Number, default: 0, min: 0 },
    // Resolved from the package catalogue at booking time.
    addOns: [
      {
        _id: false,
        id: { type: String, default: '', trim: true },
        label: { type: String, default: '', trim: true },
        price: { type: Number, default: 0, min: 0 },
        perPerson: { type: Boolean, default: true },
      },
    ],
    addOnsTotal: { type: Number, default: 0, min: 0 },

    couponCode: { type: String, default: '', trim: true, uppercase: true },
    discount: { type: Number, default: 0, min: 0 },

    // What a membership took off this booking, so a lower total is explainable.
    memberDiscountPercent: { type: Number, default: 0, min: 0, max: 100 },
    memberDiscount: { type: Number, default: 0, min: 0 },
    gstRate: { type: Number, default: 0, min: 0 },
    gst: { type: Number, default: 0, min: 0 },
    tcsRate: { type: Number, default: 0, min: 0 },
    tcs: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, default: 0, min: 0 },

    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'confirmed',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    paymentMethod: { type: String, default: '', trim: true },
    // Razorpay handles: the order this booking raised, and the payment that
    // settled it. Kept so a signature cannot be replayed across bookings.
    paymentOrderId: { type: String, default: '', trim: true, index: true },
    paymentId: { type: String, default: '', trim: true },
  },
  { timestamps: true },
);

packageBookingSchema.index({ createdAt: -1 });

export const PackageBooking =
  mongoose.models.TaxiPackageBooking || mongoose.model('TaxiPackageBooking', packageBookingSchema);
