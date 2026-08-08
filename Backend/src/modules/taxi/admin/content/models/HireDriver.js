import mongoose from 'mongoose';

/**
 * Drivers available for hire (permanent / monthly / outstation engagements).
 * Distinct from the `Driver` model, which is a platform login account - these
 * are curated, admin-listed profiles surfaced on the "hire a driver" flow.
 */
const hireDriverSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    photo: { type: String, default: '', trim: true },

    badge: { type: String, default: '', trim: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    trips: { type: String, default: '0', trim: true },
    experience: { type: String, default: '', trim: true },
    languages: { type: [String], default: [] },

    // Vehicle the driver brings, when they supply one.
    vehicleName: { type: String, default: '', trim: true },
    vehiclePlate: { type: String, default: '', trim: true },
    vehicleColor: { type: String, default: '', trim: true },
    // Free text (Sedan / SUV / Hatchback) shown as a chip beside the car name.
    vehicleClass: { type: String, default: '', trim: true },
    vehicleImage: { type: String, default: '', trim: true },
    seats: { type: Number, default: 0, min: 0 },
    amenities: { type: [String], default: [] },

    city: { type: String, default: '', trim: true, index: true },
    etaMinutes: { type: Number, default: 0, min: 0 },
    distanceKm: { type: Number, default: 0, min: 0 },

    // Engagement types this driver accepts.
    hireTypes: {
      type: [String],
      default: ['permanent'],
      enum: ['permanent', 'monthly', 'outstation', 'hourly'],
    },

    monthlySalary: { type: Number, default: 0, min: 0 },
    dailyRate: { type: Number, default: 0, min: 0 },
    hourlyRate: { type: Number, default: 0, min: 0 },

    verified: { type: Boolean, default: false },
    available: { type: Boolean, default: true, index: true },

    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

hireDriverSchema.index({ active: 1, available: 1, sortOrder: 1 });

export const HireDriver =
  mongoose.models.TaxiHireDriver || mongoose.model('TaxiHireDriver', hireDriverSchema);
