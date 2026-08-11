import { RentalBookingRequest } from '../../admin/models/RentalBookingRequest.js';
import { RentalVehicleUnit } from '../../admin/models/RentalVehicleUnit.js';

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
 *
 * Availability is counted against the fleet, not decided by a single booking:
 * five Balenos can take five overlapping bookings. A model line with no units
 * registered is treated as having exactly one, so the catalogue behaves as it
 * did before any fleet was entered.
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
    for (const id of vehicleIds) {
      availability.set(String(id), { available: true, unitsLeft: null, totalUnits: null, availableFrom: null, conflicts: 0 });
    }
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

  // How many cars of each model line exist, and how many are off the road for
  // this window. A retired unit never counts.
  const unitQuery = { status: { $ne: 'retired' } };
  if (vehicleIds.length) unitQuery.vehicleTypeId = { $in: vehicleIds };

  const units = await RentalVehicleUnit.find(unitQuery)
    .select('vehicleTypeId status blocks')
    .lean();

  const fleet = new Map();
  for (const unit of units) {
    const key = String(unit.vehicleTypeId);
    const entry = fleet.get(key) || { total: 0, offRoad: 0 };
    entry.total += 1;

    const blockedNow =
      unit.status === 'maintenance' ||
      (Array.isArray(unit.blocks) &&
        unit.blocks.some((block) => {
          const from = toDate(block?.from);
          const to = toDate(block?.to);
          return from && to && from < dropoff && to > pickup;
        }));

    if (blockedNow) entry.offRoad += 1;
    fleet.set(key, entry);
  }

  const clashesByType = new Map();
  for (const clash of clashes) {
    const key = String(clash.vehicleTypeId);
    const current = clashesByType.get(key) || { count: 0, latestReturn: null };
    const freeAt = toDate(clash.returnDateTime);
    clashesByType.set(key, {
      count: current.count + 1,
      // The latest overlapping return is when the last car frees up.
      latestReturn:
        current.latestReturn && freeAt && current.latestReturn > freeAt ? current.latestReturn : freeAt,
    });
  }

  for (const id of vehicleIds) {
    const key = String(id);
    // No registered units means the fleet has not been entered yet; assume one.
    const { total = 1, offRoad = 0 } = fleet.get(key) || { total: 1, offRoad: 0 };
    const { count = 0, latestReturn = null } = clashesByType.get(key) || {};

    const unitsLeft = Math.max(total - offRoad - count, 0);

    availability.set(key, {
      available: unitsLeft > 0,
      unitsLeft,
      totalUnits: total,
      // Only meaningful once nothing is left; otherwise it is bookable now.
      availableFrom: unitsLeft > 0 ? null : latestReturn,
      conflicts: count,
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
