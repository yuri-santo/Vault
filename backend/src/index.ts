import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import csurf from 'csurf';

import { loadEnv } from './utils/env';
import { authRouter } from './routes/auth';
import { vaultRouter } from './routes/vault';

const env = loadEnv();
const app = express();

const isProd = env.NODE_ENV === 'production';

// Render fica atrás de proxy. Sem isso, cookie Secure/SameSite=None pode falhar.
if (isProd) app.set('trust proxy', 1);

app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.use(morgan('combined'));

// rate limit básico
app.use(rateLimit({
  windowMs: 60_000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
}));

// CORS com credenciais (cookies)
app.use(cors({
  origin: env.CORS_ORIGIN.split(',').map(s => s.trim()).filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-CSRF-Token', 'Authorization'],
}));

// CSRF via cookie precisa aceitar cross-site em produção (SameSite=None)
const csrfProtection = csurf({
  cookie: {
    key: 'csrf_secret',
    httpOnly: true,
    secure: isProd || env.COOKIE_SECURE,                   // true no Render
    sameSite: (isProd || env.COOKIE_SECURE) ? 'none' : 'lax',
    path: '/',
  }
});

// rotas públicas
app.get('/', (_req, res) => res.status(200).send('OK'));
app.get('/health', (_req, res) => res.status(200).json({ ok: true }));

// CSRF: expõe token
app.get('/auth/csrf', csrfProtection, (req, res) => {
  // csurf injeta req.csrfToken()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const token = (req as any).csrfToken();
  res.json({ csrfToken: token });
});

// rotas (session/vault precisam de CSRF para POST/PUT/DELETE)
app.use('/auth', csrfProtection, authRouter(env));
app.use('/vault', csrfProtection, vaultRouter(env));

const port = env.PORT;
app.listen(port, () => {
  console.log(JSON.stringify({ type: 'startup', env: env.NODE_ENV, port }));
});
