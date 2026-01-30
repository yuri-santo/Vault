import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const schema = z.object({
  NODE_ENV: z.string().optional().default('development'),
  PORT: z.coerce.number().int().positive().optional().default(3001),

  CORS_ORIGIN: z.string().min(1),

  MASTER_ENCRYPTION_KEY: z.string().min(16),

  FIREBASE_SERVICE_ACCOUNT_JSON: z.string().min(1),

  COOKIE_SECURE: z.coerce.boolean().optional().default(false),

  SESSION_TTL_MS: z.coerce.number().int().positive().optional().default(1000 * 60 * 60 * 12), // 12h
});

export type Env = z.infer<typeof schema>;

export function loadEnv(): Env {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
  }
  return parsed.data;
}
