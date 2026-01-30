import crypto from 'node:crypto';

/**
 * Lightweight, per-field encryption using AES-256-GCM.
 *
 * - Master key comes from env: MASTER_ENCRYPTION_KEY
 * - Per-value salt ensures unique derived key per stored value
 * - HKDF avoids scrypt memory spikes on small instances (Render/free)
 */

function getMasterKey(): Buffer {
  const raw = process.env.MASTER_ENCRYPTION_KEY;
  if (!raw) throw new Error('MASTER_ENCRYPTION_KEY missing');
  // Normalize to 32 bytes (stable) regardless of raw length
  return crypto.createHash('sha256').update(raw, 'utf8').digest();
}

function deriveFieldKey(salt: Buffer): Buffer {
  const master = getMasterKey();
  // Node's typings may return ArrayBuffer; normalize to Buffer for TS
  const ab = crypto.hkdfSync('sha256', master, salt, Buffer.from('vault-field-key-v1'), 32);
  return Buffer.from(ab);
}

export function encryptString(plain: string): string {
  const salt = crypto.randomBytes(16);
  const key = deriveFieldKey(salt);
  const iv = crypto.randomBytes(12); // recommended IV size for GCM

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  // format: salt:iv:tag:ciphertext (all base64)
  return [
    salt.toString('base64'),
    iv.toString('base64'),
    tag.toString('base64'),
    ciphertext.toString('base64')
  ].join(':');
}

export function decryptString(payload: string): string {
  const [saltB64, ivB64, tagB64, dataB64] = payload.split(':');
  if (!saltB64 || !ivB64 || !tagB64 || !dataB64) throw new Error('Invalid encrypted payload');

  const salt = Buffer.from(saltB64, 'base64');
  const key = deriveFieldKey(salt);
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const data = Buffer.from(dataB64, 'base64');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(data), decipher.final()]);
  return plain.toString('utf8');
}

export function maybeEncrypt(v?: string | null): string | null {
  if (v === undefined || v === null || v === '') return null;
  return encryptString(v);
}

export function maybeDecrypt(v?: string | null): string | null {
  if (!v) return null;
  return decryptString(v);
}
