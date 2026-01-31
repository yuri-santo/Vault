import { Router } from 'express';
import type { RequestHandler } from 'express';
import type winston from 'winston';
import type { Auth } from 'firebase-admin/auth';
import type admin from 'firebase-admin';
import { maybeEncrypt, maybeDecrypt } from '../utils/crypto';
import { auditFirestore } from '../utils/audit';
import { requireSession, type AuthedRequest } from '../middleware/requireSession';

type VaultRouterOpts = {
  logger: winston.Logger;
  csrfProtection: RequestHandler;
  fbAuth: Auth;
  fbDb: admin.firestore.Firestore;
  masterKey: string;
};

type VaultEntry = {
  ownerUid?: string;
  ownerEmail?: string;
  sharedWith?: string[];
  entryType?: string | null;
  name: string;
  url?: string | null;
  ip?: string | null;
  username?: string | null;
  password?: string | null;
  email?: string | null;
  connectionData?: string | null;
  // Backward compatible: stored encrypted as STRING.
  // Now can hold a JSON string with structured connection details.
  sapConnection?: string | null;
  vpnConnection?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

function safeJsonParse<T = any>(value: string | null | undefined): T | null {
  if (!value) return null;
  const s = String(value).trim();
  if (!s) return null;
  if (!(s.startsWith('{') || s.startsWith('['))) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

function getIp(req: any) {
  return (req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim())
    || req.socket?.remoteAddress
    || req.ip;
}

function tryParseJson<T = any>(s: any): T | null {
  if (!s || typeof s !== 'string') return null;
  const t = s.trim();
  if (!(t.startsWith('{') || t.startsWith('['))) return null;
  try {
    return JSON.parse(t) as T;
  } catch {
    return null;
  }
}

function normalizeToString(v: any): string | null {
  if (v === undefined) return null;
  if (v === null) return null;
  if (typeof v === 'string') return v;
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

export function vaultRouter(opts: VaultRouterOpts) {
  const r = Router();
  const auth = requireSession(opts.fbAuth as any);

  const col = opts.fbDb.collection('vaultEntries');

  // LIST
  r.get('/', auth, async (req: AuthedRequest, res) => {
    const uid = req.user!.uid;
    const email = req.user!.email;

    // Busca entradas próprias + compartilhadas (sem exigir index de orderBy)
    const [ownedSnap, sharedSnap] = await Promise.all([
      col.where('ownerUid', '==', uid).get(),
      col.where('sharedWith', 'array-contains', uid).get()
    ]);

    const byId = new Map<string, admin.firestore.QueryDocumentSnapshot>();
    ownedSnap.docs.forEach(d => byId.set(d.id, d));
    sharedSnap.docs.forEach(d => byId.set(d.id, d));

    const entries = Array.from(byId.values()).map(d => {
      const data = d.data() as any;
      const ownerUid = data.ownerUid ?? uid;
      const ownerEmail = data.ownerEmail ?? email ?? null;
      const canEdit = ownerUid === uid;
      const url = maybeDecrypt(data.url);
      const ip = maybeDecrypt(data.ip);
      const username = maybeDecrypt(data.username);
      const password = maybeDecrypt(data.password);
      const entryEmail = maybeDecrypt(data.email);
      const connectionData = maybeDecrypt(data.connectionData);
      const sapConnection = maybeDecrypt(data.sapConnection);
      const vpnConnection = maybeDecrypt(data.vpnConnection);
      const notes = maybeDecrypt(data.notes);

      const connectionJson = tryParseJson(connectionData);
      const sapJson = tryParseJson(sapConnection);
      const vpnJson = tryParseJson(vpnConnection);

      return {
        id: d.id,
        ownerUid,
        ownerEmail,
        canEdit,
        isShared: ownerUid !== uid,
        sharedWith: Array.isArray(data.sharedWith) ? data.sharedWith : [],
        entryType: data.entryType ?? null,
        name: data.name,
        url,
        ip,
        username,
        password,
        email: entryEmail,
        connectionData,
        connectionJson,
        sapConnection,
        sapJson,
        vpnConnection,
        vpnJson,
        notes,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    });

    entries.sort((a: any, b: any) => String(b.updatedAt).localeCompare(String(a.updatedAt)));

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
  r.post('/', auth, opts.csrfProtection, async (req: AuthedRequest, res) => {
    const now = new Date().toISOString();
    const body = req.body ?? {};

    if (!body.name || typeof body.name !== 'string') {
      return res.status(400).json({ error: 'name is required' });
    }

    const payload: VaultEntry = {
      ownerUid: req.user!.uid,
      ownerEmail: req.user!.email ?? null,
      sharedWith: [],
      entryType: typeof body.entryType === 'string' ? body.entryType.slice(0, 32) : 'generic',
      name: body.name,
      url: maybeEncrypt(body.url),
      ip: maybeEncrypt(body.ip),
      username: maybeEncrypt(body.username),
      password: maybeEncrypt(body.password),
      email: maybeEncrypt(body.email),
      connectionData: maybeEncrypt(normalizeToString(body.connectionData)),
      sapConnection: maybeEncrypt(normalizeToString(body.sapConnection)),
      vpnConnection: maybeEncrypt(normalizeToString(body.vpnConnection)),
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
  r.put('/:id', auth, opts.csrfProtection, async (req: AuthedRequest, res) => {
    const id = req.params.id;
    const now = new Date().toISOString();
    const body = req.body ?? {};

    const current = await col.doc(id).get();
    if (!current.exists) return res.status(404).json({ error: 'Not found' });
    const data = current.data() as any;
    const ownerUid = data.ownerUid ?? req.user!.uid;
    if (ownerUid !== req.user!.uid) return res.status(403).json({ error: 'Forbidden' });

    const patch: any = { updatedAt: now };

    if (body.name !== undefined) patch.name = body.name;
    if (body.entryType !== undefined) patch.entryType = typeof body.entryType === 'string' ? body.entryType.slice(0, 32) : null;
    if (body.url !== undefined) patch.url = maybeEncrypt(body.url);
    if (body.ip !== undefined) patch.ip = maybeEncrypt(body.ip);
    if (body.username !== undefined) patch.username = maybeEncrypt(body.username);
    if (body.password !== undefined) patch.password = maybeEncrypt(body.password);
    if (body.email !== undefined) patch.email = maybeEncrypt(body.email);
    if (body.connectionData !== undefined) patch.connectionData = maybeEncrypt(normalizeToString(body.connectionData));
    if (body.sapConnection !== undefined) patch.sapConnection = maybeEncrypt(normalizeToString(body.sapConnection));
    if (body.vpnConnection !== undefined) patch.vpnConnection = maybeEncrypt(normalizeToString(body.vpnConnection));
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

  // Compartilhar / atualizar lista de usuários com acesso
  // Aceita: { uids: string[], emails?: string[] }
  r.put('/:id/share', auth, opts.csrfProtection, async (req: AuthedRequest, res) => {
    const id = req.params.id;

    const uidsRaw = req.body?.uids ?? [];
    const emailsRaw = req.body?.emails ?? [];

    const uids = Array.isArray(uidsRaw) ? uidsRaw : [];
    const emails = Array.isArray(emailsRaw) ? emailsRaw : [];

    if (!uids.every((x) => typeof x === 'string')) {
      return res.status(400).json({ error: 'uids must be string[]' });
    }
    if (!emails.every((x) => typeof x === 'string')) {
      return res.status(400).json({ error: 'emails must be string[]' });
    }

    const current = await col.doc(id).get();
    if (!current.exists) return res.status(404).json({ error: 'Not found' });
    const data = current.data() as any;
    const ownerUid = data.ownerUid ?? req.user!.uid;
    if (ownerUid !== req.user!.uid) return res.status(403).json({ error: 'Forbidden' });

    // Resolve emails -> uids (best-effort, but report invalids)
    const resolved: string[] = [];
    const invalidEmails: string[] = [];

    for (const e of emails) {
      const email = String(e).trim();
      if (!email) continue;
      if (!email.includes('@')) {
        invalidEmails.push(email);
        continue;
      }
      try {
        const u = await opts.fbAuth.getUserByEmail(email);
        if (u?.uid) resolved.push(u.uid);
      } catch {
        invalidEmails.push(email);
      }
    }

    if (invalidEmails.length) {
      return res.status(400).json({
        error: 'Alguns e-mails não foram encontrados/validados.',
        invalidEmails,
      });
    }

    // Normalize unique uids (never include owner twice; allow sharing back to self is meaningless so skip)
    const uniq = new Set<string>();
    uids.map((x) => x.trim()).filter(Boolean).forEach((x) => uniq.add(x));
    resolved.forEach((x) => uniq.add(x));
    uniq.delete(req.user!.uid);

    const finalUids = Array.from(uniq.values());

    await col.doc(id).set({ sharedWith: finalUids, updatedAt: new Date().toISOString() }, { merge: true });

    await auditFirestore(opts.fbDb, opts.logger, {
      action: 'vault_share_update',
      uid: req.user?.uid,
      email: req.user?.email,
      ip: getIp(req as any),
      userAgent: (req as any).headers['user-agent'],
      details: { id, uids: finalUids }
    });

    return res.json({ ok: true, uids: finalUids });
  });

  // DELETE
  r.delete('/:id', auth, opts.csrfProtection, async (req: AuthedRequest, res) => {
    const id = req.params.id;

    const current = await col.doc(id).get();
    if (!current.exists) return res.status(404).json({ error: 'Not found' });
    const data = current.data() as any;
    const ownerUid = data.ownerUid ?? req.user!.uid;
    if (ownerUid !== req.user!.uid) return res.status(403).json({ error: 'Forbidden' });

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
