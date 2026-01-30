import { Router } from 'express';
import type { RequestHandler } from 'express';
import type winston from 'winston';
import type { Auth } from 'firebase-admin/auth';
import type admin from 'firebase-admin';
import { maybeEncrypt, maybeDecrypt } from '../utils/crypto';
import { auditFirestore } from '../utils/audit';

type VaultRouterOpts = {
  logger: winston.Logger;
  csrfProtection: RequestHandler;
  fbAuth: Auth;
  fbDb: admin.firestore.Firestore;
  masterKey: string;
};

type VaultEntry = {
  name: string;
  ip?: string | null;
  username?: string | null;
  password?: string | null;
  email?: string | null;
  connectionData?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

function getIp(req: any) {
  return (req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim())
    || req.socket?.remoteAddress
    || req.ip;
}

// Middleware simples: exige cookie de sessão do Firebase
function requireSession(opts: VaultRouterOpts) {
  return async (req: any, res: any, next: any) => {
    try {
      const session = req.cookies?.session;
      if (!session) return res.status(401).json({ error: 'Not authenticated' });

      const decoded = await opts.fbAuth.verifySessionCookie(session, true);
      req.user = { uid: decoded.uid, email: decoded.email };
      next();
    } catch {
      return res.status(401).json({ error: 'Not authenticated' });
    }
  };
}

export function vaultRouter(opts: VaultRouterOpts) {
  const r = Router();
  const auth = requireSession(opts);

  const col = opts.fbDb.collection('vaultEntries');

  // LIST
  r.get('/', auth, async (req: any, res) => {
    const snap = await col.orderBy('updatedAt', 'desc').get();

    const entries = snap.docs.map(d => {
      const data = d.data() as any;
      return {
        id: d.id,
        name: data.name,
        ip: maybeDecrypt(data.ip),
        username: maybeDecrypt(data.username),
        password: maybeDecrypt(data.password),
        email: maybeDecrypt(data.email),
        connectionData: maybeDecrypt(data.connectionData),
        notes: maybeDecrypt(data.notes),
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    });

    await auditFirestore(opts.fbDb, opts.logger, {
      action: 'vault_list',
      uid: req.user?.uid,
      email: req.user?.email,
      ip: getIp(req),
      userAgent: req.headers['user-agent'],
      details: { count: entries.length }
    });

    res.json({ entries });
  });

  // CREATE
  r.post('/', auth, opts.csrfProtection, async (req: any, res) => {
    const now = new Date().toISOString();
    const body = req.body ?? {};

    if (!body.name || typeof body.name !== 'string') {
      return res.status(400).json({ error: 'name is required' });
    }

    const payload: VaultEntry = {
      name: body.name,
      ip: maybeEncrypt(body.ip),
      username: maybeEncrypt(body.username),
      password: maybeEncrypt(body.password),
      email: maybeEncrypt(body.email),
      connectionData: maybeEncrypt(body.connectionData),
      notes: maybeEncrypt(body.notes),
      createdAt: now,
      updatedAt: now,
    };

    const doc = await col.add(payload);

    await auditFirestore(opts.fbDb, opts.logger, {
      action: 'vault_create',
      uid: req.user?.uid,
      email: req.user?.email,
      ip: getIp(req),
      userAgent: req.headers['user-agent'],
      details: { id: doc.id, name: body.name }
    });

    res.json({ id: doc.id });
  });

  // UPDATE
  r.put('/:id', auth, opts.csrfProtection, async (req: any, res) => {
    const id = req.params.id;
    const now = new Date().toISOString();
    const body = req.body ?? {};

    const patch: any = { updatedAt: now };

    if (body.name !== undefined) patch.name = body.name;
    if (body.ip !== undefined) patch.ip = maybeEncrypt(body.ip);
    if (body.username !== undefined) patch.username = maybeEncrypt(body.username);
    if (body.password !== undefined) patch.password = maybeEncrypt(body.password);
    if (body.email !== undefined) patch.email = maybeEncrypt(body.email);
    if (body.connectionData !== undefined) patch.connectionData = maybeEncrypt(body.connectionData);
    if (body.notes !== undefined) patch.notes = maybeEncrypt(body.notes);

    await col.doc(id).set(patch, { merge: true });

    await auditFirestore(opts.fbDb, opts.logger, {
      action: 'vault_update',
      uid: req.user?.uid,
      email: req.user?.email,
      ip: getIp(req),
      userAgent: req.headers['user-agent'],
      details: { id }
    });

    res.json({ ok: true });
  });

  // DELETE
  r.delete('/:id', auth, opts.csrfProtection, async (req: any, res) => {
    const id = req.params.id;
    await col.doc(id).delete();

    await auditFirestore(opts.fbDb, opts.logger, {
      action: 'vault_delete',
      uid: req.user?.uid,
      email: req.user?.email,
      ip: getIp(req),
      userAgent: req.headers['user-agent'],
      details: { id }
    });

    res.json({ ok: true });
  });

  return r;
}
