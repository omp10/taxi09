import { ApiError } from '../../../../utils/ApiError.js';

/**
 * The single source of truth for what a rental booking costs.
 *
 * Both the quote endpoint and booking creation call this, so the price a
 * customer is shown is computed by exactly the same code that charges them.
 * The client only ever sends ids - package id and add-on ids - and every
 * amount is read from the vehicle's own admin-managed catalogue.
 */

/** Percentages arrive from stored data; keep them inside a sane range. */
const clampPercent = (value) => Math.min(100, Math.max(0, Number(value) || 0));

const round2 = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

const resolvePackage = (vehicle, packageId) => {
  const wanted = String(packageId || '').trim();
  const pricing = Array.isArray(vehicle.pricing) ? vehicle.pricing : [];

  const matched = pricing.find(
    (item) => String(item?.id || item?.packageId || '').trim() === wanted && item?.active !== false,
  );

  if (!matched) {
    throw new ApiError(400, 'Selected rental package is invalid');
  }
  return matched;
};

const resolveAddOns = (vehicle, requested) => {
  const ids = Array.isArray(requested)
    ? requested.map((item) => String(item?.id ?? item ?? '').trim()).filter(Boolean)
    : [];

  const catalog = Array.isArray(vehicle.addOns) ? vehicle.addOns : [];

  // Unknown or deactivated ids are dropped rather than rejected: an add-on the
  // admin retires mid-session should not block the booking, just not be charged.
  return [...new Set(ids)]
    .map((id) => catalog.find((item) => String(item.id) === id && item.active !== false))
    .filter(Boolean)
    .map((item) => {
      const price = Math.max(0, round2(item.price));
      const originalPrice = Math.max(0, round2(item.originalPrice));
      return {
        id: item.id,
        label: item.label,
        price,
        // Guarded again here so a stale row written before the guard existed
        // cannot produce a negative saving.
        originalPrice: originalPrice > price ? originalPrice : 0,
      };
    });
};

const resolveAdvanceAmount = (config, totalCost) => {
  if (!config?.enabled) return 0;

  const mode = String(config.paymentMode || '').trim().toLowerCase();
  const amount = Math.max(0, Number(config.amount || 0));

  if (mode === 'full') return totalCost;
  if (mode === 'percentage') return (totalCost * amount) / 100;
  return amount;
};

/**
 * @param vehicle  a RentalVehicleType document (lean or hydrated)
 * @param packageId  id of the chosen entry in vehicle.pricing
 * @param addOns  ids (or {id} objects) of the chosen add-ons
 * @param extraHours  hours beyond the package duration, charged at extraHourPrice
 */
export const priceRentalBooking = ({ vehicle, packageId, addOns = [], extraHours = 0, memberDiscountPercent = 0 }) => {
  const matchedPackage = resolvePackage(vehicle, packageId);
  const selectedAddOns = resolveAddOns(vehicle, addOns);

  const packagePrice = Math.max(0, round2(matchedPackage.price));
  const addOnsTotal = round2(selectedAddOns.reduce((sum, item) => sum + item.price, 0));
  const addOnsSavings = round2(
    selectedAddOns.reduce((sum, item) => sum + (item.originalPrice ? item.originalPrice - item.price : 0), 0),
  );

  const extraHourPrice = Math.max(0, Number(matchedPackage.extraHourPrice || 0));
  const billableExtraHours = Math.max(0, Number(extraHours || 0));
  const extraHoursTotal = round2(extraHourPrice * billableExtraHours);

  // A membership discounts the whole rental. The advance is derived from the
  // total below, so it follows the discounted figure without extra handling.
  const subtotal = round2(packagePrice + addOnsTotal + extraHoursTotal);
  const memberPercent = clampPercent(memberDiscountPercent);
  const memberDiscount = round2((subtotal * memberPercent) / 100);
  const totalCost = Math.max(0, round2(subtotal - memberDiscount));

  const advanceConfig = vehicle.advancePayment || {};
  const payableNow = Math.min(totalCost, round2(Math.max(0, resolveAdvanceAmount(advanceConfig, totalCost))));

  return {
    matchedPackage,
    packageId: String(matchedPackage.id || matchedPackage.packageId || ''),
    packageLabel: matchedPackage.label || '',
    packagePrice,
    includedKm: Math.max(0, Number(matchedPackage.includedKm || 0)),
    extraKmPrice: Math.max(0, Number(matchedPackage.extraKmPrice || 0)),
    extraHourPrice,
    extraHours: billableExtraHours,
    extraHoursTotal,
    addOns: selectedAddOns,
    addOnsTotal,
    addOnsSavings,
    subtotal,
    memberDiscountPercent: memberPercent,
    memberDiscount,
    totalCost,
    payableNow,
    balanceDue: round2(totalCost - payableNow),
    advancePayment: {
      enabled: Boolean(advanceConfig.enabled),
      paymentMode: String(advanceConfig.paymentMode || 'percentage'),
      amount: Math.max(0, Number(advanceConfig.amount || 0)),
      label: String(advanceConfig.label || '').trim() || 'Advance booking payment',
      notes: String(advanceConfig.notes || '').trim(),
    },
  };
};

export default priceRentalBooking;
