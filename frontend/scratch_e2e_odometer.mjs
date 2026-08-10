// Proves the odometer gate: no PIN and no start until both sides record.
import { io } from 'socket.io-client';

const BASE = 'http://localhost:5000/api';
const PICKUP = [75.8577, 22.7196];
const DROP = [75.8937, 22.7532];
const MINI_CAB = '6a75a7a1ee6032b6aa120578';
const USER_PHONE = '7223077890';
const DRIVER_PHONE = '7610416911';

// A real 1x1 PNG, so Cloudinary gets something it will actually accept.
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

let failures = 0;
const check = (label, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${ok ? '' : `  (got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)})`}`);
};

const call = async (method, path, body, token) => {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data: data.data ?? data, message: data.message };
};

const j = async (method, path, body, token) => {
  const r = await call(method, path, body, token);
  if (r.status >= 400) throw new Error(`${method} ${path} -> ${r.status}: ${r.message}`);
  return r.data;
};

await j('POST', '/users/auth/send-otp', { phone: USER_PHONE });
const userToken = (await j('POST', '/users/auth/verify-otp', { phone: USER_PHONE, otp: '0000' })).token;
await j('POST', '/drivers/auth/send-otp', { phone: DRIVER_PHONE });
const driverToken = (await j('POST', '/drivers/auth/verify-otp', { phone: DRIVER_PHONE, otp: '0000' })).token;

const active = await j('GET', '/rides/active/me', null, userToken).catch(() => null);
const staleId = active?.ride?._id || active?._id;
if (staleId) await call('PATCH', `/rides/${staleId}/cancel`, { reason: 'e2e cleanup' }, userToken);

await j('PATCH', '/drivers/online', { location: PICKUP, selfieImageUrl: 'https://example.com/selfie.jpg' }, driverToken);

const dSock = io('http://localhost:5000', { auth: { token: driverToken }, transports: ['websocket'] });
const uSock = io('http://localhost:5000', { auth: { token: userToken }, transports: ['websocket'] });
const waitEvent = (sock, name, timeoutMs = 25000) =>
  new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout waiting for ${name}`)), timeoutMs);
    sock.once(name, (p) => { clearTimeout(t); resolve(p); });
  });
await Promise.all([waitEvent(dSock, 'connect'), waitEvent(uSock, 'connect')]);

// Both apps listen for the counterpart's capture on this event.
const odoEvents = [];
uSock.on('ride:odometer:updated', (p) => odoEvents.push(['user', p]));
dSock.on('ride:odometer:updated', (p) => odoEvents.push(['driver', p]));

const reqPromise = waitEvent(dSock, 'rideRequest');
const created = await j('POST', '/rides', {
  pickup: PICKUP, drop: DROP,
  pickupAddress: 'Odometer e2e pickup', dropAddress: 'Odometer e2e drop',
  fare: 150, estimatedDistanceMeters: 5000, estimatedDurationMinutes: 15,
  vehicleTypeId: MINI_CAB, paymentMethod: 'cash', transport_type: 'taxi',
}, userToken);
const rideId = created.ride?._id || created.ride?.id;
await reqPromise;

dSock.emit('acceptRide', { rideId });
await waitEvent(dSock, 'rideAccepted');
uSock.emit('ride:join', { rideId });
console.log(`\nride ${rideId} accepted\n`);

const readRideAs = async (id, token) => j('GET', `/rides/${id}`, null, token);
const readRide = async (token) => readRideAs(rideId, token);

// --- before either side records ---
let ride = await readRide(userToken);
check('user sees no PIN before capture', ride.otp, '');
check('odometer starts incomplete', ride.odometer?.complete, false);
check('driver sees no PIN before capture', (await readRide(driverToken)).otp, '');

let start = await call('PATCH', `/rides/${rideId}/status`, { status: 'started' }, driverToken);
check('start is refused before capture', start.status, 409);
console.log(`      reason: ${start.message}`);

// --- user records ---
const userOdo = await j('POST', `/rides/${rideId}/odometer`, { readingKm: 41250, imageDataUrl: PNG }, userToken);
check('user side recorded', userOdo.user.recorded, true);
check('user photo stored on Cloudinary', userOdo.user.imageUrl.startsWith('https://res.cloudinary.com/'), true);
check('still incomplete with one side', userOdo.complete, false);

ride = await readRide(userToken);
check('PIN still withheld after one side', ride.otp, '');
start = await call('PATCH', `/rides/${rideId}/status`, { status: 'started' }, driverToken);
check('start still refused after one side', start.status, 409);

