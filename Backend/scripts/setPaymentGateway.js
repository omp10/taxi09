/**
 * Configures the Razorpay gateway from environment variables, so credentials
 * never have to be pasted into a chat, a commit, or this file.
 *
 * The secret is encrypted with SETTINGS_ENCRYPTION_KEY before it is stored, the
 * same way the admin panel does it, and is never printed back in full.
 *
 * Usage (values stay in your shell, not in the repo):
 *
 *   RAZORPAY_KEY_ID=... RAZORPAY_KEY_SECRET=... node scripts/setPaymentGateway.js
 *
 * Or put them in Backend/.env (gitignored) and just run the script.
 *
 * Flags:
 *   --live      write to the live_* fields instead of test_* (default: test)
 *   --activate  also make Razorpay the active gateway
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const run = async () => {
  const isLive = process.argv.includes('--live');
  const activate = process.argv.includes('--activate');

  const keyId = String(process.env.RAZORPAY_KEY_ID || '').trim();
  const keySecret = String(process.env.RAZORPAY_KEY_SECRET || '').trim();

  if (!keyId || !keySecret) {
    console.error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set.\n');
    console.error('  RAZORPAY_KEY_ID=xxx RAZORPAY_KEY_SECRET=yyy node scripts/setPaymentGateway.js');
    process.exit(1);
  }

  // Catch the easy mistake of pasting a live key while expecting test mode.
  const looksLive = keyId.startsWith('rzp_live_');
  if (looksLive && !isLive) {
    console.error('That looks like a LIVE key but --live was not passed. Refusing, in case this was not intended.');
    process.exit(1);
  }
  if (!looksLive && isLive) {
    console.error('--live was passed but the key is not an rzp_live_ key. Refusing.');
    process.exit(1);
  }

  const { encryptSecret, isEncryptionConfigured, maskSecret } = await import('../src/utils/secretCrypto.js');

  if (!isEncryptionConfigured()) {
    console.error('SETTINGS_ENCRYPTION_KEY is not set, so the secret cannot be stored securely.');
    console.error('Generate one with:  openssl rand -hex 32');
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');

  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB_NAME || 'appzeto_taxi' });
  const { AdminThirdPartySetting } = await import('../src/modules/taxi/admin/models/AdminThirdPartySetting.js');

  const doc = (await AdminThirdPartySetting.findOne({})) || new AdminThirdPartySetting({});
  const payment = doc.payment ? JSON.parse(JSON.stringify(doc.payment)) : {};

  payment.razor_pay = {
    ...(payment.razor_pay || {}),
    enabled: '1',
    razorpay_environment: isLive ? 'live' : 'test',
    [isLive ? 'live_api_key' : 'test_api_key']: keyId,
    [isLive ? 'live_secret_key' : 'test_secret_key']: encryptSecret(keySecret),
  };

  if (activate) payment.active_gateway = 'razor_pay';

  doc.payment = payment;
  doc.markModified('payment');
  await doc.save();

  console.log(`Razorpay configured in ${isLive ? 'LIVE' : 'TEST'} mode.`);
  console.log(`  key id : ${keyId}`);
  console.log(`  secret : ${maskSecret(keySecret)} (encrypted at rest)`);
  console.log(`  active : ${activate ? 'yes' : 'unchanged - pass --activate to switch'}`);

  await mongoose.disconnect();
};

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
