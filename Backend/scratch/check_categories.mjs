import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: new URL('../.env', import.meta.url).pathname.slice(1) });

await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB_NAME });
const db = mongoose.connection.db;

const vehicles = await db.collection('taxivehicles').find({}).project({ name: 1, transport_type: 1, vehicle_type: 1, icon_types: 1, active: 1 }).toArray();
console.log('--- vehicles ---');
vehicles.forEach(v => console.log(String(v._id), '|', v.transport_type, '|', v.name, '|', v.vehicle_type, '|', v.icon_types, '| active:', v.active));

const drivers = await db.collection('taxidrivers').find({}).project({ name: 1, phone: 1, vehicleType: 1, vehicleTypeId: 1, vehicleIconType: 1, vehicleMake: 1, vehicleModel: 1, isOnline: 1, isOnRide: 1, status: 1, approve: 1, zoneId: 1, deletedAt: 1, 'location.coordinates': 1 }).toArray();
console.log('--- taxidrivers ---');
drivers.forEach(d => console.log(JSON.stringify(d)));

process.exit(0);
