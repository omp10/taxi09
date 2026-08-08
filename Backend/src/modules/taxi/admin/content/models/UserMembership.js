import mongoose from 'mongoose';

/**
 * A purchased membership.
 *
 * The money-carrying field names deliberately match the hotel and package
 * bookings (`totalAmount`, `bookingReference`, `paymentOrderId`, `paymentStatus`,
 * `status`), so the shared Razorpay service drives this too instead of a third
 * copy of the same order-and-verify dance.
 *
 * Plan details are snapshotted at purchase: an admin editing the Gold tier later
 * must not silently change what an existing member paid for.
 */
const userMembershipSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'TaxiUser', required: true, index: true },
    bookingReference: { type: String, required: true, unique: true, index: true },

    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'TaxiMembershipPlan', required: true },
    planSlug: { type: String, default: '', trim: true },
    planName: { type: String, default: '', trim: true },

    // Snapshot - not read back from the plan.
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    durationMonths: { type: Number, default: 1, min: 1 },
    totalAmount: { type: Number, required: true, min: 0 },

    startsAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null, index: true },

    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'expired'],
      default: 'pending',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
      index: true,
    },
    paymentOrderId: { type: String, default: '', trim: true },
    paymentId: { type: String, default: '', trim: true },
    paymentMethod: { type: String, default: '', trim: true },
  },
  { timestamps: true },
);

/**
 * The membership starts when it is paid for, not when the row was created.
 *
 * Doing this in a hook rather than in the payment service is what lets the
 * shared service stay unaware that memberships exist.
 */
userMembershipSchema.pre('save', async function setValidityOnPayment() {
  if (this.paymentStatus === 'paid' && !this.startsAt) {
    const now = new Date();
    const expires = new Date(now);
    expires.setMonth(expires.getMonth() + Math.max(1, Number(this.durationMonths) || 1));

    this.startsAt = now;
    this.expiresAt = expires;
  }
});

userMembershipSchema.index({ userId: 1, status: 1, expiresAt: -1 });

export const UserMembership =
  mongoose.models.TaxiUserMembership || mongoose.model('TaxiUserMembership', userMembershipSchema);
