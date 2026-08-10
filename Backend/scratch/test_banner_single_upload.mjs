// Proves a banner can be created from ONE image only, and that the missing
// side is mirrored in STORAGE (read back from the DB, not the create response).
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const { createBanner, deleteBanner } = await import('../src/modules/taxi/admin/promotions/services/promotionsService.js');
const { Banner } = await import('../src/modules/taxi/admin/promotions/models/Banner.js');

await mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.MONGODB_DB_NAME });

const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const created = [];
const check = async (label, payload) => {
  try {
    const result = await createBanner(payload);
    const id = result.id || result._id;
    created.push(id);
    const stored = await Banner.findById(id).lean();
    const both = Boolean(stored?.image) && Boolean(stored?.desktopImage);
    console.log(`${both ? 'PASS' : 'FAIL'}  ${label.padEnd(14)} stored image=${stored?.image ? 'set' : 'EMPTY'} desktopImage=${stored?.desktopImage ? 'set' : 'EMPTY'}`);
  } catch (error) {
    console.log(`FAIL  ${label.padEnd(14)} ${error.message}`);
  }
};

console.log('--- single-image uploads (storage check) ---');
await check('desktop only', { title: 'QA desktop only', type: 'top', desktopImage: PNG, active: false });
await check('phone only', { title: 'QA phone only', type: 'top', image: PNG, active: false });
await check('both', { title: 'QA both', type: 'top', image: PNG, desktopImage: PNG, active: false });

console.log('--- neither (must be rejected) ---');
try {
  await createBanner({ title: 'QA neither', type: 'top' });
  console.log('FAIL  neither         was accepted but should have been rejected');
} catch (error) {
  console.log(`PASS  neither         rejected: "${error.message}"`);
}

for (const id of created) {
  await deleteBanner(String(id)).catch(() => {});
}
console.log(`\ncleaned up ${created.length} QA banner(s)`);
process.exit(0);
