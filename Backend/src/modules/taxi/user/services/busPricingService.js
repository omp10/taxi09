/**
 * What a bus booking costs.
 *
 * The client sends seat ids and add-on ids - never an amount. Seat prices are
 * resolved by the caller from the service's own blueprint, and extras are
 * resolved here from the service's own catalogue, so an unknown or inactive
 * add-on is dropped rather than charged.
 *
 * Kept pure and free of the database so it can be tested on its own.
 */

const round2 = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

/** Percentages arrive from stored data; keep them inside a sane range. */
const clampPercent = (value) => Math.min(100, Math.max(0, Number(value) || 0));

/**
 * Extras chosen by id, priced from the service's catalogue.
 * A `perSeat` extra bills once per passenger.
 */
const resolveAddOns = ({ catalog = [], requested = [], seatCount = 1 }) => {
  const ids = (Array.isArray(requested) ? requested : [])
    .map((entry) => String(entry?.id ?? entry ?? '').trim())
    .filter(Boolean);

  const available = Array.isArray(catalog) ? catalog : [];

  return [...new Set(ids)]
    .map((id) => available.find((item) => String(item.id) === id && item.active !== false))
    .filter(Boolean)
    .map((item) => {
      const unit = Math.max(0, round2(item.price));
      return {
        id: item.id,
        label: item.label,
        perSeat: Boolean(item.perSeat),
        price: item.perSeat ? round2(unit * Math.max(1, seatCount)) : unit,
      };
    });
};

/**
 * @param seatPrices  one price per seat being booked
 * @param addOnCatalog  the bus service's own addOns array
 * @param addOnIds  ids the passenger chose
 * @param memberDiscountPercent  read from the database by the caller
 */
export const priceBusBooking = ({
  seatPrices = [],
  addOnCatalog = [],
  addOnIds = [],
  memberDiscountPercent = 0,
}) => {
  const seatCount = seatPrices.length;
  const seatAmount = round2(seatPrices.reduce((sum, price) => sum + Math.max(0, Number(price) || 0), 0));

  const addOns = resolveAddOns({ catalog: addOnCatalog, requested: addOnIds, seatCount });
  const addOnsTotal = round2(addOns.reduce((sum, item) => sum + item.price, 0));

  // A membership discounts the whole booking, seats and extras alike, which is
  // how it already behaves for rentals, hotels and packages.
  const subtotal = round2(seatAmount + addOnsTotal);
  const memberPercent = clampPercent(memberDiscountPercent);
  const memberDiscount = round2((subtotal * memberPercent) / 100);

  return {
    seatCount,
    seatAmount,
    addOns,
    addOnsTotal,
    subtotal,
    memberDiscountPercent: memberPercent,
    memberDiscount,
    totalAmount: Math.max(0, round2(subtotal - memberDiscount)),
  };
};

export default priceBusBooking;
