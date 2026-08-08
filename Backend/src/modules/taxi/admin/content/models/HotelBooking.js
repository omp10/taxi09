import mongoose from 'mongoose';

/**
 * A confirmed hotel stay. Every amount is written by the server from
 * hotelPricingService - nothing here is taken from the client.
 */
const hotelBookingSchema = new mongoose.Schema(
  {
    bookingReference: { type: String, required: true, unique: true, trim: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'TaxiUser', required: true, index: true },

    guestName: { type: String, default: '', trim: true },
    guestPhone: { type: String, default: '', trim: true },

    hotelSlug: { type: String, required: true, trim: true, index: true },
    hotelName: { type: String, default: '', trim: true },
    hotelCity: { type: String, default: '', trim: true, index: true },
    hotelImage: { type: String, default: '', trim: true },

    roomKey: { type: String, default: '', trim: true },
    roomName: { type: String, default: '', trim: true },

    checkIn: { type: String, default: '', trim: true },
    checkOut: { type: String, default: '', trim: true },
    nights: { type: Number, default: 1, min: 1 },
    rooms: { type: Number, default: 1, min: 1 },
    guests: { type: Number, default: 1, min: 1 },

    nightlyRate: { type: Number, default: 0, min: 0 },
    roomCharges: { type: Number, default: 0, min: 0 },
    // Resolved from the hotel's catalogue at booking time, so the record keeps
    // what was actually charged.
    addOns: [
      {
        _id: false,
        id: { type: String, default: '', trim: true },
        label: { type: String, default: '', trim: true },
        price: { type: Number, default: 0, min: 0 },
        perNight: { type: Boolean, default: false },
      },
    ],
    addOnsTotal: { type: Number, default: 0, min: 0 },
    taxPercent: { type: Number, default: 0, min: 0 },
    // What a membership took off this booking, so a lower total is explainable.
    memberDiscountPercent: { type: Number, default: 0, min: 0, max: 100 },
    memberDiscount: { type: Number, default: 0, min: 0 },
    taxes: { type: Number, default: 0, min: 0 },
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

hotelBookingSchema.index({ createdAt: -1 });

export const HotelBooking =
  mongoose.models.TaxiHotelBooking || mongoose.model('TaxiHotelBooking', hotelBookingSchema);
