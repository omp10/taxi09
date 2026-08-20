/**
 * End-to-end check for the owner marketplace: an owner's listing is derived
 * from their city, held for moderation, findable only in that city once
 * approved, and follows the owner if an admin moves them.
 *
 * Creates and removes its own listing, so it is safe to re-run.
 *
 *   node scripts/checkOwnerMarketplace.js
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import assert from 'node:assert/strict';

await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB_NAME });

const { Owner } = await import('../src/modules/taxi/admin/models/Owner.js');
const { RentalVehicleType } = await import('../src/modules/taxi/admin/models/RentalVehicleType.js');
const svc = await import('../src/modules/taxi/admin/services/adminService.js');
const { listRentalCities } = await import('../src/modules/taxi/admin/services/rentalCityService.js');

const searchNames = async (location) =>
  (await svc.listPublicRentalVehicleCatalog({ location })).map((v) => v.name);

const cities = await listRentalCities();
console.log('cities:', cities.map((c) => `${c.label} (${c.serviceStoreIds.length} branch)`).join(', '));

const owner = await Owner.findOne({ mobile: '7610416911' }).lean();   // "Static Fleet", Indore
assert.ok(owner, 'test owner missing');
console.log('owner:', owner.company_name, 'cities =', owner.cities);

const NAME = '__E2E Marketplace Car__';
await RentalVehicleType.deleteMany({ name: NAME });

// --- 1. owner submits a listing -------------------------------------------
const created = await svc.createRentalVehicleType(
  { name: NAME, transport_type: 'rental', vehicleCategory: 'Car',
    pricing: [{ id: 'e2e-24h', label: '24 Hours', durationHours: 24, price: 1999, includedKm: 200 }],
    status: 'pending' },
  { ownerId: owner._id },
);
console.log('\n1. created  ->  status=%s  branches=%j  owner=%s', created.status, created.serviceStoreIds, created.ownerName);
assert.equal(created.status, 'pending', 'owner listing must start pending');
assert.deepEqual(created.serviceStoreIds, cities[0].serviceStoreIds, 'branches must be derived from the owner city');

// --- 2. pending listing must NOT be findable ------------------------------
let found = await searchNames('Indore');
console.log('2. search "Indore" while pending -> contains listing:', found.includes(NAME));
assert.equal(found.includes(NAME), false, 'pending listing must be invisible to customers');

// --- 3. admin approves -----------------------------------------------------
const approved = await svc.moderateRentalVehicleType(created.id, { decision: 'approved' });
console.log('3. approved ->  status=%s active=%s', approved.status, approved.active);
assert.equal(approved.status, 'active');

found = await searchNames('Indore');
console.log('   search "Indore" -> contains listing:', found.includes(NAME));
assert.ok(found.includes(NAME), 'approved listing must appear for its city');

// --- 4. a different city must not surface it ------------------------------
const elsewhere = await searchNames('Mumbai');
console.log('4. search "Mumbai" -> %d results, contains listing: %s', elsewhere.length, elsewhere.includes(NAME));
assert.equal(elsewhere.includes(NAME), false, 'listing must not leak into another city');

// --- 5. a typo city is refused outright -----------------------------------
await assert.rejects(
  () => svc.updateOwner(String(owner._id), { city: 'Indoor' }),
  /No branch covers/,
  'a city with no branch must be rejected, not stored',
);
console.log('5. owner city "Indoor" (typo) -> rejected');

// --- 6. changing the owner city re-points their vehicles ------------------
await svc.updateOwner(String(owner._id), { city: '' });
let after = await RentalVehicleType.findById(created.id).select('serviceStoreIds').lean();
console.log('6. owner city cleared -> vehicle branches now %j', after.serviceStoreIds.map(String));
assert.equal(after.serviceStoreIds.length, 0, 'clearing the city must detach the vehicles');
assert.equal((await searchNames('Indore')).includes(NAME), false, 'detached vehicle must leave search');

await svc.updateOwner(String(owner._id), { city: 'Indore' });
after = await RentalVehicleType.findById(created.id).select('serviceStoreIds').lean();
console.log('   owner city set back to Indore -> branches %j', after.serviceStoreIds.map(String));
assert.deepEqual(after.serviceStoreIds.map(String), cities[0].serviceStoreIds, 'vehicles must follow the owner city');
assert.ok((await searchNames('Indore')).includes(NAME), 'vehicle must return to search');

// --- 7. an owner edit returns the listing to moderation -------------------
const edited = await svc.updateRentalVehicleType(created.id, { name: NAME, status: 'pending' });
console.log('7. owner edit -> status=%s, in search: %s', edited.status, (await searchNames('Indore')).includes(NAME));
assert.equal(edited.status, 'pending');

// --- 8. rejection needs a reason ------------------------------------------
await assert.rejects(() => svc.moderateRentalVehicleType(created.id, { decision: 'rejected' }), /reason is required/);
const rejected = await svc.moderateRentalVehicleType(created.id, { decision: 'rejected', reason: 'Photos missing' });
console.log('8. rejected ->  status=%s reason="%s"', rejected.status, rejected.moderationReason);
assert.equal(rejected.status, 'rejected');

await RentalVehicleType.deleteMany({ name: NAME });
await mongoose.disconnect();
console.log('\nALL CHECKS PASSED');
