import mongoose from 'mongoose';

/**
 * Admin-curated membership tiers (Gold, Platinum, Black, or whatever the admin
 * decides to call them).
 *
 * Nothing about the tiers is hardcoded in the app: the names, prices, discount
 * and benefit lines all come from here, so a new tier is an admin action rather
 * than a release.
 */

const benefitSchema = new mongoose.Schema(
  {
    // Icon key resolved to a lucide icon on the client, with a fallback, so an
    // unknown key degrades to a generic mark instead of breaking the card.
    icon: { type: String, default: 'check', trim: true },
    title: { type: String, required: true, trim: true },
    subtitle: { type: String, default: '', trim: true },
  },
  { _id: false },
);

const membershipPlanSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    tagline: { type: String, default: 'MEMBER', trim: true },

    // The headline benefit, and the one the rest of the app can act on.
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },

    price: { type: Number, required: true, min: 0 },
    oldPrice: { type: Number, default: 0, min: 0 },
    durationMonths: { type: Number, default: 1, min: 1 },

    benefits: { type: [benefitSchema], default: [] },

    // Card styling. Kept to a small set of named looks so the admin picks a
    // theme rather than typing CSS.
    theme: { type: String, enum: ['gold', 'silver', 'black'], default: 'gold' },
    badge: { type: String, default: '', trim: true },

    sortOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

membershipPlanSchema.index({ active: 1, sortOrder: 1 });

export const MembershipPlan =
  mongoose.models.TaxiMembershipPlan || mongoose.model('TaxiMembershipPlan', membershipPlanSchema);
