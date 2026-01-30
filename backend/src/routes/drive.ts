import { Router } from 'express';
import type { RequestHandler } from 'express';
import type winston from 'winston';
import type { Auth } from 'firebase-admin/auth';
import type admin from 'firebase-admin';
import { google } from 'googleapis';
import multer from 'multer';
import { requireSession, type AuthedRequest } from '../middleware/requireSession';
import { auditFirestore } from '../utils/audit';

type DriveRouterOpts = {
  logger: winston.Logger;
  csrfProtection: RequestHandler;
  fbAuth: Auth;
  fbDb: admin.firestore.Firestore;
  driveServiceAccountJson?: string;
  driveApiKey?: string;
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const IDENT_PREFIX = 'VAULT__';

function getIp(req: any) {
  return (req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim())
    || req.socket?.remoteAddress
    || req.ip;
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

function getDriveClient(serviceAccountJson: string) {
  const sa = JSON.parse(serviceAccountJson);
  const jwt = new google.auth.JWT({
    email: sa.client_email,
    key: sa.private_key,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  return google.drive({ version: 'v3', auth: jwt });
}

async function listPublicFolderFiles(opts: { apiKey: string; folderId: string; uid: string }) {
  const prefix = `${IDENT_PREFIX}${opts.uid}__`;
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
    const err: any = new Error(`Falha ao listar pasta pública do Drive (${resp.status}). ${text}`);
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

  // Drive via Service Account (necessário para upload/delete via API)
  function ensureServiceDrive() {
    if (!opts.driveServiceAccountJson) {
      const err: any = new Error('Upload/Delete no Drive via API exigem Service Account (ou OAuth). Para o modo "link público", use apenas listagem/abrir pasta.');
      err.status = 501;
      throw err;
    }
    return getDriveClient(opts.driveServiceAccountJson);
  }

  async function getUserFolderId(uid: string): Promise<string | null> {
    const snap = await settingsCol.doc(uid).get();
    const data = (snap.exists ? snap.data() : null) as any;
    return data?.driveFolderId ?? null;
  }

  // Retorna config atual
  r.get('/settings', auth, async (req: AuthedRequest, res) => {
    const uid = req.user!.uid;
    const folderId = await getUserFolderId(uid);
    const enabled = Boolean(opts.driveServiceAccountJson) || Boolean(opts.driveApiKey);
    const mode = opts.driveServiceAccountJson ? 'service_account' : (opts.driveApiKey ? 'public_link' : 'disabled');
    const uploadEnabled = Boolean(opts.driveServiceAccountJson);
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
      details: { folderId }
    });

    return res.json({ ok: true, folderId });
  });

  // Listar arquivos "ativos" (se existir no Drive, aparece; se foi removido, some)
  r.get('/files', auth, async (req: AuthedRequest, res) => {
    try {
      const uid = req.user!.uid;
      const folderId = await getUserFolderId(uid);
      if (!folderId) return res.json({ files: [], needsSetup: true });

      // 1) Service Account (mais completo)
      if (opts.driveServiceAccountJson) {
        const drive = getDriveClient(opts.driveServiceAccountJson);

        const qByProps = `'${folderId}' in parents and trashed=false and appProperties has { key='vaultOwnerUid' and value='${uid}' }`;
        let files: any[] = [];

        try {
          const out = await drive.files.list({
            q: qByProps,
            fields: 'files(id,name,webViewLink,webContentLink,mimeType,size,modifiedTime)',
            orderBy: 'modifiedTime desc',
            pageSize: 100,
            supportsAllDrives: true,
            includeItemsFromAllDrives: true,
          });
          files = out.data.files ?? [];
        } catch {
          // Fallback: por nome
          const prefix = `${IDENT_PREFIX}${uid}__`;
          const qByName = `'${folderId}' in parents and trashed=false and name contains '${prefix}'`;
          const out = await drive.files.list({
            q: qByName,
            fields: 'files(id,name,webViewLink,webContentLink,mimeType,size,modifiedTime)',
            orderBy: 'modifiedTime desc',
            pageSize: 100,
            supportsAllDrives: true,
            includeItemsFromAllDrives: true,
          });
          files = out.data.files ?? [];
        }

        return res.json({ files, needsSetup: false });
      }

      // 2) Modo link público (API key) — somente listagem
      if (opts.driveApiKey) {
        const files = await listPublicFolderFiles({ apiKey: opts.driveApiKey, folderId, uid });
        return res.json({ files, needsSetup: false });
      }

      return res.status(501).json({ error: 'Drive não configurado no servidor (falta GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON ou GOOGLE_DRIVE_API_KEY).' });

    } catch (e: any) {
      const status = e?.status ?? 500;
      return res.status(status).json({ error: e?.message ?? 'Erro Drive' });
    }
  });

  // Upload
  r.post('/upload', auth, opts.csrfProtection, upload.single('file'), async (req: AuthedRequest, res) => {
    try {
      const drive = ensureServiceDrive();
      const uid = req.user!.uid;
      const folderId = await getUserFolderId(uid);
      if (!folderId) return res.status(400).json({ error: 'Configure uma pasta do Google Drive primeiro.' });

      const f = (req as any).file as Express.Multer.File | undefined;
      if (!f) return res.status(400).json({ error: 'Arquivo ausente (field: file)' });

      const safeName = (f.originalname || 'arquivo').replace(/[^a-zA-Z0-9._-]/g, '_');
      const stamp = Date.now();
      const name = `${IDENT_PREFIX}${uid}__${stamp}__${safeName}`;

      const out = await drive.files.create({
        requestBody: {
          name,
          parents: [folderId],
          appProperties: {
            vaultOwnerUid: uid,
            vaultUploadedAt: String(stamp),
          },
        },
        media: {
          mimeType: f.mimetype || 'application/octet-stream',
          body: Buffer.from(f.buffer),
        },
        fields: 'id,name,webViewLink,webContentLink,mimeType,size,modifiedTime',
        supportsAllDrives: true,
      });

      await auditFirestore(opts.fbDb, opts.logger, {
        action: 'drive_upload',
        uid,
        email: req.user?.email,
        ip: getIp(req),
        userAgent: (req as any).headers['user-agent'],
        details: { fileId: out.data.id, name: out.data.name, size: f.size }
      });

      return res.json({ ok: true, file: out.data });
    } catch (e: any) {
      const status = e?.status ?? 500;
      return res.status(status).json({ error: e?.message ?? 'Erro no upload' });
    }
  });

  // Delete (opcional)
  r.delete('/files/:id', auth, opts.csrfProtection, async (req: AuthedRequest, res) => {
    try {
      const drive = ensureServiceDrive();
      const uid = req.user!.uid;
      const id = req.params.id;

      // Garante que o arquivo pertence ao usuário (best effort)
      const meta = await drive.files.get({ fileId: id, fields: 'id,name,appProperties', supportsAllDrives: true });
      const owner = (meta.data as any)?.appProperties?.vaultOwnerUid;
      if (owner && owner !== uid) return res.status(403).json({ error: 'Forbidden' });

      await drive.files.delete({ fileId: id, supportsAllDrives: true });

      await auditFirestore(opts.fbDb, opts.logger, {
        action: 'drive_delete',
        uid,
        email: req.user?.email,
        ip: getIp(req),
        userAgent: (req as any).headers['user-agent'],
        details: { fileId: id }
      });

      return res.json({ ok: true });
    } catch (e: any) {
      const status = e?.status ?? 500;
      return res.status(status).json({ error: e?.message ?? 'Erro ao deletar' });
    }
  });

  return r;
}
