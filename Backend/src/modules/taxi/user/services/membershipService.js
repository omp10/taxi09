import { ApiError } from '../../../../utils/ApiError.js';
import { MembershipPlan } from '../../admin/content/models/MembershipPlan.js';
import { UserMembership } from '../../admin/content/models/UserMembership.js';

/**
 * Buying and reading memberships.
 *
 * The price is taken from the plan, never from the request, and the record is
 * always created unpaid - only a verified Razorpay signature flips it, through
 * the shared booking payment service.
 */

const reference = () => `MEM${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 900 + 100)}`;

const GST_RATE = 0.18;
const round0 = (value) => Math.round(Number(value) || 0);

/**
 * Breakdown for the checkout screen.
 *
 * The plan price is what the member is charged, GST included - so the tax line
 * is the portion contained within that price, not an addition to it. Listing it
 * as an extra would mean the total no longer matched the advertised price.
 */
export const priceMembership = (plan) => {
  const total = Math.max(0, round0(plan.price));
  const listPrice = Math.max(total, round0(plan.oldPrice));
  const gst = round0(total - total / (1 + GST_RATE));

  return {
    listPrice,
    discount: listPrice - total,
    discountPercent: listPrice > 0 ? Math.round(((listPrice - total) / listPrice) * 100) : 0,
    gst,
    gstRate: GST_RATE * 100,
    gstIncluded: true,
    baseFare: total - gst,
    totalAmount: total,
  };
};

/** The membership currently in force, or null. Expiry is checked on read. */
export const getActiveMembership = async (userId) => {
  if (!userId) return null;

  const membership = await UserMembership.findOne({
    userId,
    status: 'confirmed',
    paymentStatus: 'paid',
    expiresAt: { $gt: new Date() },
  })
    .sort({ expiresAt: -1 })
    .lean();

  return membership || null;
};

/**
 * Starts a purchase. Returns the unpaid membership row; the caller then raises a
 * payment order against it.
 */
export const purchaseMembership = async ({ userId, planId }) => {
  if (!userId) throw new ApiError(401, 'Sign in to buy a membership');

  const plan = await MembershipPlan.findOne({ _id: planId, active: true }).lean();
  if (!plan) throw new ApiError(404, 'Membership plan not found');

  const active = await getActiveMembership(userId);
  if (active) {
    throw new ApiError(400, `You already have an active ${active.planName} membership`);
  }

  // Any abandoned attempt at the same plan is reused, so repeated taps on
  // "Continue to Payment" do not litter the account with dead rows.
  const pending = await UserMembership.findOne({ userId, planId: plan._id, paymentStatus: 'pending' });
  if (pending) {
    pending.totalAmount = plan.price;
    pending.discountPercent = plan.discountPercent;
    pending.durationMonths = plan.durationMonths;
    await pending.save();
    return { membership: pending.toObject(), plan, quote: priceMembership(plan) };
  }

  const created = await UserMembership.create({
    userId,
    bookingReference: reference(),
    planId: plan._id,
    planSlug: plan.slug,
    planName: plan.name,
    discountPercent: plan.discountPercent,
    durationMonths: plan.durationMonths,
    totalAmount: plan.price,
    status: 'pending',
    paymentStatus: 'pending',
  });

  return { membership: created.toObject(), plan, quote: priceMembership(plan) };
};

export const listMyMemberships = async (userId) =>
  UserMembership.find({ userId }).sort({ createdAt: -1 }).lean();
