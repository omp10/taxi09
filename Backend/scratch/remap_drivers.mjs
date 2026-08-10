import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: new URL('../.env', import.meta.url).pathname.slice(1) });

await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB_NAME });
const db = mongoose.connection.db;

const MINI_CAB_ID = new mongoose.Types.ObjectId('6a75a7a1ee6032b6aa120578');

// Static Test Driver (Maruti WagonR) — the only car, had vehicleTypeId: null
const result = await db.collection('taxidrivers').updateOne(
  { _id: new mongoose.Types.ObjectId('6a1922f67ab8cdc3d6ec5913') },
  { $set: { vehicleTypeId: MINI_CAB_ID, vehicleType: 'car', vehicleIconType: 'car' } },
);
console.log('Static Test Driver -> Mini Cab:', result.modifiedCount);

const drivers = await db.collection('taxidrivers').find({}).project({ name: 1, vehicleType: 1, vehicleTypeId: 1 }).toArray();
const vehicles = await db.collection('taxivehicles').find({}).project({ name: 1 }).toArray();
const nameById = Object.fromEntries(vehicles.map(v => [String(v._id), v.name]));
drivers.forEach(d => console.log(d.name, '->', nameById[String(d.vehicleTypeId)] || d.vehicleTypeId));

process.exit(0);
