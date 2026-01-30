import admin from 'firebase-admin';

// Initializes Firebase Admin SDK from env.
// Prefer using a single env var containing the full service account JSON.
// In Render: set FIREBASE_SERVICE_ACCOUNT_JSON to the JSON string.

function parseServiceAccount(): admin.ServiceAccount {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_JSON');
  }
  let obj: any;
  try {
    obj = JSON.parse(raw);
  } catch {
    // Common case: the JSON was pasted with escaped quotes; surface a better message
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON must be valid JSON');
  }
  if (typeof obj.private_key === 'string') {
    // Render/CI envs often store newlines as \n
    obj.private_key = obj.private_key.replace(/\\n/g, '\n');
  }
  return obj as admin.ServiceAccount;
}

export function getAdmin(): admin.app.App {
  if (admin.apps.length) return admin.app();
  const serviceAccount = parseServiceAccount();
  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

export function getAuth() {
  return getAdmin().auth();
}

export function getFirestore() {
  const app = getAdmin();
  const db = app.firestore();
  db.settings({ ignoreUndefinedProperties: true });
  return db;
}