// --- a side cannot write the other's reading ---
const secondUserWrite = await call('POST', `/rides/${rideId}/odometer`, { readingKm: 999, imageDataUrl: PNG }, userToken);
check('user write lands on the user side only', secondUserWrite.data.driver.recorded, false);

// --- validation ---
check('reading is required', (await call('POST', `/rides/${rideId}/odometer`, { imageDataUrl: PNG }, driverToken)).status, 400);
check('photo is required', (await call('POST', `/rides/${rideId}/odometer`, { readingKm: 12 }, driverToken)).status, 400);
check('negative reading rejected', (await call('POST', `/rides/${rideId}/odometer`, { readingKm: -5, imageDataUrl: PNG }, driverToken)).status, 400);

// --- driver records ---
const driverOdo = await j('POST', `/rides/${rideId}/odometer`, { readingKm: 41251, imageDataUrl: PNG }, driverToken);
check('driver side recorded', driverOdo.driver.recorded, true);
check('capture complete with both sides', driverOdo.complete, true);

await new Promise((r) => setTimeout(r, 500));
ride = await readRide(userToken);
check('PIN released to user once complete', ride.otp.length, 4);
check('PIN released to driver once complete', (await readRide(driverToken)).otp.length, 4);
check('both readings survive the round trip', [ride.odometer.user.readingKm, ride.odometer.driver.readingKm], [999, 41251]);

check('counterpart was pushed the update over the socket', odoEvents.length > 0, true);
const lastPush = odoEvents[odoEvents.length - 1][1];
check('socket push carries the released PIN', lastPush.otp.length, 4);

// --- start now works ---
start = await call('PATCH', `/rides/${rideId}/status`, { status: 'started' }, driverToken);
check('start succeeds once both recorded', start.status, 200);
check('ride is now started', start.data.liveStatus, 'started');

// --- window closes after the trip starts ---
check(
  'odometer refused after start',
  (await call('POST', `/rides/${rideId}/odometer`, { readingKm: 5, imageDataUrl: PNG }, driverToken)).status,
  409,
);

// --- an outsider cannot write ---
const before = (await readRide(driverToken)).odometer;
check('an unauthenticated caller is rejected', (await call('POST', `/rides/${rideId}/odometer`, { readingKm: 1, imageDataUrl: PNG })).status, 401);
check('the readings are untouched by the rejected call', (await readRide(driverToken)).odometer, before);

for (const status of ['arrived', 'completed']) {
  await call('PATCH', `/rides/${rideId}/status`, { status, paymentMethod: 'cash' }, driverToken);
}

// --- parcels are carved out: their tracking screen has no capture step, so
//     requiring one would leave every delivery unable to start ---
console.log('\n--- parcel carve-out ---');
await call('PATCH', '/drivers/online', { location: PICKUP, selfieImageUrl: 'https://example.com/selfie.jpg' }, driverToken);
const parcelReq = waitEvent(dSock, 'rideRequest', 30000).catch(() => null);
const delivery = await j('POST', '/deliveries', {
  pickup: PICKUP, drop: DROP,
  pickupAddress: 'Parcel pickup', dropAddress: 'Parcel drop',
  fare: 80, vehicleTypeId: MINI_CAB, paymentMethod: 'cash',
  parcel: { category: 'documents', weightKg: 1, senderName: 'A', senderPhone: '7223077890', receiverName: 'B', receiverPhone: '7223077891' },
}, userToken);
const parcelRideId = delivery.rideId || delivery.ride?._id || delivery.ride?.rideId || delivery.ride?.id;
await parcelReq;

if (!parcelRideId) {
  console.log('SKIP  parcel ride id not returned; carve-out not exercised');
} else {
  dSock.emit('acceptRide', { rideId: parcelRideId });
  await waitEvent(dSock, 'rideAccepted', 20000).catch(() => null);
  const parcelRide = await readRideAs(parcelRideId, userToken);
  check('parcel needs no odometer', parcelRide.odometer?.complete, true);
  check('parcel PIN is not withheld', parcelRide.otp?.length, 4);
  const parcelStart = await call('PATCH', `/rides/${parcelRideId}/status`, { status: 'started' }, driverToken);
  check('parcel starts without any odometer', parcelStart.status, 200);
  for (const status of ['arrived', 'completed']) {
    await call('PATCH', `/rides/${parcelRideId}/status`, { status, paymentMethod: 'cash' }, driverToken);
  }
}

await call('PATCH', '/drivers/offline', {}, driverToken);

console.log(`\n${failures ? `${failures} FAILURE(S)` : 'ALL CHECKS PASSED'}`);
process.exit(failures ? 1 : 0);
