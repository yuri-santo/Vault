import 'dotenv/config';
import { loadEnv } from './utils/env';
import { getAuth, getFirestore } from './firebaseAdmin';

// One-time helper to create/update an admin user in Firebase Auth and set a custom claim `role=ADMIN`.
// Use env vars ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD for the initial creation (do NOT commit them).

async function main() {
  loadEnv();
  const auth = getAuth();
  const db = getFirestore();

  const email = process.env.ADMIN_SEED_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_SEED_PASSWORD;
  if (!email || !password) {
    throw new Error('Missing ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD (set them only for seeding, then remove)');
  }

  let user;
  try {
    user = await auth.getUserByEmail(email);
  } catch {
    user = await auth.createUser({ email, password, emailVerified: true });
  }

  await auth.setCustomUserClaims(user.uid, { role: 'ADMIN' });
  await db.collection('users').doc(user.uid).set({ email, role: 'ADMIN', updatedAt: new Date().toISOString() }, { merge: true });

  // eslint-disable-next-line no-console
  console.log('✅ Admin ready:', { uid: user.uid, email });
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error('❌ Seed failed:', e);
  process.exit(1);
});
