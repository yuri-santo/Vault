import { Router } from 'express';
import type { RequestHandler } from 'express';
import type winston from 'winston';
import type { Auth } from 'firebase-admin/auth';
import type admin from 'firebase-admin';
import { requireSession, type AuthedRequest } from '../middleware/requireSession';
import { auditFirestore } from '../utils/audit';

type NotesRouterOpts = {
  logger: winston.Logger;
  csrfProtection: RequestHandler;
  fbAuth: Auth;
  fbDb: admin.firestore.Firestore;
};

function getIp(req: any) {
  return (req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim())
    || req.socket?.remoteAddress
    || req.ip;
}

export function notesRouter(opts: NotesRouterOpts) {
  const r = Router();
  const auth = requireSession(opts.fbAuth as any);

  const col = opts.fbDb.collection('userNotes');

  r.get('/', auth, async (req: AuthedRequest, res) => {
    const uid = req.user!.uid;
    const snap = await col.doc(uid).get();
    const data = (snap.exists ? snap.data() : null) as any;
    return res.json({
      notes: data?.notes ?? '',
      updatedAt: data?.updatedAt ?? null,
    });
  });

  r.put('/', auth, opts.csrfProtection, async (req: AuthedRequest, res) => {
    const uid = req.user!.uid;
    const notes = String(req.body?.notes ?? '');
    const now = new Date().toISOString();

    await col.doc(uid).set({ notes, updatedAt: now }, { merge: true });

    await auditFirestore(opts.fbDb, opts.logger, {
      action: 'notes_update',
      uid,
      email: req.user?.email,
      ip: getIp(req),
      userAgent: (req as any).headers['user-agent'],
      details: { length: notes.length }
    });

    return res.json({ ok: true, updatedAt: now });
  });

  return r;
}
