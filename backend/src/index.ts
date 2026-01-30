import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import csurf from 'csurf';
import admin from 'firebase-admin';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

import { loadEnv } from './utils/env';
import { authRouter } from './routes/auth';
import { vaultRouter } from './routes/vault';
import { sharingRouter } from './routes/sharing';
import { notesRouter } from './routes/notes';
import { driveRouter } from './routes/drive';

const env = loadEnv();
const app = express();

const isProd = env.NODE_ENV === 'production';
const cookieSecure = isProd || env.COOKIE_SECURE;

// ✅ Render fica atrás de proxy (necessário para cookie Secure funcionar direito)
if (isProd) app.set('trust proxy', 1);

// Logger
const logger = winston.createLogger({
  level: isProd ? 'info' : 'debug',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new DailyRotateFile({
      dirname: 'logs',
      filename: 'app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',
      zippedArchive: true,
    })
  ]
});

app.use(helmet());
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// HTTP log
app.use(morgan('combined', {
  stream: {
    write: (msg) => logger.info({ type: 'http', msg: msg.trim() }),
  }
}));

// Rate limit
app.use(rateLimit({
  windowMs: 60_000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
}));

// ✅ CORS (cross-domain) com credenciais
app.use(cors({
  origin: env.CORS_ORIGIN.split(',').map(s => s.trim()).filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-CSRF-Token', 'Authorization'],
}));

// Firebase Admin init
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const fbAuth = admin.auth();
const fbDb = admin.firestore();

// ✅ CSRF cookie precisa aceitar cross-site em produção
const csrfProtection = csurf({
  cookie: {
    key: 'csrf_secret',
    httpOnly: true,
    secure: cookieSecure,
    sameSite: cookieSecure ? 'none' : 'lax',
    path: '/',
  },
});

// Health / root
app.get('/', (_req, res) => res.status(200).send('OK'));
app.get('/health', (_req, res) => res.status(200).json({ ok: true }));

// Endpoint para obter token CSRF
app.get('/auth/csrf', csrfProtection, (req, res) => {
  // csurf injeta csrfToken() na request
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const token = (req as any).csrfToken();
  res.json({ csrfToken: token });
});

// Routers (agora com as dependências corretas)
app.use('/auth', authRouter({
  logger,
  csrfProtection,
  fbAuth,
  fbDb,
  sessionTtlDays: Math.max(1, Math.ceil(env.SESSION_TTL_MS / 86_400_000)),
  cookieSecure
}));

app.use('/vault', vaultRouter({
  logger,
  csrfProtection,
  fbAuth,
  fbDb,
  masterKey: env.MASTER_ENCRYPTION_KEY
}));

app.use('/sharing', sharingRouter({
  logger,
  csrfProtection,
  fbAuth,
  fbDb,
}));

app.use('/notes', notesRouter({
  logger,
  csrfProtection,
  fbAuth,
  fbDb,
}));

app.use('/drive', driveRouter({
  logger,
  csrfProtection,
  fbAuth,
  fbDb,
  driveServiceAccountJson: env.GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON,
  driveApiKey: env.GOOGLE_DRIVE_API_KEY,
}));

app.listen(env.PORT, () => {
  logger.info({ type: 'startup', env: env.NODE_ENV, port: env.PORT });
});
