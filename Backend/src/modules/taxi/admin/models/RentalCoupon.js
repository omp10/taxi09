import mongoose from 'mongoose';

const rentalCouponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    type: {
      type: String,
      enum: ['flat', 'percent'],
      default: 'flat',
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    cap: {
      type: Number,
      default: 0,
      min: 0,
    },
    min_booking_amount: {
      type: Number,
      default: 0,
      min: 0,
    },
    expiry_date: {
      type: Date,
      required: true,
      index: true,
    },
    user_specific: {
      type: Boolean,
      default: false,
      index: true,
    },
    // Which products this code works on. Named for rentals historically, but
    // the same store now backs tour and international package coupons.
    applies_to: {
      type: [String],
      enum: ['rental', 'tour', 'international', 'hotel'],
      default: ['rental'],
      index: true,
    },
    // Optional restriction to specific hotels, mirroring package_ids.
    hotel_ids: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'TaxiHotel',
        },
      ],
      default: [],
      index: true,
    },
    // Optional restriction to specific travel packages, mirroring vehicle_ids.
    package_ids: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'TaxiTravelPackage',
        },
      ],
      default: [],
      index: true,
    },
    vehicle_ids: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'TaxiRentalVehicleType',
        },
      ],
      default: [],
      index: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

export const RentalCoupon =
  mongoose.models.TaxiRentalCoupon || mongoose.model('TaxiRentalCoupon', rentalCouponSchema);
