import { ApiError } from '../../../../utils/ApiError.js';
import { resolveCoupon } from './couponService.js';

/**
 * Pricing for domestic tours and international packages.
 *
 * The client sends a package slug, traveller count and an optional coupon code
 * - never an amount. Indian levies on tour packages:
 *   - GST 5% on the package fare (both domestic and overseas).
 *   - TCS 5% under s.206C(1G), collected at source on overseas packages only.
 *
 * TCS is charged on the pre-discount fare because it is collected on the amount
 * remitted, not on what the operator discounts.
 *
 * Coupons live in the Coupons admin (the RentalCoupon store, which now carries
 * an `applies_to` scope) so codes can be added or retired without a deploy.
 */

/** Percentages arrive from stored data; keep them inside a sane range. */
const clampPercent = (value) => Math.min(100, Math.max(0, Number(value) || 0));

const round0 = (value) => Math.round(Number(value || 0));

export const GST_RATE = 0.05;
export const TCS_RATE = 0.05;

/**
 * Looks a code up and rejects it unless it is active, unexpired, in scope for
 * this package and above any minimum. Returns the discount in rupees.
 */
export const resolvePackageCoupon = ({ code, scope, packageId, baseFare }) =>
  resolveCoupon({ code, scope, itemId: packageId, restrictionField: 'package_ids', baseFare });

/** Resolves the code then prices the package - what the endpoint calls. */
export const quotePackage = async ({ pkg, travellers = 1, couponCode = '', addOns = [], memberDiscountPercent = 0 }) => {
  if (!pkg) throw new ApiError(404, 'Package not found');

  const scope = pkg.scope === 'international' ? 'international' : 'tour';
  const perPerson = Math.max(0, round0(pkg.price));
  const baseFare = perPerson * Math.max(1, Math.floor(Number(travellers) || 1));

  const coupon = await resolvePackageCoupon({ code: couponCode, scope, packageId: pkg._id, baseFare });
  return priceTravelPackage({ pkg, travellers, coupon, addOns, memberDiscountPercent });
};

/**
 * Pure arithmetic. `coupon` is already resolved (see resolvePackageCoupon), so
 * this stays synchronous and unit-testable without a database.
 */
/** Extras priced from the package's own catalogue; the client sends ids only. */
const resolveAddOns = (pkg, requested, travellers) => {
  const ids = Array.isArray(requested)
    ? requested.map((item) => String(item?.id ?? item ?? '').trim()).filter(Boolean)
    : [];
  const catalog = Array.isArray(pkg.addOns) ? pkg.addOns : [];

  return [...new Set(ids)]
    .map((id) => catalog.find((item) => String(item.id) === id && item.active !== false))
    .filter(Boolean)
    .map((item) => {
      const unit = Math.max(0, round0(item.price));
      return {
        id: item.id,
        label: item.label,
        perPerson: item.perPerson !== false,
        price: item.perPerson !== false ? unit * travellers : unit,
      };
    });
};

export const priceTravelPackage = ({
  pkg,
  travellers = 1,
  coupon = { code: '', percent: 0, discount: 0 },
  addOns = [],
  memberDiscountPercent = 0,
}) => {
  if (!pkg) {
    throw new ApiError(404, 'Package not found');
  }

  const scope = pkg.scope === 'international' ? 'international' : 'tour';
  const perPerson = Math.max(0, round0(pkg.price));
  const count = Math.max(1, Math.floor(Number(travellers) || 1));
  const baseFare = perPerson * count;

  const selectedAddOns = resolveAddOns(pkg, addOns, count);
  const addOnsTotal = round0(selectedAddOns.reduce((sum, item) => sum + item.price, 0));

  // A coupon and a membership stack, the membership taking its cut of whatever
  // is left once the coupon has been applied - so the two can never combine to
  // more than the fare itself.
  const afterCoupon = Math.max(0, baseFare - coupon.discount) + addOnsTotal;
  const memberPercent = clampPercent(memberDiscountPercent);
  const memberDiscount = round0((afterCoupon * memberPercent) / 100);

  const taxable = Math.max(0, afterCoupon - memberDiscount);

  const gst = round0(taxable * GST_RATE);
  // Overseas packages only, and on the fare before any discount - s.206C(1G)
  // follows the gross fare, so neither the coupon nor the membership reduces it.
  const tcs = scope === 'international' ? round0(baseFare * TCS_RATE) : 0;

  return {
    slug: pkg.slug,
    title: pkg.title || pkg.name || '',
    scope,
    perPerson,
    travellers: count,
    baseFare,
    addOns: selectedAddOns,
    addOnsTotal,
    couponCode: coupon.code,
    couponPercent: coupon.percent,
    discount: coupon.discount,
    memberDiscountPercent: memberPercent,
    memberDiscount,
    taxable,
    gstRate: GST_RATE,
    gst,
    tcsRate: scope === 'international' ? TCS_RATE : 0,
    tcs,
    totalAmount: taxable + gst + tcs,
    // Only a genuinely higher figure is a saving.
    savings: Number(pkg.oldPrice) > perPerson ? round0((Number(pkg.oldPrice) - perPerson) * count) : 0,
  };
};

export default priceTravelPackage;
