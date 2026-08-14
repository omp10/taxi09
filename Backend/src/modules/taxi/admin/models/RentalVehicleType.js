import mongoose from 'mongoose';

const rentalVehicleSeatCellSchema = new mongoose.Schema(
  {
    kind: {
      type: String,
      enum: ['seat', 'aisle'],
      default: 'seat',
    },
    id: {
      type: String,
      default: '',
      trim: true,
    },
    label: {
      type: String,
      default: '',
      trim: true,
    },
    variant: {
      type: String,
      default: 'seat',
      trim: true,
    },
    status: {
      type: String,
      enum: ['available', 'blocked'],
      default: 'available',
    },
  },
  { _id: false },
);

const rentalVehiclePricingSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    durationHours: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    includedKm: {
      type: Number,
      default: 0,
      min: 0,
    },
    extraHourPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    extraKmPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false },
);

/**
 * Optional extras offered with a rental. Priced per booking (not per day) and
 * validated server-side against this list, so the client can only pick ids -
 * never set a price.
 */
const rentalVehicleAddOnSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Pre-discount price. Shown struck through next to `price`; ignored unless
    // it is actually higher than what the customer pays.
    originalPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Lucide icon name rendered by the booking screens.
    icon: {
      type: String,
      default: 'Package',
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false },
);

const rentalVehicleAdvancePaymentSchema = new mongoose.Schema(
  {
    enabled: {
      type: Boolean,
      default: false,
    },
    paymentMode: {
      type: String,
      enum: ['full', 'percentage', 'fixed'],
      default: 'percentage',
    },
    amount: {
      type: Number,
      default: 20,
      min: 0,
    },
    label: {
      type: String,
      default: 'Advance booking payment',
      trim: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { _id: false },
);

const rentalVehicleSubscriptionPlanSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    durationDays: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    includedKm: {
      type: Number,
      default: 0,
      min: 0,
    },
    extraKmPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    deposit: {
      type: Number,
      default: 0,
      min: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false },
);

const rentalVehicleSubscriptionSchema = new mongoose.Schema(
  {
    enabled: {
      type: Boolean,
      default: false,
    },
    plans: {
      type: [rentalVehicleSubscriptionPlanSchema],
      default: [],
    },
  },
  { _id: false },
);

const rentalVehicleTypeSchema = new mongoose.Schema(
  {
    transport_type: {
      type: String,
      default: 'rental',
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    // Blank until an admin sets it; the listing filters hide facets that no
    // vehicle declares rather than showing invented counts.
    transmission: {
      type: String,
      enum: ['', 'manual', 'automatic'],
      default: '',
      trim: true,
      lowercase: true,
    },
    fuel: {
      type: String,
      default: '',
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
      default: 'Car',
      trim: true,
    },
    rentalSubcategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TaxiRentalVehicleSubcategory',
      default: null,
    },
    rentalSubcategoryName: {
      type: String,
      default: '',
      trim: true,
    },
    image: {
      type: String,
      default: '',
      trim: true,
    },
    coverImage: {
      type: String,
      default: '',
      trim: true,
    },
    galleryImages: {
      type: [String],
      default: [],
    },
    map_icon: {
      type: String,
      default: '',
      trim: true,
    },
    capacity: {
      type: Number,
      default: 4,
      min: 1,
    },
    luggageCapacity: {
      type: Number,
      default: 0,
      min: 0,
    },
    amenities: {
      type: [String],
      default: [],
    },
    /**
     * What the rental price covers - insurance, FASTag, toll and so on.
     *
     * Free text per vehicle rather than a fixed list, because what is bundled
     * differs by vehicle and by city. Empty means the customer page shows no
     * "Package Includes" section, which is the honest state for a vehicle
     * nobody has filled this in for.
     */
    packageIncludes: {
      type: [String],
      default: [],
    },
    serviceStoreIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'TaxiServiceStore',
      default: [],
    },
    poolingEnabled: {
      type: Boolean,
      default: false,
    },
    blueprint: {
      templateKey: {
        type: String,
        default: 'compact_4',
        trim: true,
      },
      lowerDeck: {
        type: [[rentalVehicleSeatCellSchema]],
        default: [],
      },
      upperDeck: {
        type: [[rentalVehicleSeatCellSchema]],
        default: [],
      },
    },
    pricing: {
      type: [rentalVehiclePricingSchema],
      default: [],
    },
    addOns: {
      type: [rentalVehicleAddOnSchema],
      default: [],
    },
    advancePayment: {
      type: rentalVehicleAdvancePaymentSchema,
      default: () => ({
        enabled: false,
        paymentMode: 'percentage',
        amount: 20,
        label: 'Advance booking payment',
        notes: '',
      }),
    },
    subscription: {
      type: rentalVehicleSubscriptionSchema,
      default: () => ({
        enabled: false,
        plans: [],
      }),
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
  },
  { timestamps: true },
);

rentalVehicleTypeSchema.index({ name: 1, transport_type: 1 });
rentalVehicleTypeSchema.index({ status: 1, active: 1 });

export const RentalVehicleType =
  mongoose.models.TaxiRentalVehicleType ||
  mongoose.model('TaxiRentalVehicleType', rentalVehicleTypeSchema);


