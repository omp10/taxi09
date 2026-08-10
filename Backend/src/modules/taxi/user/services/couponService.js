import { ApiError } from '../../../../utils/ApiError.js';
import { RentalCoupon } from '../../admin/models/RentalCoupon.js';

const round0 = (value) => Math.round(Number(value || 0));

/**
 * The single set of coupon rules, shared by every product that takes a code.
 *
 * Codes live in the Coupons admin (the RentalCoupon store, named for rentals
 * historically). `scope` is matched against the coupon's applies_to list, and
 * `restrictionField` names the optional array that pins a code to specific
 * items - package_ids for packages, hotel_ids for hotels. An empty array means
 * the code works across that whole product.
 *
 * Returns the discount in rupees. An empty code is not an error: it resolves to
 * a zero discount so callers can price with or without one the same way.
 */
export const resolveCoupon = async ({ code, scope, itemId, restrictionField, baseFare }) => {
  const normalized = String(code || '').trim().toUpperCase();
  if (!normalized) return { code: '', percent: 0, discount: 0, type: '' };

  const coupon = await RentalCoupon.findOne({ code: normalized }).lean();

  if (!coupon) throw new ApiError(400, 'This coupon code is not valid');
  if (!coupon.active) throw new ApiError(400, 'This coupon is no longer active');
  if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
    throw new ApiError(400, 'This coupon has expired');
  }

  const appliesTo = Array.isArray(coupon.applies_to) && coupon.applies_to.length
    ? coupon.applies_to
    : ['rental'];
  if (!appliesTo.includes(scope)) {
    throw new ApiError(400, 'This coupon does not apply to this booking');
  }

  const restrictedTo = restrictionField ? coupon[restrictionField] : null;
  if (Array.isArray(restrictedTo) && restrictedTo.length > 0) {
    const allowed = restrictedTo.some((id) => String(id) === String(itemId));
    if (!allowed) throw new ApiError(400, 'This coupon is not valid for this booking');
  }

  const minimum = Math.max(0, Number(coupon.min_booking_amount || 0));
  if (Number(baseFare || 0) < minimum) {
    throw new ApiError(400, `This coupon needs a booking of at least ₹${minimum.toLocaleString('en-IN')}`);
  }

  const amount = Math.max(0, Number(coupon.amount || 0));
  const cap = Math.max(0, Number(coupon.cap || 0));

  let discount = coupon.type === 'percent' ? round0((Number(baseFare || 0) * amount) / 100) : round0(amount);
  if (cap > 0) discount = Math.min(discount, cap);
  // Never discount more than the fare itself.
  discount = Math.min(discount, Math.max(0, Number(baseFare || 0)));

  return {
    code: normalized,
    percent: coupon.type === 'percent' ? amount : 0,
    discount,
    type: coupon.type,
  };
};

/** Hotels are pinned by hotel_ids and scoped as 'hotel'. */
export const resolveHotelCoupon = ({ code, hotelId, baseFare }) =>
  resolveCoupon({ code, scope: 'hotel', itemId: hotelId, restrictionField: 'hotel_ids', baseFare });
