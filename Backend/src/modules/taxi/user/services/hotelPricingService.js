import { ApiError } from '../../../../utils/ApiError.js';

/**
 * Room charges and tax for a hotel stay.
 *
 * The client sends a hotel slug, a room key and dates - never an amount. The
 * nightly rate is the hotel's base price scaled by the room's priceMultiplier,
 * which is the rule the booking screens used to apply on their own.
 *
 * GST follows the Indian slab for hotel accommodation, charged per room per
 * night on the tariff: 12% up to Rs.7,500, 18% above it.
 */

const round2 = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

const GST_THRESHOLD = 7500;
const GST_BELOW = 12;
const GST_ABOVE = 18;

export const gstPercentFor = (nightlyRate) => (Number(nightlyRate) > GST_THRESHOLD ? GST_ABOVE : GST_BELOW);

const nightsBetween = (checkIn, checkOut) => {
  const start = new Date(checkIn);
  const end = new Date(checkOut);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;

  const diff = Math.ceil((end - start) / 86400000);
  return diff > 0 ? diff : 1;
};

/**
 * @param hotel    a Hotel document (lean or hydrated)
 * @param roomKey  key of the chosen entry in hotel.rooms; defaults to the first
 * @param rooms    number of rooms booked
 */
/**
 * Extras are priced from the hotel's own catalogue; the client sends ids only.
 * A `perNight` extra bills per night per room.
 */
const resolveAddOns = ({ hotel, requested, nights, rooms }) => {
  const ids = Array.isArray(requested)
    ? requested.map((item) => String(item?.id ?? item ?? '').trim()).filter(Boolean)
    : [];
  const catalog = Array.isArray(hotel.addOns) ? hotel.addOns : [];

  return [...new Set(ids)]
    .map((id) => catalog.find((item) => String(item.id) === id && item.active !== false))
    .filter(Boolean)
    .map((item) => {
      const unit = Math.max(0, round2(item.price));
      return {
        id: item.id,
        label: item.label,
        perNight: Boolean(item.perNight),
        price: item.perNight ? round2(unit * nights * rooms) : unit,
      };
    });
};

export const priceHotelStay = ({ hotel, roomKey, checkIn, checkOut, rooms = 1, guests = 1, addOns = [] }) => {
  if (!hotel) {
    throw new ApiError(404, 'Hotel not found');
  }

  const available = (Array.isArray(hotel.rooms) ? hotel.rooms : []).filter((item) => item?.active !== false);
  const wanted = String(roomKey || '').trim();
  const room = (wanted && available.find((item) => String(item.key) === wanted)) || available[0] || null;

  if (wanted && !available.some((item) => String(item.key) === wanted)) {
    throw new ApiError(400, 'Selected room type is not available');
  }

  const basePrice = Math.max(0, Number(hotel.price || 0));
  const multiplier = room ? Math.max(0, Number(room.priceMultiplier ?? 1)) : 1;
  const nightlyRate = round2(basePrice * multiplier);

  const nights = nightsBetween(checkIn, checkOut);
  const roomCount = Math.max(1, Math.floor(Number(rooms) || 1));

  const roomCharges = round2(nightlyRate * nights * roomCount);

  const selectedAddOns = resolveAddOns({ hotel, requested: addOns, nights, rooms: roomCount });
  const addOnsTotal = round2(selectedAddOns.reduce((sum, item) => sum + item.price, 0));

  // The slab is decided by the per-night tariff, not the booking total, and
  // extras are taxed at the same rate as the room they accompany.
  const taxPercent = gstPercentFor(nightlyRate);
  const taxes = round2(((roomCharges + addOnsTotal) * taxPercent) / 100);

  return {
    hotelSlug: hotel.slug,
    hotelName: hotel.name,
    roomKey: room?.key || '',
    roomName: room?.name || '',
    nightlyRate,
    basePrice,
    priceMultiplier: multiplier,
    nights,
    rooms: roomCount,
    guests: Math.max(1, Math.floor(Number(guests) || 1)),
    roomCharges,
    addOns: selectedAddOns,
    addOnsTotal,
    taxPercent,
    taxes,
    totalAmount: round2(roomCharges + addOnsTotal + taxes),
    // Only a genuinely higher figure is a saving.
    savings: Number(hotel.oldPrice) > basePrice
      ? round2((Number(hotel.oldPrice) - basePrice) * multiplier * nights * roomCount)
      : 0,
    // Nightly rate for every room type, so the room cards never have to
    // multiply anything themselves.
    roomRates: available.map((item) => {
      const rate = round2(basePrice * Math.max(0, Number(item.priceMultiplier ?? 1)));
      return { key: item.key, name: item.name, nightlyRate: rate, taxPercent: gstPercentFor(rate) };
    }),
  };
};

export default priceHotelStay;
