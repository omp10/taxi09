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
