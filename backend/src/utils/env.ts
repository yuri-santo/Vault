import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const schema = z.object({
  NODE_ENV: z.string().optional().default('development'),
  PORT: z.coerce.number().int().positive().optional().default(3001),

  CORS_ORIGIN: z.string().min(1),

  MASTER_ENCRYPTION_KEY: z.string().min(16),

  FIREBASE_SERVICE_ACCOUNT_JSON: z.string().min(1),

  // (Opcional) Service Account do Google Drive (JSON stringificado) para upload/list.
  // Recomendado: compartilhar uma pasta do Google Drive com o e-mail do service account.
  GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON: z.string().optional(),

  // (Opcional) API Key do Google Drive API para listar arquivos de uma pasta PUBLICAMENTE compartilhada
  // ("Anyone with the link"). Isso permite *listar* sem Service Account.
  // Upload/remoção via API ainda exigem OAuth/Service Account.
  GOOGLE_DRIVE_API_KEY: z.string().optional(),

  COOKIE_SECURE: z.coerce.boolean().optional().default(false),

  SESSION_TTL_MS: z.coerce.number().int().positive().optional().default(1000 * 60 * 60 * 12), // 12h

  // (Opcional) tokens para leitura/escrita de logs de cliente
  LOG_WRITE_TOKEN: z.string().optional(),
  LOG_READ_TOKEN: z.string().optional(),
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
