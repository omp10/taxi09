// Removes the junk service stores and the superseded top banners.
// Every affected rental vehicle was verified to also be listed at Vijay Nagar,
// so unlinking leaves no vehicle without a pickup point.
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB_NAME });
const db = mongoose.connection.db;
const oid = (id) => new mongoose.Types.ObjectId(id);

// "test- please dont delete this" is deliberately NOT in this list: the record
// asks not to be deleted, so it needs an explicit go-ahead.
const JUNK_STORES = [
  ['6a017d66f1e366431fe2341d', 'muzaffarnagar'],
  ['6a156a54f74d491ee3f599e1', 'muzaffarnagar link road mandhi'],
  ['6a1922f67ab8cdc3d6ec5914', 'Static Service Center'],
];

console.log('--- service stores ---');
for (const [id, name] of JUNK_STORES) {
  const unlinked = await db.collection('taxirentalvehicletypes').updateMany(
    { serviceStoreIds: oid(id) },
    { $pull: { serviceStoreIds: oid(id) } },
  );
  const deleted = await db.collection('taxiservicestores').deleteOne({ _id: oid(id) });
  console.log(`  ${name.padEnd(32)} unlinked from ${unlinked.modifiedCount} vehicle(s), deleted=${deleted.deletedCount}`);
}

// Any vehicle left with no pickup point at all would be a real regression.
const orphans = await db.collection('taxirentalvehicletypes')
  .find({ $or: [{ serviceStoreIds: { $size: 0 } }, { serviceStoreIds: { $exists: false } }] })
  .project({ name: 1 }).toArray();
console.log(`  vehicles now with no service store: ${orphans.length}${orphans.length ? ' -> ' + orphans.map((v) => v.name).join(', ') : ''}`);

console.log('\n--- top banners (keeping the newest) ---');
const tops = await db.collection('taxibanners')
  .find({ type: 'top', desktopImage: { $nin: ['', null] } })
  .sort({ createdAt: -1 })
  .toArray();

const [keep, ...drop] = tops;
console.log(`  keeping: ${keep?.title} (${keep?.createdAt?.toISOString()})`);
for (const banner of drop) {
  await db.collection('taxibanners').deleteOne({ _id: banner._id });
  console.log(`  deleted: ${banner.title} (${banner.createdAt.toISOString()})`);
}

console.log('\n--- final state ---');
const stores = await db.collection('taxiservicestores').find({}).project({ name: 1 }).toArray();
console.log('  service stores:', stores.map((s) => s.name).join(' | '));
const banners = await db.collection('taxibanners').find({ type: 'top' }).project({ title: 1, desktopImage: 1 }).toArray();
console.log('  top banners:', banners.map((b) => `${b.title}${b.desktopImage ? ' (desktop)' : ''}`).join(' | '));
process.exit(0);
