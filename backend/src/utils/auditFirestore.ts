import type admin from 'firebase-admin';
import type winston from 'winston';

export type AuditEvent = {
  action: string;
  uid?: string;
  email?: string;
  ip?: string;
  userAgent?: string;
  details?: any;
  createdAt?: string;
};

export async function auditFirestore(db: admin.firestore.Firestore, logger: winston.Logger, evt: AuditEvent) {
  const payload = {
    ...evt,
    createdAt: evt.createdAt ?? new Date().toISOString()
  };

  // File log
  logger.info({ type: 'audit', ...payload });

  // Firestore log (best-effort)
  try {
    await db.collection('auditLogs').add(payload);
  } catch (e) {
    logger.error({ type: 'audit_firestore_error', error: (e as Error).message });
  }
}
