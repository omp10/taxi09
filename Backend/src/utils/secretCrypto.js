import crypto from 'node:crypto';

/**
 * Envelope encryption for stored third-party secrets (payment gateway keys and
 * the like), so a database dump or backup does not hand over live credentials.
 *
 * AES-256-GCM: the auth tag means a tampered ciphertext fails to decrypt rather
 * than yielding garbage. Values carry a version prefix so plaintext rows written
 * before this existed are still readable and can be migrated in place.
 *
 * The key comes from SETTINGS_ENCRYPTION_KEY - 32 bytes as hex or base64.
 * Generate one with:  openssl rand -hex 32
 */

const PREFIX = 'enc:v1:';
const ALGORITHM = 'aes-256-gcm';

let cachedKey;

const readKey = () => {
  if (cachedKey !== undefined) return cachedKey;

  const raw = String(process.env.SETTINGS_ENCRYPTION_KEY || '').trim();
  if (!raw) {
    cachedKey = null;
    return cachedKey;
  }

  const buffer = /^[0-9a-f]{64}$/i.test(raw) ? Buffer.from(raw, 'hex') : Buffer.from(raw, 'base64');
  if (buffer.length !== 32) {
    throw new Error('SETTINGS_ENCRYPTION_KEY must be 32 bytes (64 hex chars, or base64)');
  }

  cachedKey = buffer;
  return cachedKey;
};

/** Test seam - clears the memoised key after changing the env var. */
export const resetSecretCryptoCache = () => { cachedKey = undefined; };

export const isEncryptionConfigured = () => Boolean(readKey());

export const isEncrypted = (value) => typeof value === 'string' && value.startsWith(PREFIX);

export const encryptSecret = (value) => {
  const plain = value === null || value === undefined ? '' : String(value);
  if (!plain) return '';
  if (isEncrypted(plain)) return plain;

  const key = readKey();
  if (!key) {
    // Refuse rather than silently storing a live key in the clear.
    throw new Error(
      'SETTINGS_ENCRYPTION_KEY is not set, so gateway secrets cannot be stored securely. ' +
      'Generate one with `openssl rand -hex 32` and set it in the backend environment.',
    );
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${PREFIX}${iv.toString('base64')}:${tag.toString('base64')}:${ciphertext.toString('base64')}`;
};

/** Plaintext passes straight through, so pre-encryption rows keep working. */
export const decryptSecret = (value) => {
  const stored = value === null || value === undefined ? '' : String(value);
  if (!stored || !isEncrypted(stored)) return stored;

  const key = readKey();
  if (!key) {
    throw new Error('SETTINGS_ENCRYPTION_KEY is not set, so stored secrets cannot be read.');
  }

  const [ivPart, tagPart, dataPart] = stored.slice(PREFIX.length).split(':');
  if (!ivPart || !tagPart || !dataPart) {
    throw new Error('Stored secret is malformed');
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivPart, 'base64'));
  decipher.setAuthTag(Buffer.from(tagPart, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(dataPart, 'base64')),
    decipher.final(),
  ]).toString('utf8');
};

/**
 * What the admin UI shows: enough to recognise the key, not enough to use it.
 * Short values are hidden entirely rather than mostly revealed.
 */
export const maskSecret = (value) => {
  const plain = isEncrypted(value) ? '' : String(value ?? '');
  const source = plain || (isEncrypted(value) ? decryptSecretSafely(value) : '');
  if (!source) return '';
  if (source.length <= 8) return '•'.repeat(source.length);
  return `${source.slice(0, 4)}${'•'.repeat(Math.max(4, source.length - 8))}${source.slice(-4)}`;
};

const decryptSecretSafely = (value) => {
  try {
    return decryptSecret(value);
  } catch {
    return '';
  }
};

/** Field names whose values must never leave the server in the clear. */
export const SECRET_FIELDS = new Set([
  'test_secret_key',
  'live_secret_key',
  'salt_key',
  'client_secret',
  'secret_key',
  'api_secret',
  'auth_token',
  'private_key',
]);
