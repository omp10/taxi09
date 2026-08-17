import mongoose from 'mongoose';

/**
 * A customer review of a vehicle they actually rented.
 *
 * "Verified" here is structural, not a badge someone toggles: a review cannot
 * exist without a booking reference, and the service only accepts one whose
 * booking belongs to the reviewing user and has actually completed. That is
 * the whole point of this model - the homepage previously carried
 * admin-authored testimonials and hardcoded 4.8 ratings, which say nothing
 * about the vehicle and cannot be audited.
 *
 * Aggregates are deliberately NOT stored on the vehicle. A denormalised
 * average drifts the moment a review is edited, hidden or deleted, and the
 * read volume here does not justify the risk - the average is computed from
 * published reviews at read time.
 */
const reviewSchema = new mongoose.Schema(
  {
    /** Who wrote it. Required, so an anonymous review is impossible. */
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TaxiUser',
      required: true,
      index: true,
    },
    /** Denormalised for display only - never used to identify the author. */
    userName: { type: String, default: '', trim: true },

    /**
     * The booking being reviewed. Required and unique: it is what makes the
     * review verifiable, and the unique index is what stops one booking being
     * reviewed repeatedly to inflate a score.
     */
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
      index: true,
    },
    /**
     * Which booking collection `bookingId` points at. Rentals, rides and bus
     * trips are separate models, so the reference needs its own discriminator
     * rather than a guess at read time.
     */
    bookingType: {
      type: String,
      enum: ['rental', 'ride', 'bus', 'hotel', 'package'],
      required: true,
    },

    /** What was rented. Optional: a ride review has a driver, not a vehicle. */
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TaxiRentalVehicleType',
      default: null,
      index: true,
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TaxiHireDriver',
      default: null,
      index: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: { type: String, default: '', trim: true, maxlength: 120 },
    comment: { type: String, default: '', trim: true, maxlength: 2000 },

    /**
     * Photos the customer attached. The handover already captures odometer and
     * condition shots, so this is for their own trip pictures.
     */
    images: { type: [String], default: [] },

    /**
     * Moderation. Reviews land as `pending` and a human publishes them, so a
     * defamatory or spam review never appears unattended. Rejecting keeps the
     * row - deleting it would let the same booking be reviewed again.
     */
    status: {
      type: String,
      enum: ['pending', 'published', 'rejected'],
      default: 'pending',
      index: true,
    },
    /** Why it was rejected, for the admin's own record. Never shown publicly. */
    moderationNote: { type: String, default: '', trim: true },

    /** The business's reply, shown under the review. */
    response: { type: String, default: '', trim: true },
    respondedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// The public read: published reviews for one vehicle, newest first.
reviewSchema.index({ vehicleId: 1, status: 1, createdAt: -1 });
// The moderation queue.
reviewSchema.index({ status: 1, createdAt: -1 });

export const Review = mongoose.models.TaxiReview || mongoose.model('TaxiReview', reviewSchema);
