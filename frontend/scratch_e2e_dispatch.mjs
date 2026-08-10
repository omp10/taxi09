// E2E dispatch proof: auth -> driver online -> matchDrivers -> ride now -> accept -> lifecycle -> scheduled ride.
import { io } from 'socket.io-client';

const BASE = 'http://localhost:5000/api';
const PICKUP = [75.8577, 22.7196]; // lng, lat (Indore)
const DROP = [75.8937, 22.7532];
const MINI_CAB = '6a75a7a1ee6032b6aa120578';
const USER_PHONE = '7223077890';
const DRIVER_PHONE = '7610416911';

const j = async (method, path, body, token) => {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${JSON.stringify(data).slice(0, 400)}`);
  return data.data ?? data;
};

// --- auth ---
await j('POST', '/users/auth/send-otp', { phone: USER_PHONE });
const userAuth = await j('POST', '/users/auth/verify-otp', { phone: USER_PHONE, otp: '0000' });
const userToken = userAuth.token;
await j('POST', '/drivers/auth/send-otp', { phone: DRIVER_PHONE });
const driverAuth = await j('POST', '/drivers/auth/verify-otp', { phone: DRIVER_PHONE, otp: '0000' });
const driverToken = driverAuth.token;
console.log('AUTH ok  user token:', Boolean(userToken), ' driver token:', Boolean(driverToken));

// --- cleanup stale active ride from earlier runs ---
const active = await j('GET', '/rides/active/me', null, userToken).catch(() => null);
const staleId = active?.ride?._id || active?._id;
if (staleId) {
  await j('PATCH', `/rides/${staleId}/cancel`, { reason: 'e2e cleanup' }, userToken)
    .then(() => console.log('cancelled stale ride', staleId))
    .catch((e) => console.log('stale cancel:', e.message));
}

// --- driver online ---
const online = await j('PATCH', '/drivers/online', { location: PICKUP, selfieImageUrl: 'https://example.com/selfie.jpg' }, driverToken);
console.log('DRIVER ONLINE:', JSON.stringify(online).slice(0, 200));

// --- matchDrivers via real endpoint ---
const avail = await j('GET', `/rides/available-drivers?vehicleTypeId=${MINI_CAB}&lat=${PICKUP[1]}&lng=${PICKUP[0]}`);
const availDrivers = avail.drivers || avail.results || avail;
console.log('MATCH (Mini Cab):', Array.isArray(availDrivers) ? `${availDrivers.length} driver(s): ${availDrivers.map((d) => d.name).join(', ')}` : JSON.stringify(avail).slice(0, 300));

// --- sockets ---
const dSock = io('http://localhost:5000', { auth: { token: driverToken }, transports: ['websocket'] });
const uSock = io('http://localhost:5000', { auth: { token: userToken }, transports: ['websocket'] });
const log = (who) => (name) => (p) => console.log(`  [${who}] ${name}:`, JSON.stringify(p).slice(0, 220));
['rideRequest', 'rideRequestClosed', 'rideAccepted'].forEach((n) => dSock.on(n, log('driver')(n)));
['rideSearchUpdate', 'rideAccepted', 'ride:status:updated', 'ride:state', 'rideCancelled'].forEach((n) => uSock.on(n, log('user')(n)));

const waitEvent = (sock, name, timeoutMs = 25000) =>
  new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout waiting for ${name}`)), timeoutMs);
    sock.once(name, (p) => { clearTimeout(t); resolve(p); });
  });

await Promise.all([waitEvent(dSock, 'connect'), waitEvent(uSock, 'connect')]);
console.log('SOCKETS connected');

const ridePayload = {
  pickup: PICKUP,
  drop: DROP,
  pickupAddress: 'E2E pickup, Vijay Nagar, Indore',
  dropAddress: 'E2E drop, Palasia, Indore',
  fare: 150,
  estimatedDistanceMeters: 5000,
  estimatedDurationMinutes: 15,
  vehicleTypeId: MINI_CAB,
  paymentMethod: 'cash',
  transport_type: 'taxi',
};

// --- ride NOW ---
console.log('\n=== RIDE NOW ===');
const reqPromise = waitEvent(dSock, 'rideRequest');
const created = await j('POST', '/rides', ridePayload, userToken);
const rideId = created.ride?._id || created.ride?.id;
console.log('RIDE created:', rideId, 'status:', created.ride?.status, created.ride?.liveStatus);
const req = await reqPromise;
console.log('DRIVER got rideRequest for ride:', req.rideId || req.ride?._id || JSON.stringify(req).slice(0, 120));

const runLifecycle = async (id) => {
  const userAccepted = waitEvent(uSock, 'rideAccepted');
  const driverAccepted = waitEvent(dSock, 'rideAccepted');
  dSock.emit('acceptRide', { rideId: id });
  await driverAccepted;
  console.log('DRIVER accepted via socket');
  await userAccepted.then((p) => console.log('USER saw rideAccepted, driver:', p.driver?.name || p.ride?.driverId?.name || 'ok'));

  for (const status of ['arriving', 'started', 'arrived', 'completed']) {
    const r = await j('PATCH', `/rides/${id}/status`, { status, paymentMethod: 'cash' }, driverToken);
    console.log(`DRIVER -> ${status}  (ride liveStatus: ${r.liveStatus || r.status})`);
    await new Promise((res) => setTimeout(res, 400));
  }
};
await runLifecycle(rideId);

// --- scheduled ride ---
console.log('\n=== SCHEDULED RIDE (+45s) ===');
await j('PATCH', '/drivers/online', { location: PICKUP, selfieImageUrl: 'https://example.com/selfie.jpg' }, driverToken).catch(() => {});
const schedAt = new Date(Date.now() + 45000);
const t0 = Date.now();
const reqPromise2 = waitEvent(dSock, 'rideRequest', 90000);
const created2 = await j('POST', '/rides', { ...ridePayload, scheduledAt: schedAt.toISOString() }, userToken);
const rideId2 = created2.ride?._id || created2.ride?.id;
console.log('SCHEDULED ride created:', rideId2, 'scheduledAt:', created2.ride?.scheduledAt);
const req2 = await reqPromise2;
const elapsed = Math.round((Date.now() - t0) / 1000);
console.log(`DRIVER got rideRequest after ${elapsed}s (expected ~45s) for ride:`, req2.rideId || JSON.stringify(req2).slice(0, 100));
if (elapsed < 35) console.log('WARNING: dispatch fired too early for a scheduled ride');

await runLifecycle(rideId2);

// --- cleanup: driver offline ---
await j('PATCH', '/drivers/offline', {}, driverToken).catch((e) => console.log('offline:', e.message));
console.log('\nALL DONE');
process.exit(0);
