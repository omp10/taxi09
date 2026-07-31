/**
 * Migrate base64 data-URI images out of MongoDB and into Cloudinary.
 *
 * Images stored inline as `data:image/...;base64,...` make every list request
 * ship megabytes of image bytes that the browser cannot cache. This walks every
 * collection, uploads each distinct blob once, and rewrites the field to the
 * Cloudinary URL.
 *
 * Usage:
 *   node scripts/migrateBase64Images.js --dry-run   # report only, no writes
 *   node scripts/migrateBase64Images.js             # perform the migration
 */

import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const DRY_RUN = process.argv.includes('--dry-run');
const MONGODB_URI = String(process.env.MONGODB_URI || '').trim();
const DB_NAME = String(process.env.MONGODB_DB_NAME || 'appzeto_taxi').trim();
const CLOUD_NAME = String(process.env.CLOUDINARY_CLOUD_NAME || '').trim();
const API_KEY = String(process.env.CLOUDINARY_API_KEY || '').trim();
const API_SECRET = String(process.env.CLOUDINARY_API_SECRET || '').trim();

if (!MONGODB_URI) throw new Error('Missing MONGODB_URI in Backend/.env');
if (!DRY_RUN && (!CLOUD_NAME || !API_KEY || !API_SECRET)) {
  throw new Error('Missing Cloudinary credentials in Backend/.env');
}

const DATA_URI = /^data:image\/[a-zA-Z0-9.+-]+;base64,/;

const isDataUri = (value) => typeof value === 'string' && DATA_URI.test(value);

const sign = (params) => {
  const payload = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  return crypto.createHash('sha1').update(`${payload}${API_SECRET}`).digest('hex');
};

const uploadDataUri = async (dataUri) => {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const publicId = `taxi09/migrated/${crypto.createHash('sha1').update(dataUri).digest('hex').slice(0, 16)}`;
  const params = { overwrite: 'true', public_id: publicId, timestamp, unique_filename: 'false' };

  const form = new FormData();
  form.append('file', dataUri);
  form.append('api_key', API_KEY);
  form.append('timestamp', timestamp);
  form.append('public_id', publicId);
  form.append('overwrite', 'true');
  form.append('unique_filename', 'false');
  form.append('signature', sign(params));

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: form,
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error?.message || 'Cloudinary upload failed');
  }
  return payload?.secure_url || '';
};

const stats = { scanned: 0, docsWithBlobs: 0, blobs: 0, bytes: 0, uploaded: 0, reused: 0, failed: 0 };
const cache = new Map();

/** Walk any value, replacing data URIs. Returns [newValue, changed]. */
const walk = async (value) => {
  if (isDataUri(value)) {
    stats.blobs += 1;
    stats.bytes += value.length;
    if (DRY_RUN) return [value, false];

    const key = crypto.createHash('sha1').update(value).digest('hex');
    if (cache.has(key)) {
      stats.reused += 1;
      return [cache.get(key), true];
    }
    try {
      const url = await uploadDataUri(value);
      if (!url) throw new Error('empty url');
      cache.set(key, url);
      stats.uploaded += 1;
      return [url, true];
    } catch (error) {
      stats.failed += 1;
      console.error('  upload failed:', error.message);
      return [value, false];
    }
  }

  if (Array.isArray(value)) {
    let changed = false;
    const next = [];
    for (const item of value) {
      const [nextItem, itemChanged] = await walk(item);
      next.push(nextItem);
      changed = changed || itemChanged;
    }
    return [next, changed];
  }

  if (value && typeof value === 'object' && !(value instanceof Date) && !(value?._bsontype)) {
    let changed = false;
    const next = {};
    for (const [key, item] of Object.entries(value)) {
      const [nextItem, itemChanged] = await walk(item);
      next[key] = nextItem;
      changed = changed || itemChanged;
    }
    return [next, changed];
  }

  return [value, false];
};

const run = async () => {
  await mongoose.connect(MONGODB_URI, { dbName: DB_NAME });
  const db = mongoose.connection.db;
  const collections = (await db.listCollections().toArray())
    .map((c) => c.name)
    .filter((name) => name && !name.startsWith('system.'));

  console.log(`${DRY_RUN ? 'DRY RUN - ' : ''}scanning ${collections.length} collections in "${DB_NAME}"\n`);

  for (const name of collections) {
    const collection = db.collection(name);
    const cursor = collection.find({});
    let touched = 0;

    for await (const doc of cursor) {
      stats.scanned += 1;
      const before = stats.blobs;
      const { _id, ...rest } = doc;
      const [next, changed] = await walk(rest);

      if (stats.blobs > before) {
        stats.docsWithBlobs += 1;
      }
      if (changed && !DRY_RUN) {
        await collection.updateOne({ _id }, { $set: next });
        touched += 1;
      }
    }

    if (touched) console.log(`  ${name}: updated ${touched} document(s)`);
  }

  const mb = (stats.bytes / (1024 * 1024)).toFixed(2);
  console.log('\n--- summary ---');
  console.log(`documents scanned : ${stats.scanned}`);
  console.log(`docs with base64  : ${stats.docsWithBlobs}`);
  console.log(`base64 images     : ${stats.blobs} (${mb} MB inline)`);
  if (!DRY_RUN) {
    console.log(`uploaded          : ${stats.uploaded}`);
    console.log(`deduped           : ${stats.reused}`);
    console.log(`failed            : ${stats.failed}`);
  } else {
    console.log('\nNo writes were made. Re-run without --dry-run to migrate.');
  }

  await mongoose.disconnect();
};

run().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
