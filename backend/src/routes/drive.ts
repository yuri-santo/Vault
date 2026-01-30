import { Router } from 'express';
import type { RequestHandler } from 'express';
import type winston from 'winston';
import type { Auth } from 'firebase-admin/auth';
import type admin from 'firebase-admin';
import { requireSession, type AuthedRequest } from '../middleware/requireSession';
import { auditFirestore } from '../utils/audit';

/**
 * Integração Drive (EMERGENCIAL) — Modo "Link público" (Qualquer um com o link).
 *
 * IMPORTANTE:
 * - Este modo suporta APENAS listagem dos arquivos existentes na pasta.
 * - Upload/remoção via API exigem OAuth ou Service Account.
 *
 * Como funciona aqui:
 * - Usuário salva o link/ID da pasta (driveFolderId em userSettings/{uid}).
 * - Backend lista arquivos usando Drive API v3 com API key, filtrando por prefixo no nome.
 */

type DriveRouterOpts = {
  logger: winston.Logger;
  csrfProtection: RequestHandler;
  fbAuth: Auth;
  fbDb: admin.firestore.Firestore;
  driveApiKey?: string;
};

const IDENT_PREFIX = 'VAULT__';

function getIp(req: any) {
  return (
    req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    req.ip
  );
}

function parseFolderId(input: string): string | null {
  const s = input.trim();
  if (!s) return null;

  // Aceita folderId puro
  if (/^[a-zA-Z0-9_-]{10,}$/.test(s) && !s.includes('http')) return s;

  // URLs comuns do Drive
  // https://drive.google.com/drive/folders/<ID>
  // https://drive.google.com/open?id=<ID>
  const m1 = s.match(/\/folders\/([a-zA-Z0-9_-]{10,})/);
  if (m1) return m1[1];

  const m2 = s.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
  if (m2) return m2[1];

  return null;
}

async function listPublicFolderFiles(opts: { apiKey: string; folderId: string; uid: string }) {
  const prefix = `${IDENT_PREFIX}${opts.uid}__`;

  // Observação:
  // - Para pasta pública ("anyone with link"), a listagem com API key funciona.
  // - O filtro por "name contains" reduz resultados para os seus arquivos.
  const q = `'${opts.folderId}' in parents and trashed=false and name contains '${prefix}'`;

  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.set('key', opts.apiKey);
  url.searchParams.set('q', q);
  url.searchParams.set('fields', 'files(id,name,webViewLink,webContentLink,mimeType,size,modifiedTime)');
  url.searchParams.set('orderBy', 'modifiedTime desc');
  url.searchParams.set('pageSize', '100');

  const resp = await fetch(url.toString());
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    const err: any = new Error(`Falha ao listar pasta do Drive (${resp.status}). ${text}`);
    err.status = resp.status;
    throw err;
  }

  const data: any = await resp.json();
  return (data?.files ?? []) as any[];
}

export function driveRouter(opts: DriveRouterOpts) {
  const r = Router();
  const auth = requireSession(opts.fbAuth as any);

  const settingsCol = opts.fbDb.collection('userSettings');

  async function getUserFolderId(uid: string): Promise<string | null> {
    const snap = await settingsCol.doc(uid).get();
    const data = (snap.exists ? snap.data() : null) as any;
    return data?.driveFolderId ?? null;
  }

  // Retorna config atual
  r.get('/settings', auth, async (req: AuthedRequest, res) => {
    const uid = req.user!.uid;
    const folderId = await getUserFolderId(uid);
    const enabled = Boolean(opts.driveApiKey);
    const mode = opts.driveApiKey ? 'public_link' : 'disabled';
    const uploadEnabled = false;
    const openUrl = folderId ? `https://drive.google.com/drive/folders/${folderId}` : null;
    return res.json({ folderId, enabled, mode, uploadEnabled, openUrl });
  });

  // Salvar pasta (link ou ID)
  r.post('/settings', auth, opts.csrfProtection, async (req: AuthedRequest, res) => {
    const uid = req.user!.uid;
    const raw = String(req.body?.folder ?? '').trim();
    const folderId = parseFolderId(raw);
    if (!folderId) return res.status(400).json({ error: 'Link/ID de pasta inválido' });

    await settingsCol.doc(uid).set({ driveFolderId: folderId, updatedAt: new Date().toISOString() }, { merge: true });

    await auditFirestore(opts.fbDb, opts.logger, {
      action: 'drive_settings_update',
      uid,
      email: req.user?.email,
      ip: getIp(req),
      userAgent: (req as any).headers['user-agent'],
      details: { folderId },
    });

    return res.json({ ok: true, folderId });
  });

  // Listar arquivos "ativos" (se existir no Drive, aparece; se foi removido, some)
  r.get('/files', auth, async (req: AuthedRequest, res) => {
    try {
      const uid = req.user!.uid;
      const folderId = await getUserFolderId(uid);
      if (!folderId) return res.json({ files: [], needsSetup: true });

      if (!opts.driveApiKey) {
        return res.status(501).json({
          error: 'Drive não configurado no servidor. Configure GOOGLE_DRIVE_API_KEY para usar o modo "link público".',
        });
      }

      const files = await listPublicFolderFiles({ apiKey: opts.driveApiKey, folderId, uid });
      return res.json({ files, needsSetup: false });

    } catch (e: any) {
      const status = e?.status ?? 500;
      return res.status(status).json({ error: e?.message ?? 'Erro Drive' });
    }
  });

  // Upload (não disponível no modo link público)
  r.post('/upload', auth, opts.csrfProtection, async (_req: AuthedRequest, res) => {
    return res.status(501).json({
      error: 'Upload no modo "link público" não é suportado. Use "Abrir pasta" e faça upload pelo Drive, ou habilite OAuth/Service Account.',
    });
  });

  return r;
}
