import { ServiceStore } from '../models/ServiceStore.js';
import { ServiceLocation } from '../models/ServiceLocation.js';
import { Zone } from '../../driver/models/Zone.js';

/**
 * The city list an owner may be assigned to, and the branches each city means.
 *
 * User search resolves a typed location to service stores by name/address, then
 * filters rental vehicles on serviceStoreIds. So a car shows in Indore purely
 * because it is attached to an Indore branch - nothing else in the search path
 * knows what a "city" is.
 *
 * That makes a free-text city on the owner a silent failure: a typo never
 * matches a branch and the owner's cars never appear, with no error anywhere.
 * The fix is that the dropdown an owner picks from and the lookup that derives
 * their branches are THE SAME function. A city that cannot be picked cannot be
 * stored, and a city that is stored always resolves to at least one branch.
 */

/** Storage/comparison form. Display casing never affects matching. */
export const cityKey = (value) =>
  String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');

/**
 * "Vijay Nagar, Indore, Madhya Pradesh 452010, India" -> "Indore".
 * Last resort only: used when a store's location and zone are both unresolvable.
 */
const cityFromAddress = (address) => {
  const parts = String(address || '').split(',').map((part) => part.trim()).filter(Boolean);
  // ..., city, state pin, country
  return parts.length >= 3 ? parts[parts.length - 3] : '';
};

/** "indore" and "Indore" are one city; keep whichever label looks least like raw data. */
const betterLabel = (a, b) => {
  if (!a) return b;
  if (!b) return a;
  const caps = (value) => (value.match(/[A-Z]/g) || []).length;
  return caps(b) > caps(a) ? b : a;
};

/**
 * Some service locations were entered lower case ("indore"). Presenting that
 * back as a city name looks broken, and renaming the location would touch every
 * driver assigned to it - so casing is fixed for display only.
 */
const forDisplay = (label) =>
  /[A-Z]/.test(label)
    ? label
    : label.replace(/(^|[\s-])([a-z])/g, (_match, prefix, letter) => prefix + letter.toUpperCase());

/**
 * @returns [{ key, label, serviceStoreIds: string[] }] sorted by label.
 */
export const listRentalCities = async () => {
  const stores = await ServiceStore.find({ active: true, status: 'active' })
    .select('_id name address service_location_id zone_id')
    .lean();

  if (!stores.length) return [];

  const zoneIds = stores.map((store) => store.zone_id).filter(Boolean);
  const zones = zoneIds.length
    ? await Zone.find({ _id: { $in: zoneIds } }).select('_id service_location_id').lean()
    : [];
  const zoneById = new Map(zones.map((zone) => [String(zone._id), zone]));

  const locationIds = [
    ...stores.map((store) => store.service_location_id),
    ...zones.map((zone) => zone.service_location_id),
  ].filter(Boolean);
  const locations = locationIds.length
    ? await ServiceLocation.find({ _id: { $in: locationIds } })
        .select('_id name service_location_name')
        .lean()
    : [];
  const locationById = new Map(locations.map((item) => [String(item._id), item]));

  const nameOf = (locationId) => {
    const location = locationById.get(String(locationId || ''));
    return String(location?.service_location_name || location?.name || '').trim();
  };

  const byKey = new Map();

  for (const store of stores) {
    // A store's own service location can dangle after a location is deleted, so
    // the zone is a real fallback here, not defensive padding.
    const label =
      nameOf(store.service_location_id) ||
      nameOf(zoneById.get(String(store.zone_id || ''))?.service_location_id) ||
      cityFromAddress(store.address) ||
      String(store.name || '').split(',').pop().trim();

    const key = cityKey(label);
    if (!key) continue;

    const entry = byKey.get(key) || { key, label, serviceStoreIds: [] };
    entry.label = betterLabel(entry.label, label);
    entry.serviceStoreIds.push(String(store._id));
    byKey.set(key, entry);
  }

  return [...byKey.values()]
    .map((city) => ({ ...city, label: forDisplay(city.label) }))
    .sort((a, b) => a.label.localeCompare(b.label));
};

/**
 * The branches a set of owner cities covers. Unknown cities contribute nothing,
 * so a stale assignment yields an empty list rather than a wrong one.
 */
export const resolveServiceStoreIdsForCities = async (cities = []) => {
  const wanted = new Set((Array.isArray(cities) ? cities : [cities]).map(cityKey).filter(Boolean));
  if (!wanted.size) return [];

  const all = await listRentalCities();
  return [
    ...new Set(
      all.filter((city) => wanted.has(city.key)).flatMap((city) => city.serviceStoreIds),
    ),
  ];
};

/** Rejects anything not currently covered by a branch, so bad data cannot be stored. */
export const assertKnownCities = async (cities = []) => {
  const requested = (Array.isArray(cities) ? cities : [cities]).map(cityKey).filter(Boolean);
  if (!requested.length) return [];

  const known = new Set((await listRentalCities()).map((city) => city.key));
  const unknown = requested.filter((city) => !known.has(city));

  return { valid: [...new Set(requested.filter((city) => known.has(city)))], unknown };
};
