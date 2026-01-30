import { Router } from 'express';
import csurf from 'csurf';
import { z } from 'zod';
import type winston from 'winston';import type admin from 'firebase-admin';import { auditFirestore } from '../utils/auditFirestore';
import { requireSession, type AuthedRequest } from '../middleware/requireSession';

const sessionSchema = z.object({
  idToken: z.string().min(50)
});

export function authRouter(opts: {
  logger: winston.Logger;
  csrfProtection: ReturnType<typeof csurf>;
  fbAuth: admin.auth.Auth;
  fbDb: admin.firestore.Firestore;
  sessionTtlDays: number;
  cookieSecure: boolean;
}) {
  const r = Router();

  // Get a CSRF token (front-end should call this before any POST/PUT/DELETE)
  r.get('/csrf', opts.csrfProtection, (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
  });

  // Establish a server-side session cookie using a Firebase ID token.
  // Front-end flow:
  // 1) Firebase signInWithEmailAndPassword
  // 2) getIdToken()
  // 3) POST /auth/session {idToken}
  r.post('/session', opts.csrfProtection, async (req, res) => {
    const parsed = sessionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'Invalid payload' });

    const ip = req.ip;
    const userAgent = req.get('user-agent') ?? undefined;

    try {
      const decoded = await opts.fbAuth.verifyIdToken(parsed.data.idToken);
      const expiresIn = opts.sessionTtlDays * 24 * 60 * 60 * 1000;
      const sessionCookie = await opts.fbAuth.createSessionCookie(parsed.data.idToken, { expiresIn });

      res.cookie('session', sessionCookie, {
        httpOnly: true,
        secure: opts.cookieSecure,
        sameSite: 'strict',
        path: '/',
        maxAge: expiresIn
      });

      const email = decoded.email ?? undefined;
      const role = (decoded as any).role ?? undefined;

      await auditFirestore(opts.fbDb, opts.logger, { action: 'auth.login_success', uid: decoded.uid, email, ip, userAgent });

      return res.json({
        user: {
          uid: decoded.uid,
          email,
          role
        }
      });
    } catch (e) {
      await auditFirestore(opts.fbDb, opts.logger, { action: 'auth.login_failed', ip, userAgent, details: { reason: 'invalid_id_token' } });
      return res.status(401).json({ message: 'Invalid credentials' });
    }
  });

  // Current user (session-based)
  r.get('/me', requireSession(opts.fbAuth), async (req: AuthedRequest, res) => {
    return res.json({ user: req.user });
  });

  // Logout
  r.post('/logout', opts.csrfProtection, async (req, res) => {
    const ip = req.ip;
    const userAgent = req.get('user-agent') ?? undefined;
    const sessionCookie = req.cookies?.session as string | undefined;

    // Best-effort revoke
    if (sessionCookie) {
      try {
        const decoded = await opts.fbAuth.verifySessionCookie(sessionCookie, true);
        await opts.fbAuth.revokeRefreshTokens(decoded.uid);
        await auditFirestore(opts.fbDb, opts.logger, { action: 'auth.logout', uid: decoded.uid, email: (decoded as any).email, ip, userAgent });
      } catch {
        // ignore
      }
    }

    res.clearCookie('session', { path: '/' });
    return res.json({ ok: true });
  });

  return r;
}
