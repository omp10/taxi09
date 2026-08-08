import assert from 'node:assert/strict';

process.env.SETTINGS_ENCRYPTION_KEY = 'a'.repeat(64); // 32 bytes as hex
const {
  encryptSecret, decryptSecret, isEncrypted, maskSecret,
  isEncryptionConfigured, resetSecretCryptoCache, SECRET_FIELDS,
} = await import('../src/utils/secretCrypto.js');

assert.equal(isEncryptionConfigured(), true);

// Round trip
const secret = 'rzp_live_ABCDEF1234567890';
const sealed = encryptSecret(secret);
assert.ok(isEncrypted(sealed), 'carries the version prefix');
assert.ok(!sealed.includes(secret), 'ciphertext must not contain the plaintext');
assert.equal(decryptSecret(sealed), secret);

// Fresh IV each time, so identical secrets do not produce identical ciphertext
assert.notEqual(encryptSecret(secret), encryptSecret(secret), 'IV must be random');

// Already-encrypted values are not double-wrapped
assert.equal(encryptSecret(sealed), sealed);

// Plaintext passes through, so pre-encryption rows still read
assert.equal(decryptSecret('plain_old_key'), 'plain_old_key');
assert.equal(decryptSecret(''), '');
assert.equal(encryptSecret(''), '');
assert.equal(encryptSecret(null), '');

// Tampering is detected by the auth tag, not silently accepted
const [prefixIv, tag, data] = sealed.slice('enc:v1:'.length).split(':');
const flipped = Buffer.from(data, 'base64');
flipped[0] ^= 0xff;
const tampered = `enc:v1:${prefixIv}:${tag}:${flipped.toString('base64')}`;
assert.throws(() => decryptSecret(tampered), 'tampered ciphertext must fail');
assert.throws(() => decryptSecret('enc:v1:broken'), /malformed/i);

// A different key cannot read it
resetSecretCryptoCache();
process.env.SETTINGS_ENCRYPTION_KEY = 'b'.repeat(64);
assert.throws(() => decryptSecret(sealed), 'wrong key must not decrypt');

// Without a key, writing a secret fails loudly rather than storing it in clear
resetSecretCryptoCache();
delete process.env.SETTINGS_ENCRYPTION_KEY;
assert.equal(isEncryptionConfigured(), false);
assert.throws(() => encryptSecret('rzp_live_x'), /SETTINGS_ENCRYPTION_KEY is not set/);

// Masking never reveals a usable key
assert.equal(maskSecret('rzp_live_ABCDEF1234567890'), 'rzp_•••••••••••••••••7890');
assert.equal(maskSecret('short'), '•••••');
assert.equal(maskSecret(''), '');
assert.ok(!maskSecret('rzp_live_ABCDEF1234567890').includes('ABCDEF'));

assert.ok(SECRET_FIELDS.has('live_secret_key') && SECRET_FIELDS.has('salt_key'));

console.log('secret crypto: all assertions passed');
