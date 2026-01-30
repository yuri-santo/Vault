import { Router } from 'express';
import type { RequestHandler } from 'express';
import type winston from 'winston';
import type { Auth, DecodedIdToken } from 'firebase-admin/auth';
import type admin from 'firebase-admin';
import { auditFirestore } from '../utils/audit';

export type AuthRouterOpts = {
  logger: winston.Logger;
  csrfProtection: RequestHandler;
  fbAuth: Auth;
  fbDb: admin.firestore.Firestore;
  sessionTtlDays: number;
  cookieSecure: boolean;
};

function getIp(req: any) {
  return (
    req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    req.ip
  );
}

function getBearerToken(req: any): string | null {
  const h = (req.headers?.authorization || req.headers?.Authorization || '') as string;
  if (!h) return null;
  const m = /^Bearer\s+(.+)$/i.exec(String(h).trim());
  return m ? m[1] : null;
}

function getRole(decoded: DecodedIdToken): string | undefined {
  // custom claims geralmente aparecem direto no decoded
  return (decoded as any).role || (decoded as any).claims?.role;
}

async function decodeFromRequest(
  opts: AuthRouterOpts,
  req: any
): Promise<{ decoded: DecodedIdToken; mode: 'bearer' | 'cookie' }> {
  const bearer = getBearerToken(req);
  if (bearer) {
    const decoded = await opts.fbAuth.verifyIdToken(bearer);
    return { decoded, mode: 'bearer' };
  }

  const session = req.cookies?.session;
  if (session) {
    const decoded = await opts.fbAuth.verifySessionCookie(session, true);
    return { decoded, mode: 'cookie' };
  }

  const idToken = req.body?.idToken;
  if (idToken) {
    const decoded = await opts.fbAuth.verifyIdToken(idToken);
    return { decoded, mode: 'bearer' };
  }

  throw Object.assign(new Error('Not authenticated'), { status: 401 });
}

export function authRouter(opts: AuthRouterOpts) {
  const r = Router();

  /**
   * Cria uma sessão.
   *
   * ✅ Modo recomendado (front/back em domínios diferentes):
   *   - Enviar Authorization: Bearer <Firebase ID Token>
   *   - O backend NÃO depende de cookies
   *
   * 🔁 Modo compatível (cookie):
   *   - Enviar { idToken, setCookie: true } e o backend cria cookie "session"
   */
  r.post('/session', opts.csrfProtection, async (req, res) => {
    try {
      const { decoded, mode } = await decodeFromRequest(opts, req);
      const role = getRole(decoded);

      // opcional: setar cookie de sessão (modo legacy)
      const setCookie = Boolean(req.body?.setCookie);
      if (setCookie) {
        const expiresIn = opts.sessionTtlDays * 24 * 60 * 60 * 1000;
        const sessionCookie = await opts.fbAuth.createSessionCookie(req.body.idToken, { expiresIn });
        res.cookie('session', sessionCookie, {
          httpOnly: true,
          secure: opts.cookieSecure,
          sameSite: opts.cookieSecure ? 'none' : 'lax',
          path: '/',
          maxAge: expiresIn,
        });
      }

      await auditFirestore(opts.fbDb, opts.logger, {
        action: 'login_success',
        uid: decoded.uid,
        email: decoded.email,
        ip: getIp(req),
        userAgent: req.headers['user-agent'],
        details: { mode },
      });

      return res.json({ ok: true, user: { uid: decoded.uid, email: decoded.email, role } });
    } catch (e: any) {
      const status = e?.status || 401;
      opts.logger.warn({ type: 'auth_session_error', status, error: e?.message || String(e) });
      return res.status(status).json({ error: status === 401 ? 'Not authenticated' : 'Auth error' });
    }
  });

  // Retorna usuário atual (Bearer ou cookie)
  r.get('/me', async (req, res) => {
    try {
      const { decoded } = await decodeFromRequest(opts, req);
      const role = getRole(decoded);
      return res.json({ user: { uid: decoded.uid, email: decoded.email, role } });
    } catch (_e: any) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
  });

  // Logout (limpa cookie, se existir)
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
