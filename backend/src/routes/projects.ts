import { Router } from 'express';
import type { RequestHandler } from 'express';
import type winston from 'winston';
import type { Auth } from 'firebase-admin/auth';
import type admin from 'firebase-admin';
import { requireSession, type AuthedRequest } from '../middleware/requireSession';
import { auditFirestore } from '../utils/audit';

type ProjectsRouterOpts = {
  logger: winston.Logger;
  csrfProtection: RequestHandler;
  fbAuth: Auth;
  fbDb: admin.firestore.Firestore;
};

type KanbanColumn = { id: string; title: string; wipLimit?: number | null };
type KanbanCard = {
  id: string;
  columnId: string;
  title: string;
  description?: string | null;
  estimateHours?: number | null;
  type?: 'sap' | 'general' | 'note' | null;
  // New fields (optional)
  order?: number | null;
  priority?: 'low' | 'med' | 'high' | 'urgent' | null;
  dueDate?: string | null; // ISO date string (YYYY-MM-DD)
  checklist?: Array<{ id: string; text: string; done: boolean }> | null;
  color?: 'yellow' | 'blue' | 'green' | 'pink' | 'white' | null;
  tags?: string[] | null;
  comments?: Array<{ at: string; author?: string | null; text: string }> | null;
  emails?: Array<{ at: string; subject?: string | null; body: string }> | null;
  qaNotes?: string | null;
  prodNotes?: string | null;
  approvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

type ProjectDoc = {
  ownerUid: string;
  ownerEmail?: string | null;
  sharedWith?: string[];
  projectType?: 'sap' | 'general';
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  board?: {
    columns: KanbanColumn[];
    cards: KanbanCard[];
  };
  driveFolderOverrideId?: string | null;
  hourlyRate?: number | null;
};

function canAccessProject(doc: any, uid: string) {
  if (!doc) return false;
  if (doc.ownerUid === uid) return true;
  const shared = Array.isArray(doc.sharedWith) ? doc.sharedWith : [];
  return shared.includes(uid);
}

function isOwner(doc: any, uid: string) {
  return Boolean(doc && doc.ownerUid === uid);
}

function getIp(req: any) {
  return (
    req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    req.ip
  );
}

function defaultBoard(nowIso: string, projectType: 'sap' | 'general') {
  const columns: KanbanColumn[] = projectType === 'sap'
    ? [
        { id: 'backlog', title: 'Backlog' },
        { id: 'analysis', title: 'Análise' },
        { id: 'dev', title: 'Dev' },
        { id: 'qa', title: 'QA' },
        { id: 'ready_prod', title: 'Pronto p/ Produção' },
        { id: 'in_prod', title: 'Em Produção' },
        { id: 'done_prod', title: 'Finalizado em Produção' },
        { id: 'approved', title: 'Demandas Aprovadas' },
      ]
    : [
        { id: 'backlog', title: 'Backlog' },
        { id: 'todo', title: 'To Do' },
        { id: 'doing', title: 'Doing' },
        { id: 'review', title: 'Review/QA' },
        { id: 'done', title: 'Done' },
        { id: 'approved', title: 'Approved' },
      ];
  const cards: KanbanCard[] = [
    {
      id: 'welcome',
      columnId: 'backlog',
      title: '✅ Comece criando suas tarefas aqui',
      description:
        projectType === 'sap'
          ? 'Crie cards para demandas SAP, dúvidas, transportes, QA/Produção e aprovações. Use as colunas como no fluxo real.'
          : 'Crie cards para dúvidas, backlog, pendências e entregas. Movimente entre colunas conforme evolui.',
      type: projectType,
      // @ts-ignore - optional field for ordering
      order: 100,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];
  return { columns, cards };
}

async function resolveEmailsToUids(fbAuth: Auth, emails: string[]) {
  const out: { uids: string[]; unresolved: string[] } = { uids: [], unresolved: [] };
  for (const raw of emails) {
    const email = String(raw ?? '').trim().toLowerCase();
    if (!email || !email.includes('@')) continue;
    try {
      const u = await fbAuth.getUserByEmail(email);
      if (u?.uid) out.uids.push(u.uid);
    } catch {
      out.unresolved.push(email);
    }
  }
  out.uids = Array.from(new Set(out.uids));
  out.unresolved = Array.from(new Set(out.unresolved));
  return out;
}

export function projectsRouter(opts: ProjectsRouterOpts) {
  const r = Router();
  const auth = requireSession(opts.fbAuth as any);
  const col = opts.fbDb.collection('projects');

  // List projects
  r.get('/', auth, async (req: AuthedRequest, res) => {
    const uid = req.user!.uid;
    const [ownedSnap, sharedSnap] = await Promise.all([
      col.where('ownerUid', '==', uid).get(),
      col.where('sharedWith', 'array-contains', uid).get().catch(() => ({ docs: [] } as any)),
    ]);

    const byId = new Map<string, any>();
    for (const d of ownedSnap.docs) byId.set(d.id, { id: d.id, ...(d.data() as any) });
    for (const d of (sharedSnap as any).docs ?? []) {
      if (!byId.has(d.id)) byId.set(d.id, { id: d.id, ...(d.data() as any) });
    }

    const projects = Array.from(byId.values())
      .map((p: any) => {
        const isOwner = String(p.ownerUid) === uid;
        return {
          ...p,
          isOwner,
          canEdit: isOwner || (Array.isArray(p.sharedWith) && p.sharedWith.includes(uid)),
        };
      })
      .sort((a: any, b: any) => String(b.updatedAt).localeCompare(String(a.updatedAt)));

    return res.json({ projects });
  });

  // Create project
  r.post('/', auth, opts.csrfProtection, async (req: AuthedRequest, res) => {
    const uid = req.user!.uid;
    const now = new Date().toISOString();
    const name = String(req.body?.name ?? '').trim();
    const description = String(req.body?.description ?? '').trim();
    const projectType = (String(req.body?.projectType ?? 'sap').toLowerCase() === 'general' ? 'general' : 'sap') as 'sap' | 'general';
    if (!name) return res.status(400).json({ error: 'name is required' });

    const payload: ProjectDoc = {
      ownerUid: uid,
      ownerEmail: req.user?.email ?? null,
      sharedWith: [],
      projectType,
      name,
      description: description || null,
      createdAt: now,
      updatedAt: now,
      board: defaultBoard(now, projectType),
      driveFolderOverrideId: null,
      hourlyRate:
        req.body?.hourlyRate !== undefined && req.body?.hourlyRate !== null && !Number.isNaN(Number(req.body.hourlyRate))
          ? Math.min(Math.max(Number(req.body.hourlyRate), 0), 1000000)
          : null,
    };

    const doc = await col.add(payload);

    await auditFirestore(opts.fbDb, opts.logger, {
      action: 'project_create',
      uid,
      email: req.user?.email,
      ip: getIp(req),
      userAgent: (req as any).headers['user-agent'],
      details: { id: doc.id, name },
    });

    return res.json({ ok: true, id: doc.id });
  });

  // Update project (name/description)
  r.put('/:id', auth, opts.csrfProtection, async (req: AuthedRequest, res) => {
    const uid = req.user!.uid;
    const id = req.params.id;
    const ref = col.doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Not found' });
    const data = snap.data() as any;
    if ((data?.ownerUid ?? null) !== uid) return res.status(403).json({ error: 'Forbidden' });

    const patch: any = { updatedAt: new Date().toISOString() };
    if (req.body?.name !== undefined) patch.name = String(req.body.name ?? '').trim();
    if (req.body?.description !== undefined) patch.description = String(req.body.description ?? '').trim() || null;
    if (req.body?.driveFolderOverrideId !== undefined) {
      patch.driveFolderOverrideId = String(req.body.driveFolderOverrideId ?? '').trim() || null;
    }
    if (req.body?.hourlyRate !== undefined) {
      patch.hourlyRate =
        req.body.hourlyRate !== null && req.body.hourlyRate !== undefined && !Number.isNaN(Number(req.body.hourlyRate))
          ? Math.min(Math.max(Number(req.body.hourlyRate), 0), 1000000)
          : null;
    }

    await ref.set(patch, { merge: true });

    await auditFirestore(opts.fbDb, opts.logger, {
      action: 'project_update',
      uid,
      email: req.user?.email,
      ip: getIp(req),
      userAgent: (req as any).headers['user-agent'],
      details: { id },
    });

    return res.json({ ok: true });
  });

  // Share project with other users (owner only)
  r.put('/:id/share', auth, opts.csrfProtection, async (req: AuthedRequest, res) => {
    const uid = req.user!.uid;
    const id = req.params.id;
    const ref = col.doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Not found' });
    const data = snap.data() as any;
    if ((data?.ownerUid ?? null) !== uid) return res.status(403).json({ error: 'Forbidden' });

    const uids = Array.isArray(req.body?.uids) ? req.body.uids.filter((x: any) => typeof x === 'string') : [];
    const emails = Array.isArray(req.body?.emails) ? req.body.emails.filter((x: any) => typeof x === 'string') : [];

    const resolved = await resolveEmailsToUids(opts.fbAuth, emails);
    const merged = Array.from(new Set([...uids, ...resolved.uids].filter((x) => x && x !== uid))).slice(0, 50);

    await ref.set({ sharedWith: merged, updatedAt: new Date().toISOString() }, { merge: true });

    await auditFirestore(opts.fbDb, opts.logger, {
      action: 'project_share_update',
      uid,
      email: req.user?.email,
      ip: getIp(req),
      userAgent: (req as any).headers['user-agent'],
      details: { id, sharedWith: merged.length, unresolvedEmails: resolved.unresolved },
    });

    return res.json({ ok: true, sharedWith: merged, unresolvedEmails: resolved.unresolved });
  });

  // Delete project
  r.delete('/:id', auth, opts.csrfProtection, async (req: AuthedRequest, res) => {
    const uid = req.user!.uid;
    const id = req.params.id;
    const ref = col.doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Not found' });
    const data = snap.data() as any;
    if ((data?.ownerUid ?? null) !== uid) return res.status(403).json({ error: 'Forbidden' });

    await ref.delete();

    await auditFirestore(opts.fbDb, opts.logger, {
      action: 'project_delete',
      uid,
      email: req.user?.email,
      ip: getIp(req),
      userAgent: (req as any).headers['user-agent'],
      details: { id },
    });

    return res.json({ ok: true });
  });

  // Get project board
  r.get('/:id/board', auth, async (req: AuthedRequest, res) => {
    const uid = req.user!.uid;
    const id = req.params.id;
    const ref = col.doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Not found' });
    const data = snap.data() as any;
    const isOwner = (data?.ownerUid ?? null) === uid;
    const canEdit = isOwner || (Array.isArray(data?.sharedWith) && data.sharedWith.includes(uid));
    if (!canEdit) return res.status(403).json({ error: 'Forbidden' });

    const projectType = (data?.projectType === 'general' ? 'general' : 'sap') as 'sap' | 'general';
    const board = data?.board ?? defaultBoard(new Date().toISOString(), projectType);
    return res.json({ board, meta: { isOwner, canEdit, ownerEmail: data?.ownerEmail ?? null } });
  });

  // Save project board
  r.put('/:id/board', auth, opts.csrfProtection, async (req: AuthedRequest, res) => {
    const uid = req.user!.uid;
    const id = req.params.id;
    const ref = col.doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Not found' });
    const data = snap.data() as any;
    const isOwner = (data?.ownerUid ?? null) === uid;
    const canEdit = isOwner || (Array.isArray(data?.sharedWith) && data.sharedWith.includes(uid));
    if (!canEdit) return res.status(403).json({ error: 'Forbidden' });

    const incoming = req.body?.board;
    if (!incoming || typeof incoming !== 'object') return res.status(400).json({ error: 'board is required' });
    const columns = Array.isArray(incoming.columns) ? incoming.columns : [];
    const cards = Array.isArray(incoming.cards) ? incoming.cards : [];

    // Minimal validation / normalization
    const normColumns: KanbanColumn[] = columns
      .filter((c: any) => c && typeof c.id === 'string' && typeof c.title === 'string')
      .map((c: any) => ({
        id: c.id.slice(0, 64),
        title: c.title.slice(0, 64),
        wipLimit:
          c.wipLimit !== undefined && c.wipLimit !== null && !Number.isNaN(Number(c.wipLimit))
            ? Math.min(Math.max(Number(c.wipLimit), 0), 999)
            : null,
      }));

    const now = new Date().toISOString();
    const normCards: KanbanCard[] = cards
      .filter((c: any) => c && typeof c.id === 'string' && typeof c.columnId === 'string' && typeof c.title === 'string')
      .map((c: any) => ({
        id: c.id.slice(0, 64),
        columnId: c.columnId.slice(0, 64),
        title: c.title.slice(0, 120),
        order:
          c.order !== undefined && c.order !== null && !Number.isNaN(Number(c.order))
            ? Math.min(Math.max(Number(c.order), -1000000), 1000000)
            : null,
        priority:
          (c.priority === 'low' || c.priority === 'med' || c.priority === 'high' || c.priority === 'urgent') ? c.priority : null,
        dueDate: typeof c.dueDate === 'string' ? c.dueDate.slice(0, 32) : null,
        checklist: Array.isArray(c.checklist)
          ? c.checklist
              .filter((x: any) => x && typeof x.text === 'string')
              .map((x: any) => ({
                id: typeof x.id === 'string' ? x.id.slice(0, 64) : `i_${Math.random().toString(36).slice(2, 10)}`,
                text: String(x.text).slice(0, 240),
                done: Boolean(x.done),
              }))
              .slice(0, 50)
          : null,
        color:
          (c.color === 'yellow' || c.color === 'blue' || c.color === 'green' || c.color === 'pink' || c.color === 'white') ? c.color : null,
        description: c.description ? String(c.description).slice(0, 2000) : null,
        estimateHours:
          c.estimateHours !== undefined && c.estimateHours !== null && !Number.isNaN(Number(c.estimateHours))
            ? Math.min(Math.max(Number(c.estimateHours), 0), 100000)
            : null,
        type: (c.type === 'general' || c.type === 'sap' || c.type === 'note') ? c.type : null,
        tags: Array.isArray(c.tags) ? c.tags.filter((t: any) => typeof t === 'string').map((t: string) => t.slice(0, 32)).slice(0, 12) : null,
        comments: Array.isArray(c.comments)
          ? c.comments
              .filter((x: any) => x && typeof x.text === 'string')
              .map((x: any) => ({ at: typeof x.at === 'string' ? x.at : now, author: x.author ? String(x.author).slice(0, 120) : null, text: String(x.text).slice(0, 2000) }))
              .slice(0, 50)
          : null,
        emails: Array.isArray(c.emails)
          ? c.emails
              .filter((x: any) => x && typeof x.body === 'string')
              .map((x: any) => ({ at: typeof x.at === 'string' ? x.at : now, subject: x.subject ? String(x.subject).slice(0, 160) : null, body: String(x.body).slice(0, 15000) }))
              .slice(0, 25)
          : null,
        qaNotes: c.qaNotes ? String(c.qaNotes).slice(0, 4000) : null,
        prodNotes: c.prodNotes ? String(c.prodNotes).slice(0, 4000) : null,
        approvedAt: typeof c.approvedAt === 'string' ? c.approvedAt : null,
        createdAt: typeof c.createdAt === 'string' ? c.createdAt : now,
        updatedAt: now,
      }));

    await ref.set({ board: { columns: normColumns, cards: normCards }, updatedAt: now }, { merge: true });

    await auditFirestore(opts.fbDb, opts.logger, {
      action: 'project_board_update',
      uid,
      email: req.user?.email,
      ip: getIp(req),
      userAgent: (req as any).headers['user-agent'],
      details: { id, columns: normColumns.length, cards: normCards.length, isOwner },
    });

    return res.json({ ok: true });
  });

  return r;
}
