// Creates a fully bookable test driver, modelled on the existing working one.
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB_NAME });
const db = mongoose.connection.db;

const PHONE = '9111100001';
const SEDAN = '6a75a7a1ee6032b6aa12057a';   // taxi category with a real Set Prices row
const INDORE_ZONE = '69fed392b8603ffa74ed25ad';
const INDORE = [75.8577, 22.7196];

// Clone the shape of the driver that already dispatches correctly.
const template = await db.collection('taxidrivers').findOne({ phone: '7610416911' });
if (!template) throw new Error('reference driver not found');

await db.collection('taxidrivers').deleteOne({ phone: PHONE });

const doc = {
  ...template,
  _id: new mongoose.Types.ObjectId(),
  name: 'QA Sedan Driver',
  phone: PHONE,
  email: `driver.${PHONE}@rydon24.local`,
  vehicleTypeId: new mongoose.Types.ObjectId(SEDAN),
  vehicleType: 'car',
  vehicleIconType: 'car',
  vehicleMake: 'Maruti Suzuki',
  vehicleModel: 'Dzire',
  vehicleNumber: 'MP09QA1234',
  vehicleColor: 'White',
  registerFor: 'taxi',
  serviceCategories: ['taxi'],
  approve: true,
  status: 'approved',
  isOnline: false,
  isOnRide: false,
  deletedAt: null,
  zoneId: new mongoose.Types.ObjectId(INDORE_ZONE),
  location: { type: 'Point', coordinates: INDORE },
  // Enough float that the wallet minimum never blocks going online or accepting.
  wallet: { ...(template.wallet || {}), balance: 5000, isBlocked: false },
  referralCode: `QA${Date.now().toString().slice(-6)}`,
  createdAt: new Date(),
  updatedAt: new Date(),
};
delete doc.socketId;

await db.collection('taxidrivers').insertOne(doc);

const saved = await db.collection('taxidrivers').findOne({ phone: PHONE });
const vehicle = await db.collection('taxivehicles').findOne({ _id: saved.vehicleTypeId });
const price = await db.collection('taxisetprices').findOne({ vehicle_type: saved.vehicleTypeId });

console.log('created driver');
console.log('  name     :', saved.name);
console.log('  phone    :', saved.phone);
console.log('  category :', vehicle?.name, `(${saved.vehicleTypeId})`);
console.log('  fare row :', price ? `base ₹${price.base_price}, ₹${price.price_per_distance}/km` : 'NONE');
console.log('  wallet   :', `₹${saved.wallet?.balance}`, 'blocked:', saved.wallet?.isBlocked);
console.log('  approved :', saved.approve, '| status:', saved.status);
console.log('  zone     :', String(saved.zoneId), '| at', saved.location.coordinates.join(', '));
process.exit(0);
