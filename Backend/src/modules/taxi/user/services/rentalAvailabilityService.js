import { RentalBookingRequest } from '../../admin/models/RentalBookingRequest.js';

/**
 * Which rental vehicles are free for a requested window.
 *
 * A vehicle is held from the moment a booking starts until it is returned, so
 * two bookings clash when they overlap at all. Touching windows do not clash:
 * a car returned at 10:00 can go out again at 10:00.
 *
 *   existing.pickup < requested.return  AND  existing.return > requested.pickup
 *
 * Statuses that have finished or been called off release the vehicle.
 */

const RELEASED_STATUSES = new Set(['completed', 'cancelled', 'rejected', 'expired']);

const toDate = (value) => {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

/**
 * @returns Map of vehicleId -> { available, availableFrom, conflicts }
 */
export const getRentalAvailability = async ({
  pickupDateTime,
  returnDateTime,
  vehicleIds = [],
  // Bookings are upserted on their reference, so a re-submit (a retry, or a
  // second payment attempt) must not be treated as clashing with itself.
  excludeBookingReference = '',
}) => {
  const pickup = toDate(pickupDateTime);
  const dropoff = toDate(returnDateTime);
  const availability = new Map();

  // Without a window there is nothing to clash with - everything is bookable.
  if (!pickup || !dropoff || dropoff <= pickup) {
    for (const id of vehicleIds) availability.set(String(id), { available: true, availableFrom: null, conflicts: 0 });
    return availability;
  }

  const query = {
    status: { $nin: [...RELEASED_STATUSES] },
    pickupDateTime: { $lt: dropoff },
    returnDateTime: { $gt: pickup },
  };
  if (vehicleIds.length) query.vehicleTypeId = { $in: vehicleIds };
  if (excludeBookingReference) query.bookingReference = { $ne: excludeBookingReference };

  const clashes = await RentalBookingRequest.find(query)
    .select('vehicleTypeId returnDateTime')
    .lean();

  for (const id of vehicleIds) availability.set(String(id), { available: true, availableFrom: null, conflicts: 0 });

  for (const clash of clashes) {
    const key = String(clash.vehicleTypeId);
    const current = availability.get(key) || { available: true, availableFrom: null, conflicts: 0 };
    const freeAt = toDate(clash.returnDateTime);

    availability.set(key, {
      available: false,
      // The latest overlapping return is when the vehicle actually frees up.
      availableFrom:
        current.availableFrom && freeAt && current.availableFrom > freeAt ? current.availableFrom : freeAt,
      conflicts: current.conflicts + 1,
    });
  }

  return availability;
};

/** Convenience for a single vehicle. */
export const isRentalVehicleAvailable = async ({
  vehicleId,
  pickupDateTime,
  returnDateTime,
  excludeBookingReference = '',
}) => {
  const map = await getRentalAvailability({
    pickupDateTime,
    returnDateTime,
    vehicleIds: [vehicleId],
    excludeBookingReference,
  });
  return map.get(String(vehicleId)) || { available: true, availableFrom: null, conflicts: 0 };
};

/** Exported for tests: the overlap predicate on its own. */
export const windowsOverlap = (aStart, aEnd, bStart, bEnd) =>
  toDate(aStart) < toDate(bEnd) && toDate(aEnd) > toDate(bStart);
