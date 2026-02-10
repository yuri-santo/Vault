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
import path from 'path';
import fs from 'fs';

import { loadEnv } from './utils/env';
import { authRouter } from './routes/auth';
import { vaultRouter } from './routes/vault';
import { sharingRouter } from './routes/sharing';
import { notesRouter } from './routes/notes';
import { driveRouter } from './routes/drive';
import { projectsRouter } from './routes/projects';
import { logsRouter } from './routes/logs';

const env = loadEnv();
const app = express();

const isProd = env.NODE_ENV === 'production';
const cookieSecure = env.COOKIE_SECURE ?? isProd;
const serveFrontend = Boolean(env.SERVE_FRONTEND);
const frontendDistDir = env.FRONTEND_DIST_DIR
  ? path.resolve(env.FRONTEND_DIST_DIR)
  : path.resolve(process.cwd(), '../frontend/dist');

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

app.use(helmet({
  // Allow OAuth popups to keep window.opener (needed by Firebase Google login)
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  // Avoid COEP issues with third-party auth scripts
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://apis.google.com', 'https://www.gstatic.com'],
      scriptSrcAttr: ["'none'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https://www.gstatic.com', 'https://lh3.googleusercontent.com'],
      fontSrc: ["'self'", 'data:'],
      connectSrc: [
        "'self'",
        'https://identitytoolkit.googleapis.com',
        'https://securetoken.googleapis.com',
        'https://www.googleapis.com',
        'https://apis.google.com',
        'https://firebaseinstallations.googleapis.com',
        'https://www.gstatic.com'
      ],
      frameSrc: ["'self'", 'https://accounts.google.com', 'https://*.firebaseapp.com', 'https://*.firebaseauth.com'],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'self'"],
    },
  },
}));
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
  allowedHeaders: ['Content-Type', 'X-CSRF-Token', 'Authorization', 'X-Log-Token'],
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

// ✅ CSRF é necessário apenas quando a autenticação usa cookies (same-site).
// Quando usamos Authorization: Bearer <ID_TOKEN> (recomendado para front/back em domínios diferentes),
// não dependemos de cookies e não precisamos aplicar CSRF.
function csrfIfCookie(mw: express.RequestHandler): express.RequestHandler {
  return (req, res, next) => {
    const hasBearer = typeof req.headers.authorization === 'string' && /^Bearer\s+/i.test(req.headers.authorization);
    const hasSessionCookie = Boolean((req as any).cookies?.session);
    // Se tem Bearer -> dispensa CSRF (mesmo que exista cookie)
    if (hasBearer) return next();
    // Se não tem cookie -> também dispensa (não há sessão via cookie)
    if (!hasSessionCookie) return next();
    // Cookie-mode -> aplica CSRF
    return mw(req, res, next);
  };
}

// Health / root
if (!serveFrontend) {
  app.get('/', (_req, res) => res.status(200).send('OK'));
}
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
  csrfProtection: csrfIfCookie(csrfProtection),
  fbAuth,
  fbDb,
  sessionTtlDays: Math.max(1, Math.ceil(env.SESSION_TTL_MS / 86_400_000)),
  cookieSecure
}));

app.use('/vault', vaultRouter({
  logger,
  csrfProtection: csrfIfCookie(csrfProtection),
  fbAuth,
  fbDb,
  masterKey: env.MASTER_ENCRYPTION_KEY
}));

app.use('/sharing', sharingRouter({
  logger,
  csrfProtection: csrfIfCookie(csrfProtection),
  fbAuth,
  fbDb,
}));

app.use('/notes', notesRouter({
  logger,
  csrfProtection: csrfIfCookie(csrfProtection),
  fbAuth,
  fbDb,
}));

app.use('/drive', driveRouter({
  logger,
  csrfProtection: csrfIfCookie(csrfProtection),
  fbAuth,
  fbDb,
  driveApiKey: env.GOOGLE_DRIVE_API_KEY,
}));

app.use('/projects', projectsRouter({
  logger,
  csrfProtection: csrfIfCookie(csrfProtection),
  fbAuth,
  fbDb,
}));

// Logs do navegador (público e sem credenciais)
app.use('/logs', cors({
  origin: true,
  credentials: false,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Log-Token'],
}));

app.use('/logs', logsRouter({
  logger,
  readToken: env.LOG_READ_TOKEN,
  writeToken: env.LOG_WRITE_TOKEN,
}));

// Opcional: servir frontend estÃ¡tico pelo backend (mesma porta)
if (serveFrontend) {
  const indexPath = path.join(frontendDistDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    app.use(express.static(frontendDistDir));
    app.get('*', (req, res, next) => {
      if (req.method !== 'GET') return next();
      if (!req.accepts('html')) return next();
      return res.sendFile(indexPath);
    });
  } else {
    logger.warn({ type: 'frontend_missing', dir: frontendDistDir });
  }
}

// Error handler (captura erros do servidor)
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ type: 'server_error', message: err?.message, stack: err?.stack });
  res.status(500).json({ ok: false, error: 'internal_error' });
});

app.listen(env.PORT, () => {
  logger.info({ type: 'startup', env: env.NODE_ENV, port: env.PORT });
});
