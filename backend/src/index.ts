import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import csurf from 'csurf';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import 'dotenv/config';
import { loadEnv } from './utils/env';
import { createLogger } from './utils/logger';
import { authRouter } from './routes/auth';
import { vaultRouter } from './routes/vault';
import { getAuth, getFirestore } from './firebaseAdmin';

const env = loadEnv();
const logger = createLogger(env.LOG_DIR);

const app = express();
app.set('trust proxy', 1);

app.use(helmet());

app.use(cors({
  origin: env.CORS_ORIGIN.split(',').map(s => s.trim()).filter(Boolean),
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.use(morgan('combined', {
  stream: { write: (msg) => logger.info({ type: 'http', msg: msg.trim() }) }
}));

// Basic rate limiting
app.use(rateLimit({ windowMs: 60_000, max: 300 }));

const csrfProtection = csurf({
  cookie: {
    key: 'csrf_secret',
    httpOnly: true,
    sameSite: 'strict',
    secure: env.COOKIE_SECURE
  }
});


app.get('/health', (_req, res) => res.json({ ok: true }));

// Init Firebase Admin lazily (throws if env missing)
const fbAuth = getAuth();
const fbDb = getFirestore();

// Auth
app.use('/auth', authRouter({
  logger,
  csrfProtection,
  fbAuth,
  fbDb,
  sessionTtlDays: env.SESSION_COOKIE_TTL_DAYS,
  cookieSecure: env.COOKIE_SECURE}));

// Vault
app.use('/vault', vaultRouter({
  logger,
  csrfProtection,
  fbAuth,
  fbDb,
  masterKey: env.MASTER_ENCRYPTION_KEY
}));

// 404
app.use((_req, res) => res.status(404).json({ message: 'Not found' }));

// Error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err?.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ message: 'Invalid CSRF token' });
  }
  logger.error({ type: 'unhandled_error', error: err?.message ?? String(err) });
  return res.status(500).json({ message: 'Internal server error' });
});

app.listen(env.PORT, () => {
  logger.info({ type: 'startup', port: env.PORT, env: env.NODE_ENV });
});
