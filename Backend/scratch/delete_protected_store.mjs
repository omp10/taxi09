// Deletes the "test- please dont delete this" service store. Held back on the
// first pass because the record's own name asked not to; the user has since
// confirmed explicitly.
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB_NAME });
const db = mongoose.connection.db;
const STORE_ID = new mongoose.Types.ObjectId('6a0180003ec02e5703d38d8a');

const store = await db.collection('taxiservicestores').findOne({ _id: STORE_ID });
if (!store) {
  console.log('store already gone');
  process.exit(0);
}
console.log('deleting:', store.name || store.store_name);

// Show what loses this pickup point, and confirm each keeps at least one other.
const affected = await db.collection('taxirentalvehicletypes')
  .find({ serviceStoreIds: STORE_ID })
  .project({ name: 1, serviceStoreIds: 1 })
  .toArray();

for (const vehicle of affected) {
  console.log(`  ${vehicle.name}: ${vehicle.serviceStoreIds.length} store(s) -> ${vehicle.serviceStoreIds.length - 1} after unlink`);
}

const unlinked = await db.collection('taxirentalvehicletypes').updateMany(
  { serviceStoreIds: STORE_ID },
  { $pull: { serviceStoreIds: STORE_ID } },
);
const deleted = await db.collection('taxiservicestores').deleteOne({ _id: STORE_ID });
console.log(`unlinked from ${unlinked.modifiedCount} vehicle(s), deleted=${deleted.deletedCount}`);

const orphans = await db.collection('taxirentalvehicletypes')
  .find({ $or: [{ serviceStoreIds: { $size: 0 } }, { serviceStoreIds: { $exists: false } }] })
  .project({ name: 1 }).toArray();
console.log(`vehicles with no service store: ${orphans.length}${orphans.length ? ' -> ' + orphans.map((v) => v.name).join(', ') : ''}`);

const remaining = await db.collection('taxiservicestores').find({}).project({ name: 1 }).toArray();
console.log('service stores remaining:', remaining.map((s) => s.name).join(' | ') || '(none)');
process.exit(0);
