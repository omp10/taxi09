/**
 * Prepares the owner marketplace: gives every owner a validated city list, and
 * clears the stale references that would otherwise make a city resolve to
 * nothing.
 *
 * An owner's city is what attaches their vehicles to a service branch, and a
 * branch is what puts a vehicle into a customer's search results. Before this,
 * city was free text - one owner is on record with "d6hf hmm kb" - so a city
 * that matched no branch failed silently and for ever. Anything that cannot be
 * matched to a real branch is left blank here on purpose, so an admin has to
 * assign it rather than it looking assigned but doing nothing.
 *
 *   node scripts/migrateOwnerCities.js           # report only, changes nothing
 *   node scripts/migrateOwnerCities.js --apply   # write
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { Owner } from '../src/modules/taxi/admin/models/Owner.js';
import { ServiceStore } from '../src/modules/taxi/admin/models/ServiceStore.js';
import { ServiceLocation } from '../src/modules/taxi/admin/models/ServiceLocation.js';
import { Zone } from '../src/modules/taxi/driver/models/Zone.js';
import { RentalVehicleType } from '../src/modules/taxi/admin/models/RentalVehicleType.js';
import { listRentalCities, cityKey } from '../src/modules/taxi/admin/services/rentalCityService.js';

const apply = process.argv.includes('--apply');
const log = (...args) => console.log(...args);

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB_NAME });
  log(apply ? '=== APPLYING ===' : '=== DRY RUN (pass --apply to write) ===');

  // 1. A store whose service location has been deleted resolves to no city, so
  //    the city it serves disappears from the list owners can pick from.
  const stores = await ServiceStore.find().select('_id name service_location_id zone_id').lean();
  const locationIds = new Set(
    (await ServiceLocation.find().select('_id').lean()).map((item) => String(item._id)),
  );

  for (const store of stores) {
    if (store.service_location_id && locationIds.has(String(store.service_location_id))) continue;

    const zone = store.zone_id ? await Zone.findById(store.zone_id).select('service_location_id').lean() : null;
    if (!zone?.service_location_id || !locationIds.has(String(zone.service_location_id))) {
      log(`  ! store "${store.name}" has no resolvable service location - fix in admin`);
      continue;
    }

    log(`  store "${store.name}": service_location_id ${store.service_location_id} -> ${zone.service_location_id} (from its zone)`);
    if (apply) {
      await ServiceStore.updateOne({ _id: store._id }, { $set: { service_location_id: zone.service_location_id } });
    }
  }

  // 2. Rental vehicles pointing at deleted branches. Harmless today but they
  //    make a vehicle look attached to a city that no longer exists.
  const liveStoreIds = new Set(stores.map((store) => String(store._id)));
  for (const vehicle of await RentalVehicleType.find().select('name serviceStoreIds').lean()) {
    const current = (vehicle.serviceStoreIds || []).map(String);
    const kept = current.filter((id) => liveStoreIds.has(id));
    if (kept.length === current.length) continue;

    log(`  vehicle "${vehicle.name}": dropping ${current.length - kept.length} dead branch reference(s)`);
    if (apply) {
      await RentalVehicleType.updateOne(
        { _id: vehicle._id },
        { $set: { serviceStoreIds: kept.map((id) => new mongoose.Types.ObjectId(id)) } },
      );
    }
  }

  // 3. Backfill owner.cities from the old free-text city.
  const cities = await listRentalCities();
  const byKey = new Map(cities.map((city) => [city.key, city]));
  log(`\n  cities with a branch: ${cities.map((city) => city.label).join(', ') || '(none)'}`);

  const unassigned = [];
  for (const owner of await Owner.find().select('company_name city cities').lean()) {
    if (owner.cities?.length) continue;

    const match = byKey.get(cityKey(owner.city));
    if (!match) {
      unassigned.push(owner);
      continue;
    }

    log(`  owner "${owner.company_name}": city "${owner.city}" -> [${match.key}]`);
    if (apply) {
      await Owner.updateOne({ _id: owner._id }, { $set: { cities: [match.key], city: match.label } });
    }
  }

  if (unassigned.length) {
    log('\n  Needs an admin to assign a city (their vehicles cannot reach search until then):');
    for (const owner of unassigned) {
      log(`    - ${owner.company_name} (city on record: ${JSON.stringify(owner.city)})`);
    }
  }

  await mongoose.disconnect();
  log(apply ? '\nDone.' : '\nNothing written.');
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
