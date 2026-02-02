import { Router } from 'express';
import type { RequestHandler } from 'express';
import type { Logger } from 'winston';

type ClientLogEntry = {
  at: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  kind?: string;
  message?: string;
  stack?: string;
  url?: string;
  userAgent?: string;
  payload?: unknown;
  user?: { uid?: string; email?: string | null };
  ip?: string;
};

const MAX_LOGS = 500;
const clientLogs: ClientLogEntry[] = [];

function pushLog(entry: ClientLogEntry) {
  clientLogs.push(entry);
  if (clientLogs.length > MAX_LOGS) {
    clientLogs.splice(0, clientLogs.length - MAX_LOGS);
  }
}

function tokenFromReq(req: Parameters<RequestHandler>[0]) {
  const header = req.header('x-log-token');
  if (header) return header;
  const q = typeof req.query?.token === 'string' ? req.query.token : undefined;
  return q || undefined;
}

export function logsRouter(opts: {
  logger: Logger;
  readToken?: string;
  writeToken?: string;
}) {
  const router = Router();

  // POST /logs/client - recebe logs do navegador
  router.post('/client', (req, res) => {
    const token = tokenFromReq(req);
    if (opts.writeToken && token !== opts.writeToken) {
      return res.status(401).json({ ok: false, error: 'invalid token' });
    }

    const body = (req.body ?? {}) as Partial<ClientLogEntry> & {
      level?: string;
      at?: string;
    };

    const entry: ClientLogEntry = {
      at: body.at || new Date().toISOString(),
      level: (['error', 'warn', 'info', 'debug'].includes(body.level || '') ? body.level : 'error') as ClientLogEntry['level'],
      kind: body.kind,
      message: body.message,
      stack: body.stack,
      url: body.url,
      userAgent: body.userAgent,
      payload: body.payload,
      user: body.user,
      ip: req.ip,
    };

    pushLog(entry);

    // envia para o logger do servidor
    if (entry.level === 'error') {
      opts.logger.error({ type: 'client', ...entry });
    } else if (entry.level === 'warn') {
      opts.logger.warn({ type: 'client', ...entry });
    } else {
      opts.logger.info({ type: 'client', ...entry });
    }

    return res.json({ ok: true });
  });

  // GET /logs/client - lista ultimos logs
  router.get('/client', (req, res) => {
    const token = tokenFromReq(req);
    if (opts.readToken && token !== opts.readToken) {
      return res.status(401).json({ ok: false, error: 'invalid token' });
    }
    const limitRaw = typeof req.query?.limit === 'string' ? parseInt(req.query.limit, 10) : NaN;
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), MAX_LOGS) : 200;
    const items = clientLogs.slice(-limit);
    return res.json({ ok: true, count: items.length, items });
  });

  return router;
}
