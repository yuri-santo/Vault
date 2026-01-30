import type { Request, Response, NextFunction } from 'express';
import type admin from 'firebase-admin';

export type AuthedRequest = Request & {
  user?: { uid: string; email?: string; role?: string };
  /** How the user authenticated for this request (used to relax CSRF when using Bearer). */
  authMode?: 'bearer' | 'cookie';
};

function getBearerToken(req: any): string | null {
  const h = (req.headers?.authorization || req.headers?.Authorization || '') as string;
  if (!h) return null;
  const m = /^Bearer\s+(.+)$/i.exec(h.trim());
  return m ? m[1] : null;
}

export function requireSession(fbAuth: admin.auth.Auth) {
  return async (req: AuthedRequest, res: Response, next: NextFunction) => {
    // 1) Prefer Bearer token (works well across different frontend/back-end domains)
    const bearer = getBearerToken(req);
    if (bearer) {
      try {
        const decoded = await fbAuth.verifyIdToken(bearer, true);
        req.user = {
          uid: decoded.uid,
          email: decoded.email,
          role: (decoded as any).role
        };
        req.authMode = 'bearer';
        return next();
      } catch {
        return res.status(401).json({ message: 'Invalid bearer token' });
      }
    }

    // 2) Fallback to session cookie (same-domain / legacy mode)
    const sessionCookie = (req.cookies?.session as string | undefined) ?? undefined;
    if (!sessionCookie) return res.status(401).json({ message: 'Not authenticated' });

    try {
      const decoded = await fbAuth.verifySessionCookie(sessionCookie, true);
      req.user = {
        uid: decoded.uid,
        email: decoded.email,
        role: (decoded as any).role
      };
      req.authMode = 'cookie';
      return next();
    } catch {
      return res.status(401).json({ message: 'Invalid session' });
    }
  };
}
