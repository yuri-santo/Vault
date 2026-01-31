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
  const itemsCol = opts.fbDb.collection('notesItems');

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

  // ---- Notes Items (cards) ----
  // List items
  r.get('/items', auth, async (req: AuthedRequest, res) => {
    const uid = req.user!.uid;
    const snap = await itemsCol.where('ownerUid', '==', uid).get();
    const items = snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as any) }))
      .sort((a: any, b: any) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
    return res.json({ items });
  });

  // Create item
  r.post('/items', auth, opts.csrfProtection, async (req: AuthedRequest, res) => {
    const uid = req.user!.uid;
    const now = new Date().toISOString();
    const title = String(req.body?.title ?? '').trim();
    const content = String(req.body?.content ?? '').trim();
    if (!title) return res.status(400).json({ error: 'title is required' });
    const doc = await itemsCol.add({ ownerUid: uid, title: title.slice(0, 160), content: content.slice(0, 20000), createdAt: now, updatedAt: now });
    await auditFirestore(opts.fbDb, opts.logger, {
      action: 'note_item_create',
      uid,
      email: req.user?.email,
      ip: getIp(req),
      userAgent: (req as any).headers['user-agent'],
      details: { id: doc.id },
    });
    return res.json({ ok: true, id: doc.id });
  });

  // Update item
  r.put('/items/:id', auth, opts.csrfProtection, async (req: AuthedRequest, res) => {
    const uid = req.user!.uid;
    const id = String(req.params.id ?? '');
    const ref = itemsCol.doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Not found' });
    const data = snap.data() as any;
    if ((data?.ownerUid ?? null) !== uid) return res.status(403).json({ error: 'Forbidden' });
    const patch: any = { updatedAt: new Date().toISOString() };
    if (req.body?.title !== undefined) patch.title = String(req.body.title ?? '').trim().slice(0, 160);
    if (req.body?.content !== undefined) patch.content = String(req.body.content ?? '').trim().slice(0, 20000);
    await ref.set(patch, { merge: true });
    await auditFirestore(opts.fbDb, opts.logger, {
      action: 'note_item_update',
      uid,
      email: req.user?.email,
      ip: getIp(req),
      userAgent: (req as any).headers['user-agent'],
      details: { id },
    });
    return res.json({ ok: true });
  });

  // Delete item
  r.delete('/items/:id', auth, opts.csrfProtection, async (req: AuthedRequest, res) => {
    const uid = req.user!.uid;
    const id = String(req.params.id ?? '');
    const ref = itemsCol.doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Not found' });
    const data = snap.data() as any;
    if ((data?.ownerUid ?? null) !== uid) return res.status(403).json({ error: 'Forbidden' });
    await ref.delete();
    await auditFirestore(opts.fbDb, opts.logger, {
      action: 'note_item_delete',
      uid,
      email: req.user?.email,
      ip: getIp(req),
      userAgent: (req as any).headers['user-agent'],
      details: { id },
    });
    return res.json({ ok: true });
  });

  return r;
}
