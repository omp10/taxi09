import { ApiError } from '../../../../utils/ApiError.js';

/**
 * Fare breakdown for a "with driver" trip.
 *
 * Every rate is read from the admin's Set Prices row for the chosen vehicle
 * class - the client sends distance, duration and ids only. Shared by the
 * quote endpoint and anything that later charges the trip, so the customer is
 * never shown a figure computed anywhere but here.
 */

const round2 = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

/**
 * @param fare        a row from listPublicRideFares (vehicle class + its rates)
 * @param distanceKm  trip distance
 * @param durationMinutes trip duration
 */
export const priceHireDriverTrip = ({ fare, distanceKm = 0, durationMinutes = 0 }) => {
  if (!fare) {
    throw new ApiError(400, 'Selected vehicle class is not available');
  }

  const km = Math.max(0, Number(distanceKm || 0));
  const minutes = Math.max(0, Number(durationMinutes || 0));

  const baseFare = Math.max(0, round2(fare.basePrice));
  const baseDistance = Math.max(0, Number(fare.baseDistance || 0));

  // The base fare already covers `baseDistance` km; only the excess is metered.
  const chargeableKm = Math.max(0, km - baseDistance);
  const distanceFare = round2(chargeableKm * Math.max(0, Number(fare.pricePerDistance || 0)));
  const timeFare = round2(minutes * Math.max(0, Number(fare.timePrice || 0)));

  const subtotal = round2(baseFare + distanceFare + timeFare);
  const taxPercent = Math.max(0, Number(fare.serviceTaxPercent || 0));
  const taxes = round2((subtotal * taxPercent) / 100);

  return {
    vehicleClassId: fare.id,
    vehicleClassName: fare.name,
    seats: Number(fare.capacity || 0),
    baseFare,
    baseDistance,
    distanceKm: km,
    chargeableKm: round2(chargeableKm),
    pricePerDistance: Math.max(0, Number(fare.pricePerDistance || 0)),
    distanceFare,
    durationMinutes: minutes,
    timePrice: Math.max(0, Number(fare.timePrice || 0)),
    timeFare,
    subtotal,
    taxPercent,
    taxes,
    totalFare: round2(subtotal + taxes),
  };
};

export default priceHireDriverTrip;
