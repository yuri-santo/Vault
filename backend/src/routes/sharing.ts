import { Router } from 'express';
import type { RequestHandler } from 'express';
import type winston from 'winston';
import type { Auth } from 'firebase-admin/auth';
import type admin from 'firebase-admin';
import { requireSession, type AuthedRequest } from '../middleware/requireSession';
import { auditFirestore } from '../utils/audit';

type SharingRouterOpts = {
  logger: winston.Logger;
  csrfProtection: RequestHandler;
  fbAuth: Auth;
  fbDb: admin.firestore.Firestore;
};

type ShareInvite = {
  fromUid: string;
  fromEmail?: string | null;
  toEmailLower: string;
  toEmail?: string | null;
  toUid?: string | null;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  acceptedAt?: string | null;
  declinedAt?: string | null;
};

function getIp(req: any) {
  return (req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim())
    || req.socket?.remoteAddress
    || req.ip;
}

export function sharingRouter(opts: SharingRouterOpts) {
  const r = Router();
  const auth = requireSession(opts.fbAuth as any);

  const invitesCol = opts.fbDb.collection('shareInvites');

  // Criar convite (intenção do dono)
  r.post('/invites', auth, opts.csrfProtection, async (req: AuthedRequest, res) => {
    const toEmail = String(req.body?.toEmail ?? '').trim();
    if (!toEmail || !toEmail.includes('@')) return res.status(400).json({ error: 'toEmail inválido' });

    const fromUid = req.user!.uid;
    const fromEmail = req.user!.email ?? null;

    if (fromEmail && fromEmail.toLowerCase() === toEmail.toLowerCase()) {
      return res.status(400).json({ error: 'Você não pode convidar a si mesmo.' });
    }

    const now = new Date().toISOString();

    // Evita duplicar convites pendentes
    const existing = await invitesCol
      .where('fromUid', '==', fromUid)
      .where('toEmailLower', '==', toEmail.toLowerCase())
      .where('status', '==', 'pending')
      .limit(1)
      .get();

    if (!existing.empty) {
      return res.json({ ok: true, inviteId: existing.docs[0].id, reused: true });
    }

    const payload: ShareInvite = {
      fromUid,
      fromEmail,
      toEmailLower: toEmail.toLowerCase(),
      toEmail,
      toUid: null,
      status: 'pending',
      createdAt: now,
      acceptedAt: null,
      declinedAt: null,
    };

    const doc = await invitesCol.add(payload);

    await auditFirestore(opts.fbDb, opts.logger, {
      action: 'share_invite_create',
      uid: fromUid,
      email: fromEmail,
      ip: getIp(req),
      userAgent: (req as any).headers['user-agent'],
      details: { inviteId: doc.id, toEmail }
    });

    return res.json({ ok: true, inviteId: doc.id });
  });

  // Listar convites (enviados + recebidos)
  r.get('/invites', auth, async (req: AuthedRequest, res) => {
    const uid = req.user!.uid;
    const email = (req.user!.email ?? '').toLowerCase();

    const [sentSnap, receivedSnap] = await Promise.all([
      invitesCol.where('fromUid', '==', uid).get(),
      email ? invitesCol.where('toEmailLower', '==', email).get() : Promise.resolve({ docs: [], empty: true } as any)
    ]);

    const sent = sentSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
    const received = receivedSnap.docs
      .map(d => ({ id: d.id, ...(d.data() as any) }))
      .filter((x: any) => x.status === 'pending');

    return res.json({ sent, received });
  });

  // Aceitar convite (intenção do convidado)
  r.post('/invites/:id/accept', auth, opts.csrfProtection, async (req: AuthedRequest, res) => {
    const id = req.params.id;
    const uid = req.user!.uid;
    const email = (req.user!.email ?? '').toLowerCase();
    if (!email) return res.status(400).json({ error: 'Sua conta não possui e-mail.' });

    const ref = invitesCol.doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Convite não encontrado' });

    const data = snap.data() as ShareInvite;

    if (data.status !== 'pending') return res.status(400).json({ error: 'Convite não está pendente' });
    if (data.toEmailLower !== email) return res.status(403).json({ error: 'Este convite não é para você' });

    const now = new Date().toISOString();

    await ref.set({
      status: 'accepted',
      toUid: uid,
      toEmail: req.user!.email ?? null,
      acceptedAt: now,
    }, { merge: true });

    await auditFirestore(opts.fbDb, opts.logger, {
      action: 'share_invite_accept',
      uid,
      email: req.user!.email,
      ip: getIp(req),
      userAgent: (req as any).headers['user-agent'],
      details: { inviteId: id, fromUid: data.fromUid }
    });

    return res.json({ ok: true });
  });

  // Rejeitar convite
  r.post('/invites/:id/decline', auth, opts.csrfProtection, async (req: AuthedRequest, res) => {
    const id = req.params.id;
    const uid = req.user!.uid;
    const email = (req.user!.email ?? '').toLowerCase();
    if (!email) return res.status(400).json({ error: 'Sua conta não possui e-mail.' });

    const ref = invitesCol.doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Convite não encontrado' });

    const data = snap.data() as ShareInvite;

    if (data.status !== 'pending') return res.status(400).json({ error: 'Convite não está pendente' });
    if (data.toEmailLower !== email) return res.status(403).json({ error: 'Este convite não é para você' });

    const now = new Date().toISOString();

    await ref.set({
      status: 'declined',
      toUid: uid,
      toEmail: req.user!.email ?? null,
      declinedAt: now,
    }, { merge: true });

    await auditFirestore(opts.fbDb, opts.logger, {
      action: 'share_invite_decline',
      uid,
      email: req.user!.email,
      ip: getIp(req),
      userAgent: (req as any).headers['user-agent'],
      details: { inviteId: id, fromUid: data.fromUid }
    });

    return res.json({ ok: true });
  });

  // Conexões aceitas (para usar no "compartilhar")
  r.get('/connections', auth, async (req: AuthedRequest, res) => {
    const uid = req.user!.uid;

    const [asOwner, asGuest] = await Promise.all([
      invitesCol.where('fromUid', '==', uid).where('status', '==', 'accepted').get(),
      invitesCol.where('toUid', '==', uid).where('status', '==', 'accepted').get(),
    ]);

    const connections: { uid: string; email?: string | null; inviteId: string }[] = [];

    asOwner.docs.forEach(d => {
      const x = d.data() as any;
      if (x.toUid) connections.push({ uid: x.toUid, email: x.toEmail ?? null, inviteId: d.id });
    });

    asGuest.docs.forEach(d => {
      const x = d.data() as any;
      if (x.fromUid) connections.push({ uid: x.fromUid, email: x.fromEmail ?? null, inviteId: d.id });
    });

    // remove duplicados
    const uniq = new Map<string, { uid: string; email?: string | null; inviteId: string }>();
    connections.forEach(c => uniq.set(c.uid, c));

    return res.json({ connections: Array.from(uniq.values()) });
  });

  return r;
}
