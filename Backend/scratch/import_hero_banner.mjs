// Imports a desktop hero banner through the same Cloudinary path the admin
// panel uses, then creates the Banner record.
import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

const BACKEND = 'D:/projects/taxi09/backend';
dotenv.config({ path: path.join(BACKEND, '.env') });

const SOURCE = process.argv[2];
const TITLE = process.argv[3] || 'Desktop hero';

if (!fs.existsSync(SOURCE)) {
  console.error('Source image not found:', SOURCE);
  process.exit(1);
}

const { uploadDataUrlToCloudinary } = await import(`file:///${BACKEND}/src/utils/cloudinaryUpload.js`);
const { Banner } = await import(`file:///${BACKEND}/src/modules/taxi/admin/promotions/models/Banner.js`);

const bytes = fs.readFileSync(SOURCE);
const dataUrl = `data:image/png;base64,${bytes.toString('base64')}`;
console.log(`source: ${path.basename(SOURCE)} (${(bytes.length / 1024 / 1024).toFixed(2)} MB)`);

const uploaded = await uploadDataUrlToCloudinary({ dataUrl, publicIdPrefix: 'banner-desktop-hero' });
console.log('uploaded:', uploaded.secureUrl);

await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB_NAME });

const existing = await Banner.findOne({ title: TITLE });
const doc = existing
  ? Object.assign(existing, { desktopImage: uploaded.secureUrl, image: existing.image || uploaded.secureUrl, active: true, type: 'top' })
  : new Banner({
      title: TITLE,
      image: uploaded.secureUrl,
      desktopImage: uploaded.secureUrl,
      type: 'top',
      active: true,
      link_type: 'deep_link',
      deep_link: '/taxi/user/rental',
      redirect_url: '/taxi/user/rental',
    });

await doc.save();
console.log(`${existing ? 'updated' : 'created'} banner:`, String(doc._id), '| type:', doc.type, '| active:', doc.active);

const all = await Banner.find({ type: 'top', active: true }).sort({ createdAt: -1 }).lean();
console.log(`\ntype=top active banners now: ${all.length}`);
all.forEach((b) => console.log('  -', b.title, '| desktop:', b.desktopImage ? 'yes' : 'no'));
process.exit(0);
