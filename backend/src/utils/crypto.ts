import crypto from 'node:crypto';

function getMasterKey(): Buffer {
  const raw = process.env.MASTER_ENCRYPTION_KEY;
  if (!raw) throw new Error('MASTER_ENCRYPTION_KEY missing');
  // Normaliza para 32 bytes estáveis
  return crypto.createHash('sha256').update(raw, 'utf8').digest(); // 32 bytes
}

function deriveFieldKey(salt: Buffer): Buffer {
  // HKDF é leve e seguro. Key única por dado via salt.
  const master = getMasterKey();
  return crypto.hkdfSync('sha256', master, salt, Buffer.from('vault-field-key-v1'), 32);
}

export function encryptString(plain: string): string {
  const salt = crypto.randomBytes(16); // salt único por dado
  const key = deriveFieldKey(salt);

  const iv = crypto.randomBytes(12); // recomendado para GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  // formato: salt:iv:tag:cipher
  return [
    salt.toString('base64'),
    iv.toString('base64'),
    tag.toString('base64'),
    ciphertext.toString('base64'),
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

// Helpers para campos opcionais
export function maybeEncrypt(v?: string | null): string | null {
  if (v === undefined || v === null || v === '') return null;
  return encryptString(v);
}

export function maybeDecrypt(v?: string | null): string | null {
  if (!v) return null;
  return decryptString(v);
}
