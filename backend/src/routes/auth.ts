import { Router } from 'express';
import type { RequestHandler } from 'express';
import type winston from 'winston';
import type { Auth } from 'firebase-admin/auth';
import type admin from 'firebase-admin';
import { auditFirestore } from '../utils/audit';

type AuthRouterOpts = {
  logger: winston.Logger;
  csrfProtection: RequestHandler;
  fbAuth: Auth;
  fbDb: admin.firestore.Firestore;
  sessionTtlDays: number;
  cookieSecure: boolean;
};

function getIp(req: any) {
  return (req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim())
    || req.socket?.remoteAddress
    || req.ip;
}

export function authRouter(opts: AuthRouterOpts) {
  const r = Router();

  // Cria sessão via Firebase ID token
  r.post('/session', opts.csrfProtection, async (req, res) => {
    try {
      const { idToken } = req.body as { idToken?: string };
      if (!idToken) return res.status(400).json({ error: 'Missing idToken' });

      const decoded = await opts.fbAuth.verifyIdToken(idToken);
      const expiresIn = opts.sessionTtlDays * 24 * 60 * 60 * 1000;

      // Firebase session cookie
      const sessionCookie = await opts.fbAuth.createSessionCookie(idToken, { expiresIn });

      // ✅ cookie cross-site
      res.cookie('session', sessionCookie, {
        httpOnly: true,
        secure: opts.cookieSecure,
        sameSite: opts.cookieSecure ? 'none' : 'lax',
        path: '/',
        maxAge: expiresIn
      });

      await auditFirestore(opts.fbDb, opts.logger, {
        action: 'login_success',
        uid: decoded.uid,
        email: decoded.email,
        ip: getIp(req),
        userAgent: req.headers['user-agent'],
      });

      return res.json({ ok: true, user: { uid: decoded.uid, email: decoded.email } });
    } catch (e) {
      opts.logger.warn({ type: 'auth_session_error', error: (e as Error).message });
      return res.status(401).json({ error: 'Invalid credentials' });
    }
  });

  // Retorna usuário atual
  r.get('/me', async (req, res) => {
    try {
      const session = req.cookies?.session;
      if (!session) return res.status(401).json({ error: 'Not authenticated' });

      const decoded = await opts.fbAuth.verifySessionCookie(session, true);
      return res.json({ user: { uid: decoded.uid, email: decoded.email } });
    } catch {
      return res.status(401).json({ error: 'Not authenticated' });
    }
  });

  // Logout
  r.post('/logout', opts.csrfProtection, async (_req, res) => {
    res.clearCookie('session', {
      httpOnly: true,
      secure: opts.cookieSecure,
      sameSite: opts.cookieSecure ? 'none' : 'lax',
      path: '/',
    });
    return res.json({ ok: true });
  });

  return r;
}
