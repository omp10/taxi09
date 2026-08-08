import mongoose from 'mongoose';

/**
 * A car a user has offered to put on the platform.
 *
 * The application is saved step by step, so a half-filled form survives the app
 * being closed. Only `submitted` hands it to the admin queue; up to that point
 * it is the owner's private draft.
 */

const fileSchema = new mongoose.Schema(
  {
    url: { type: String, default: '', trim: true },
    fileName: { type: String, default: '', trim: true },
    uploadedAt: { type: Date, default: null },
  },
  { _id: false },
);

/** Every slot is the same shape, so the wizard can drive them from a list. */
const fileGroup = (keys) =>
  keys.reduce((shape, key) => ({ ...shape, [key]: { type: fileSchema, default: () => ({}) } }), {});

export const REQUIRED_DOCUMENTS = ['rcCertificate', 'insurance', 'puc', 'drivingLicense', 'aadhaar'];
export const OPTIONAL_DOCUMENTS = ['serviceRecords'];
export const REQUIRED_PHOTOS = ['front', 'rear', 'left', 'right', 'odometer', 'fuelLevel'];
export const REQUIRED_CERTIFICATES = ['fitnessCertificate', 'permit'];

const attachedVehicleSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'TaxiUser', required: true, index: true },
    reference: { type: String, required: true, unique: true, index: true },

    // Vehicle
    brand: { type: String, default: '', trim: true },
    model: { type: String, default: '', trim: true },
    variant: { type: String, default: '', trim: true },
    year: { type: Number, default: null },
    fuelType: { type: String, default: '', trim: true },
    transmission: { type: String, default: '', trim: true },
    registrationNumber: { type: String, default: '', trim: true, uppercase: true },

    // Pricing and availability
    dailyFare: { type: Number, default: 0, min: 0 },
    securityDeposit: { type: Number, default: 0, min: 0 },
    availability: { type: String, default: '', trim: true },
    availableFrom: { type: String, default: '', trim: true },
    availableTo: { type: String, default: '', trim: true },

    // Where it can be picked up
    city: { type: String, default: '', trim: true },
    preferredAreas: { type: [String], default: [] },

    documents: { type: new mongoose.Schema(fileGroup([...REQUIRED_DOCUMENTS, ...OPTIONAL_DOCUMENTS]), { _id: false }), default: () => ({}) },
    photos: { type: new mongoose.Schema(fileGroup([...REQUIRED_PHOTOS, ...REQUIRED_CERTIFICATES]), { _id: false }), default: () => ({}) },

    // How far the owner got, so the wizard reopens where they left off.
    step: { type: Number, default: 1, min: 1, max: 5 },

    status: {
      type: String,
      enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected'],
      default: 'draft',
      index: true,
    },
    submittedAt: { type: Date, default: null },
    reviewedAt: { type: Date, default: null },
    reviewNote: { type: String, default: '', trim: true },
  },
  { timestamps: true },
);

attachedVehicleSchema.index({ userId: 1, createdAt: -1 });

export const AttachedVehicle =
  mongoose.models.TaxiAttachedVehicle || mongoose.model('TaxiAttachedVehicle', attachedVehicleSchema);
