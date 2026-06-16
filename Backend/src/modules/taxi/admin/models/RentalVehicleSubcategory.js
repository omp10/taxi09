import mongoose from 'mongoose';

const rentalVehicleSubcategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    short_description: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    vehicleCategory: {
      type: String,
      default: 'Bike',
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    active: {
      type: Boolean,
      default: true,
    },
    image: {
      type: String,
      default: '',
      trim: true,
    },
    images: [{
      type: String,
      trim: true,
    }],
    bgClass: {
      type: String,
      default: '',
      trim: true,
    },
    borderClass: {
      type: String,
      default: '',
      trim: true,
    },
    imageScale: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true },
);

rentalVehicleSubcategorySchema.index({ name: 1, vehicleCategory: 1 });
rentalVehicleSubcategorySchema.index({ vehicleCategory: 1, status: 1 });

export const RentalVehicleSubcategory =
  mongoose.models.TaxiRentalVehicleSubcategory ||
  mongoose.model('TaxiRentalVehicleSubcategory', rentalVehicleSubcategorySchema);
