import { Router } from 'express';
import csurf from 'csurf';
import { z } from 'zod';
import type winston from 'winston';
import type admin from 'firebase-admin';
import { maybeDecrypt, maybeEncrypt } from '../utils/crypto';
import { requireSession, type AuthedRequest } from '../middleware/requireSession';
import { auditFirestore } from '../utils/auditFirestore';

const entrySchema = z.object({
  name: z.string().min(1).max(120),
  ip: z.string().max(200).optional().nullable(),
  username: z.string().max(200).optional().nullable(),
  password: z.string().max(2000).optional().nullable(),
  email: z.string().max(320).optional().nullable(),
  connectionData: z.string().max(5000).optional().nullable(),
  notes: z.string().max(10000).optional().nullable()
});

const entryPatchSchema = entrySchema.partial();

export function vaultRouter(opts: {
  logger: winston.Logger;
  csrfProtection: ReturnType<typeof csurf>;
  fbAuth: admin.auth.Auth;
  fbDb: admin.firestore.Firestore;
  masterKey: string;
}) {
  const r = Router();

  const authMw = requireSession(opts.fbAuth);
  const coll = opts.fbDb.collection('vaultEntries');

  function toApi(doc: admin.firestore.DocumentSnapshot) {
    const d = doc.data() as any;
    return {
      id: doc.id,
      name: d.name,
      ip: maybeDecrypt(d.ip, opts.masterKey),
      username: maybeDecrypt(d.username, opts.masterKey),
      password: maybeDecrypt(d.password, opts.masterKey),
      email: maybeDecrypt(d.email, opts.masterKey),
      connectionData: maybeDecrypt(d.connectionData, opts.masterKey),
      notes: maybeDecrypt(d.notes, opts.masterKey),
      createdAt: d.createdAt,
      updatedAt: d.updatedAt
    };
  }

  // List all entries (visible to any logged user)
  r.get('/', authMw, async (_req, res) => {
    const snap = await coll.orderBy('updatedAt', 'desc').limit(1000).get();
    const entries = snap.docs.map(toApi);
    return res.json({ entries });
  });

  // Create
  r.post('/', authMw, opts.csrfProtection, async (req: AuthedRequest, res) => {
    const parsed = entrySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'Invalid payload' });

    const now = new Date().toISOString();
    const payload = {
      name: parsed.data.name,
      ip: maybeEncrypt(parsed.data.ip ?? null, opts.masterKey),
      username: maybeEncrypt(parsed.data.username ?? null, opts.masterKey),
      password: maybeEncrypt(parsed.data.password ?? null, opts.masterKey),
      email: maybeEncrypt(parsed.data.email ?? null, opts.masterKey),
      connectionData: maybeEncrypt(parsed.data.connectionData ?? null, opts.masterKey),
      notes: maybeEncrypt(parsed.data.notes ?? null, opts.masterKey),
      createdAt: now,
      updatedAt: now,
      createdByUid: req.user?.uid,
      createdByEmail: req.user?.email,
      updatedByUid: req.user?.uid,
      updatedByEmail: req.user?.email
    };

    const ref = await coll.add(payload);

    await auditFirestore(opts.fbDb, opts.logger, {
      action: 'vault.create',
      uid: req.user?.uid,
      email: req.user?.email,
      ip: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
      details: { entryId: ref.id, name: parsed.data.name }
    });

    return res.status(201).json({ id: ref.id });
  });

  // Update
  r.put('/:id', authMw, opts.csrfProtection, async (req: AuthedRequest, res) => {
    const id = req.params.id;
    const parsed = entryPatchSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'Invalid payload' });

    const now = new Date().toISOString();
    const patch: any = {
      updatedAt: now,
      updatedByUid: req.user?.uid,
      updatedByEmail: req.user?.email
    };
    if (parsed.data.name !== undefined) patch.name = parsed.data.name;
    if (parsed.data.ip !== undefined) patch.ip = maybeEncrypt(parsed.data.ip ?? null, opts.masterKey);
    if (parsed.data.username !== undefined) patch.username = maybeEncrypt(parsed.data.username ?? null, opts.masterKey);
    if (parsed.data.password !== undefined) patch.password = maybeEncrypt(parsed.data.password ?? null, opts.masterKey);
    if (parsed.data.email !== undefined) patch.email = maybeEncrypt(parsed.data.email ?? null, opts.masterKey);
    if (parsed.data.connectionData !== undefined) patch.connectionData = maybeEncrypt(parsed.data.connectionData ?? null, opts.masterKey);
    if (parsed.data.notes !== undefined) patch.notes = maybeEncrypt(parsed.data.notes ?? null, opts.masterKey);

    await coll.doc(id).set(patch, { merge: true });

    await auditFirestore(opts.fbDb, opts.logger, {
      action: 'vault.update',
      uid: req.user?.uid,
      email: req.user?.email,
      ip: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
      details: { entryId: id }
    });

    return res.json({ ok: true });
  });

  // Delete
  r.delete('/:id', authMw, opts.csrfProtection, async (req: AuthedRequest, res) => {
    const id = req.params.id;
    await coll.doc(id).delete();

    await auditFirestore(opts.fbDb, opts.logger, {
      action: 'vault.delete',
      uid: req.user?.uid,
      email: req.user?.email,
      ip: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
      details: { entryId: id }
    });

    return res.json({ ok: true });
  });

  return r;
}
