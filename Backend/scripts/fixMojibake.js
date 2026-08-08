/**
 * Repairs CP437 mojibake across every collection.
 *
 * Some strings were written as UTF-8, read back as CP437, then re-saved as
 * UTF-8 - so "Petrol · Manual" became "Petrol ┬╖ Manual" (the UTF-8 bytes of
 * "·", C2 B7, rendered as the CP437 glyphs for those byte values).
 *
 * The damage is reversible: map each glyph back to the CP437 byte it stands
 * for, then decode the resulting byte string as UTF-8. Every candidate is
 * round-tripped before it is written - if re-corrupting the repaired value
 * does not reproduce the stored value exactly, the field is left alone.
 *
 *   node scripts/fixMojibake.js            # report only
 *   node scripts/fixMojibake.js --apply    # write the repairs
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// CP437 code points for bytes 0x80-0xFF.
const CP437_HIGH =
  'ÇüéâäàåçêëèïîìÄÅÉæÆôöòûùÿÖÜ¢£¥₧ƒáíóúñÑªº¿⌐¬½¼¡«»' +
  '░▒▓│┤╡╢╖╕╣║╗╝╜╛┐└┴┬├─┼╞╟╚╔╩╦╠═╬╧╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀' +
  'αßΓπΣσµτΦΘΩδ∞φε∩≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ ';

const charToByte = new Map();
for (let index = 0; index < CP437_HIGH.length; index += 1) {
  charToByte.set(CP437_HIGH[index], 0x80 + index);
}

const decoder = new TextDecoder('utf-8', { fatal: true });

/** Undo one CP437 round trip, or return null if the string is not repairable. */
const repair = (value) => {
  const bytes = [];

  for (const char of value) {
    const code = char.codePointAt(0);
    if (code < 0x80) {
      bytes.push(code);
      continue;
    }
    const mapped = charToByte.get(char);
    if (mapped === undefined) return null; // not CP437 mojibake
    bytes.push(mapped);
  }

  let decoded;
  try {
    decoded = decoder.decode(Uint8Array.from(bytes));
  } catch {
    return null; // byte sequence is not valid UTF-8, so this was not the damage
  }

  if (decoded === value) return null;

  // Round trip: re-corrupting the repair must reproduce exactly what is stored.
  const recorrupted = [...Buffer.from(decoded, 'utf8')]
    .map((byte) => (byte < 0x80 ? String.fromCharCode(byte) : CP437_HIGH[byte - 0x80]))
    .join('');

  return recorrupted === value ? decoded : null;
};

/**
 * Cheap pre-filter. Every multi-byte UTF-8 sequence mangled this way leaves at
 * least one box-drawing or block glyph behind (UTF-8 lead bytes C2-EF land in
 * that range under CP437), and none of this data legitimately contains them.
 * The round-trip check inside `repair` is what actually makes a rewrite safe.
 */
const looksCorrupted = (value) => /[─-◿]/.test(value);

const walk = (node, path, hits) => {
  if (typeof node === 'string') {
    if (!looksCorrupted(node)) return node;
    const fixed = repair(node);
    if (fixed === null) return node;
    hits.push({ path, from: node, to: fixed });
    return fixed;
  }

  if (Array.isArray(node)) {
    return node.map((item, index) => walk(item, `${path}.${index}`, hits));
  }

  if (node && typeof node === 'object' && node.constructor === Object) {
    const next = {};
    for (const [key, value] of Object.entries(node)) {
      next[key] = walk(value, path ? `${path}.${key}` : key, hits);
    }
    return next;
  }

  return node;
};

const run = async () => {
  const apply = process.argv.includes('--apply');
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');

  // Must match the server's database, which pins dbName explicitly - without
  // it the driver silently uses the URI's default db ("test").
  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB_NAME || 'appzeto_taxi' });
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();

  let scanned = 0;
  let repaired = 0;
  const samples = [];

  for (const { name } of collections) {
    const cursor = db.collection(name).find({});

    for await (const doc of cursor) {
      scanned += 1;
      const hits = [];
      const { _id, ...rest } = doc;
      const next = walk(rest, '', hits);

      if (!hits.length) continue;

      repaired += 1;
      for (const hit of hits) {
        if (samples.length < 40) samples.push({ collection: name, id: String(_id), ...hit });
      }

      if (apply) {
        await db.collection(name).updateOne({ _id }, { $set: next });
      }
    }
  }

  console.log(`Scanned ${scanned} documents across ${collections.length} collections.`);
  console.log(`${repaired} document${repaired === 1 ? '' : 's'} contain repairable mojibake.\n`);

  for (const sample of samples) {
    console.log(`  ${sample.collection}.${sample.path}`);
    console.log(`    before: ${JSON.stringify(sample.from)}`);
    console.log(`    after : ${JSON.stringify(sample.to)}`);
  }

  console.log(apply ? '\nRepairs written.' : '\nDry run - nothing written. Re-run with --apply.');
  await mongoose.disconnect();
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
