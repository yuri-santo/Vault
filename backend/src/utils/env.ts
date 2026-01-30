import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),

  // Firebase Admin SDK service account JSON
  FIREBASE_SERVICE_ACCOUNT_JSON: z.string().min(30),

  // Session cookie lifetime (server-side). Client still uses Firebase refresh tokens.
  SESSION_COOKIE_TTL_DAYS: z.coerce.number().int().positive().default(5),

  MASTER_ENCRYPTION_KEY: z.string().min(32),

  CORS_ORIGIN: z.string().min(1),

  COOKIE_SECURE: z.coerce.boolean().default(false),


  LOG_DIR: z.string().default('logs')
});

export type Env = z.infer<typeof schema>;

export function loadEnv(): Env {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
  }
  return parsed.data;
}
