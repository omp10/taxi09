/**
 * Encrypts any payment-gateway secret still stored in plaintext.
 *
 * Idempotent: values already carrying the enc:v1 prefix are skipped, so it is
 * safe to re-run. Requires SETTINGS_ENCRYPTION_KEY to be set.
 *
 *   node scripts/encryptGatewaySecrets.js            # report only
 *   node scripts/encryptGatewaySecrets.js --apply    # write
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const run = async () => {
  const apply = process.argv.includes('--apply');
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');

  const { SECRET_FIELDS, encryptSecret, isEncrypted, isEncryptionConfigured, maskSecret } =
    await import('../src/utils/secretCrypto.js');

  if (!isEncryptionConfigured()) {
    console.error('SETTINGS_ENCRYPTION_KEY is not set.');
    console.error('Generate one with:  openssl rand -hex 32');
    process.exit(1);
  }

  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB_NAME || 'appzeto_taxi' });
  const { AdminThirdPartySetting } = await import('../src/modules/taxi/admin/models/AdminThirdPartySetting.js');

  const doc = await AdminThirdPartySetting.findOne({});
  if (!doc) {
    console.log('No third-party settings document yet - nothing to migrate.');
    await mongoose.disconnect();
    return;
  }

  let sealed = 0;
  let already = 0;

  const walk = (node, path = 'payment') => {
    if (!node || typeof node !== 'object') return node;

    for (const [key, value] of Object.entries(node)) {
      if (value && typeof value === 'object') {
        walk(value, `${path}.${key}`);
        continue;
      }
      if (!SECRET_FIELDS.has(key)) continue;

      const text = String(value ?? '');
      if (!text) continue;

      if (isEncrypted(text)) {
        already += 1;
        continue;
      }

      console.log(`  ${path}.${key} -> ${maskSecret(text)}`);
      if (apply) node[key] = encryptSecret(text);
      sealed += 1;
    }
    return node;
  };

  const payment = doc.payment ? JSON.parse(JSON.stringify(doc.payment)) : {};
  walk(payment);

  if (apply && sealed > 0) {
    doc.payment = payment;
    doc.markModified('payment');
    await doc.save();
  }

  console.log(`\n${sealed} secret(s) ${apply ? 'encrypted' : 'would be encrypted'}, ${already} already encrypted.`);
  if (!apply && sealed > 0) console.log('Dry run - re-run with --apply to write.');

  await mongoose.disconnect();
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
