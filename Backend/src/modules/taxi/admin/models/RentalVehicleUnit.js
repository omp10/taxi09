import mongoose from 'mongoose';

/**
 * A period a unit is off the road: servicing, damage, or being moved between
 * branches. Counted against availability exactly like a booking is.
 */
const unitBlockSchema = new mongoose.Schema(
  {
    from: {
      type: Date,
      required: true,
    },
    to: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      enum: ['service', 'damage', 'transfer', 'other'],
      default: 'service',
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { _id: true, timestamps: true },
);

/**
 * One physical car.
 *
 * RentalVehicleType is a model line - "Maruti Baleno 2024-25" - and carries
 * everything the customer sees: photos, pricing, amenities. This is the car
 * itself, which is what the operator manages and what availability counts.
 * A customer books "a Baleno from Vijay Nagar"; staff then assign a specific
 * registration to that booking.
 *
 * Availability treats a type with no units as having exactly one, so the
 * catalogue behaves as it did before any units were registered.
 */
const rentalVehicleUnitSchema = new mongoose.Schema(
  {
    vehicleTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TaxiRentalVehicleType',
      required: true,
      index: true,
    },
    registrationNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    serviceStoreId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TaxiServiceStore',
      default: null,
      index: true,
    },
    /**
     * 'available' is the only status that can be booked. 'maintenance' takes it
     * off the road without losing its history; 'retired' means it has left the
     * fleet and should never count again.
     */
    status: {
      type: String,
      enum: ['available', 'maintenance', 'retired'],
      default: 'available',
      index: true,
    },
    odometerKm: {
      type: Number,
      default: 0,
      min: 0,
    },
    colour: {
      type: String,
      default: '',
      trim: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    blocks: {
      type: [unitBlockSchema],
      default: [],
    },
    activeFrom: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

// A registration plate identifies one car, so it cannot repeat in the fleet.
rentalVehicleUnitSchema.index({ registrationNumber: 1 }, { unique: true });
rentalVehicleUnitSchema.index({ vehicleTypeId: 1, serviceStoreId: 1, status: 1 });

export const RentalVehicleUnit =
  mongoose.models.TaxiRentalVehicleUnit ||
  mongoose.model('TaxiRentalVehicleUnit', rentalVehicleUnitSchema);
