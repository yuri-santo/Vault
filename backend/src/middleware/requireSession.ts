import type { Request, Response, NextFunction } from 'express';
import type admin from 'firebase-admin';

export type AuthedRequest = Request & {
  user?: { uid: string; email?: string; role?: string };
};

export function requireSession(fbAuth: admin.auth.Auth) {
  return async (req: AuthedRequest, res: Response, next: NextFunction) => {
    const sessionCookie = (req.cookies?.session as string | undefined) ?? undefined;
    if (!sessionCookie) return res.status(401).json({ message: 'Not authenticated' });

    try {
      const decoded = await fbAuth.verifySessionCookie(sessionCookie, true);
      req.user = {
        uid: decoded.uid,
        email: decoded.email,
        role: (decoded as any).role
      };
      return next();
    } catch {
      return res.status(401).json({ message: 'Invalid session' });
    }
  };
}
