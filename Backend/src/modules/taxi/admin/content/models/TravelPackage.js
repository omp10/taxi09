import mongoose from 'mongoose';

/**
 * Domestic tour packages and international trips share one shape, so they share
 * one collection and are separated by `scope`. Keeps the admin UI and the public
 * API to a single implementation.
 */
const travelPackageSchema = new mongoose.Schema(
  {
    scope: {
      type: String,
      enum: ['domestic', 'international'],
      default: 'domestic',
      index: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },

    // Domestic uses `state`, international uses `country`. Both optional so one
    // schema serves both without forcing empty fields on the other.
    state: { type: String, default: '', trim: true },
    country: { type: String, default: '', trim: true },

    category: { type: String, default: '', trim: true, index: true },
    badge: { type: String, default: '', trim: true },
    badgeTone: { type: String, default: 'bg-[#FFC107] text-[#111827]', trim: true },

    stops: { type: [String], default: [] },
    includes: { type: [String], default: [] },
    // What the fare does not cover. Kept per package rather than assumed, since
    // it differs between a domestic tour and an overseas one.
    excludes: { type: [String], default: [] },
    perks: { type: [String], default: [] },
    highlights: { type: [String], default: [] },

    image: { type: String, default: '', trim: true },
    gallery: { type: [String], default: [] },
    photos: { type: Number, default: 0 },

    durationDays: { type: Number, default: 1, min: 1 },
    durationLabel: { type: String, default: '', trim: true },
    departureDate: { type: String, default: '', trim: true },

    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviews: { type: String, default: '0', trim: true },

    price: { type: Number, required: true, min: 0 },
    oldPrice: { type: Number, default: 0, min: 0 },

    // Optional extras. `perPerson` multiplies by the traveller count.
    addOns: {
      type: [
        new mongoose.Schema(
          {
            id: { type: String, required: true, trim: true },
            label: { type: String, required: true, trim: true },
            price: { type: Number, default: 0, min: 0 },
            perPerson: { type: Boolean, default: true },
            active: { type: Boolean, default: true },
          },
          { _id: false },
        ),
      ],
      default: [],
    },

    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

travelPackageSchema.index({ scope: 1, active: 1, sortOrder: 1 });

export const TravelPackage =
  mongoose.models.TaxiTravelPackage || mongoose.model('TaxiTravelPackage', travelPackageSchema);
