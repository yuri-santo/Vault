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

type KanbanColumn = { id: string; title: string };
type KanbanCard = {
  id: string;
  columnId: string;
  title: string;
  description?: string | null;
  estimateHours?: number | null;
  type?: 'sap' | 'general' | 'note' | null;
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
};

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
        { id: 'prod', title: 'Produção' },
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
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];
  return { columns, cards };
}

export function projectsRouter(opts: ProjectsRouterOpts) {
  const r = Router();
  const auth = requireSession(opts.fbAuth as any);
  const col = opts.fbDb.collection('projects');

  // List projects
  r.get('/', auth, async (req: AuthedRequest, res) => {
    const uid = req.user!.uid;
    const snap = await col.where('ownerUid', '==', uid).get();
    const projects = snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as any) }))
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
      projectType,
      name,
      description: description || null,
      createdAt: now,
      updatedAt: now,
      board: defaultBoard(now, projectType),
      driveFolderOverrideId: null,
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
    if ((data?.ownerUid ?? null) !== uid) return res.status(403).json({ error: 'Forbidden' });

    const projectType = (data?.projectType === 'general' ? 'general' : 'sap') as 'sap' | 'general';
    const board = data?.board ?? defaultBoard(new Date().toISOString(), projectType);
    return res.json({ board });
  });

  // Save project board
  r.put('/:id/board', auth, opts.csrfProtection, async (req: AuthedRequest, res) => {
    const uid = req.user!.uid;
    const id = req.params.id;
    const ref = col.doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: 'Not found' });
    const data = snap.data() as any;
    if ((data?.ownerUid ?? null) !== uid) return res.status(403).json({ error: 'Forbidden' });

    const incoming = req.body?.board;
    if (!incoming || typeof incoming !== 'object') return res.status(400).json({ error: 'board is required' });
    const columns = Array.isArray(incoming.columns) ? incoming.columns : [];
    const cards = Array.isArray(incoming.cards) ? incoming.cards : [];

    // Minimal validation / normalization
    const normColumns: KanbanColumn[] = columns
      .filter((c: any) => c && typeof c.id === 'string' && typeof c.title === 'string')
      .map((c: any) => ({ id: c.id.slice(0, 64), title: c.title.slice(0, 64) }));

    const now = new Date().toISOString();
    const normCards: KanbanCard[] = cards
      .filter((c: any) => c && typeof c.id === 'string' && typeof c.columnId === 'string' && typeof c.title === 'string')
      .map((c: any) => ({
        id: c.id.slice(0, 64),
        columnId: c.columnId.slice(0, 64),
        title: c.title.slice(0, 120),
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
      details: { id, columns: normColumns.length, cards: normCards.length },
    });

    return res.json({ ok: true });
  });

  return r;
}
