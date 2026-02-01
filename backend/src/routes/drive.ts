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

async function listFolderChildren(opts: { apiKey: string; parentId: string }) {
  const q = `'${opts.parentId}' in parents and trashed=false`;
  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.set('key', opts.apiKey);
  url.searchParams.set('q', q);
  url.searchParams.set('fields', 'files(id,name,webViewLink,webContentLink,mimeType,size,modifiedTime,iconLink)');
  url.searchParams.set('orderBy', 'folder,name');
  url.searchParams.set('pageSize', '200');

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

  async function getHiddenIds(uid: string): Promise<Set<string>> {
    const snap = await settingsCol.doc(uid).get();
    const data = (snap.exists ? snap.data() : null) as any;
    const arr = Array.isArray(data?.driveHiddenFileIds) ? data.driveHiddenFileIds : [];
    return new Set(arr.filter((x: any) => typeof x === 'string'));
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

      const hidden = await getHiddenIds(uid);
      const files = (await listPublicFolderFiles({ apiKey: opts.driveApiKey, folderId, uid }))
        .filter((f) => !hidden.has(String(f.id)));
      return res.json({ files, needsSetup: false });

    } catch (e: any) {
      const status = e?.status ?? 500;
      return res.status(status).json({ error: e?.message ?? 'Erro Drive' });
    }
  });

  // Navegação estilo "explorer" (pastas/arquivos) dentro da pasta configurada
  // - parentId opcional: se não vier, usa a pasta raiz do usuário
  r.get('/browse', auth, async (req: AuthedRequest, res) => {
    try {
      const uid = req.user!.uid;
      const rootFolderId = await getUserFolderId(uid);
      if (!rootFolderId) return res.json({ items: [], needsSetup: true, parentId: null, rootFolderId: null });

      if (!opts.driveApiKey) {
        return res.status(501).json({
          error: 'Drive não configurado no servidor. Configure GOOGLE_DRIVE_API_KEY para usar o modo "link público".',
        });
      }

      const parentId = String(req.query.parentId ?? '').trim() || rootFolderId;
      const items = await listFolderChildren({ apiKey: opts.driveApiKey, parentId });
      return res.json({ items, needsSetup: false, parentId, rootFolderId });
    } catch (e: any) {
      const status = e?.status ?? 500;
      return res.status(status).json({ error: e?.message ?? 'Erro Drive' });
    }
  });

  // Remover (ocultar) arquivo do painel do Vault (soft delete)
  r.delete('/files/:id', auth, opts.csrfProtection, async (req: AuthedRequest, res) => {
    const uid = req.user!.uid;
    const fileId = String(req.params.id ?? '').trim();
    if (!fileId) return res.status(400).json({ error: 'fileId inválido' });

    const hidden = await getHiddenIds(uid);
    hidden.add(fileId);
    await settingsCol.doc(uid).set({ driveHiddenFileIds: Array.from(hidden), updatedAt: new Date().toISOString() }, { merge: true });

    await auditFirestore(opts.fbDb, opts.logger, {
      action: 'drive_file_hide',
      uid,
      email: req.user?.email,
      ip: getIp(req),
      userAgent: (req as any).headers['user-agent'],
      details: { fileId },
    });

    return res.json({ ok: true });
  });

  // Upload (não disponível no modo link público)
  r.post('/upload', auth, opts.csrfProtection, async (req: AuthedRequest, res) => {
    // JSON upload mode (base64) to avoid multipart parsing deps.
    // Requires a valid OAuth access token on the server (GOOGLE_DRIVE_UPLOAD_TOKEN).
    try {
      const uid = req.user!.uid;
      const folderId = await getUserFolderId(uid);
      if (!folderId) {
        return res.status(400).json({ error: { code: 'DRIVE_FOLDER_NOT_SET', message: 'Pasta do Drive não configurada. Salve um link/ID de pasta primeiro.' } });
      }

      const uploadToken = process.env.GOOGLE_DRIVE_UPLOAD_TOKEN;
      if (!uploadToken) {
        return res.status(501).json({
          error: {
            code: 'DRIVE_UPLOAD_NOT_CONFIGURED',
            message: 'Upload não está habilitado no servidor.',
            hint: 'Defina GOOGLE_DRIVE_UPLOAD_TOKEN (OAuth access token com escopo drive.file) ou faça upload manual pela pasta do Drive.'
          }
        });
      }

      const fileName = String(req.body?.fileName ?? '').trim() || `upload_${Date.now()}`;
      const mimeType = String(req.body?.mimeType ?? 'application/octet-stream');
      const b64 = String(req.body?.dataBase64 ?? '').trim();
      if (!b64) return res.status(400).json({ error: { code: 'DRIVE_UPLOAD_NO_DATA', message: 'dataBase64 é obrigatório' } });

      const buf = Buffer.from(b64, 'base64');
      if (buf.length > 10 * 1024 * 1024) {
        return res.status(413).json({ error: { code: 'DRIVE_UPLOAD_TOO_LARGE', message: 'Arquivo maior que 10MB não é suportado neste modo.' } });
      }

      const prefix = `${IDENT_PREFIX}${uid}__${Date.now()}__`;
      const safeName = fileName.replace(/[^a-zA-Z0-9._\- ]/g, '_').slice(0, 120);

      const boundary = 'vaultBoundary' + Math.random().toString(16).slice(2);
      const meta = {
        name: prefix + safeName,
        parents: [folderId],
      };
      const part1 = Buffer.from(
        `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n`,
        'utf8'
      );
      const part2Head = Buffer.from(
        `--${boundary}\r\nContent-Type: ${mimeType}\r\nContent-Transfer-Encoding: binary\r\n\r\n`,
        'utf8'
      );
      const end = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8');
      const body = Buffer.concat([part1, part2Head, buf, end]);

      const url = new URL('https://www.googleapis.com/upload/drive/v3/files');
      url.searchParams.set('uploadType', 'multipart');
      url.searchParams.set('fields', 'id,name,webViewLink,webContentLink,mimeType,size,modifiedTime');

      const resp = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${uploadToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body,
      });

      const text = await resp.text().catch(() => '');
      if (!resp.ok) {
        return res.status(resp.status).json({
          error: {
            code: 'DRIVE_UPLOAD_FAILED',
            message: `Falha ao enviar arquivo para o Drive (${resp.status}).`,
            detail: text.slice(0, 2000),
            hint: 'Verifique se o token OAuth é válido e tem permissão na pasta.'
          }
        });
      }
      const data: any = text ? JSON.parse(text) : {};
      return res.json({ ok: true, file: data });
    } catch (e: any) {
      return res.status(500).json({ error: { code: 'DRIVE_UPLOAD_EXCEPTION', message: e?.message ?? 'Erro no upload' } });
    }
  });

  return r;
}
