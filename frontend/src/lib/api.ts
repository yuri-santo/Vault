import axios from 'axios';

const baseURL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || '/api';

let csrfToken: string | null = null;

// Prefer Bearer token when frontend/backend are on different domains (Render).
// Cookies cross-site are increasingly blocked/partitioned by browsers.
const TOKEN_KEY = 'vault_id_token';
let authToken: string | null =
  typeof window !== 'undefined' ? window.localStorage.getItem(TOKEN_KEY) : null;

export function setAuthToken(token: string) {
  authToken = token;
  if (typeof window !== 'undefined') window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  authToken = null;
  if (typeof window !== 'undefined') window.localStorage.removeItem(TOKEN_KEY);
}

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  // Bearer auth (recommended)
  if (authToken) {
    config.headers = config.headers ?? {};
    (config.headers as any)['Authorization'] = `Bearer ${authToken}`;
  }

  // csurf expects this header for state-changing methods
  // If we are using Bearer, backend skips CSRF.
  if (!authToken && csrfToken && config.method && ['post', 'put', 'patch', 'delete'].includes(config.method)) {
    config.headers = config.headers ?? {};
    (config.headers as any)['X-CSRF-Token'] = csrfToken;
  }
  return config;
});

export async function initCsrf() {
  if (authToken) return null;
  const { data } = await api.get('/auth/csrf');
  csrfToken = data.csrfToken;
  return csrfToken;
}

export type SessionUser = { uid: string; email?: string; role?: string };

export async function createSession(idToken: string) {
  // IMPORTANT:
  // In a two-services setup (Render), frontend and backend are on different domains.
  // Modern browsers increasingly block/partition third-party cookies, so we prefer
  // Bearer token auth for all API calls.
  setAuthToken(idToken);

  // Try to create the legacy cookie session as a best-effort (not required).
  // If cookies are blocked, this may fail silently but Bearer still works.
  try {
    await api.post('/auth/session', { idToken });
  } catch {
    // ignore
  }

  // Fetch the user profile via Bearer.
  return await me();
}

export async function me() {
  const { data } = await api.get('/auth/me');
  return data.user as SessionUser;
}

export async function logout() {
  clearAuthToken();
  try {
    await api.post('/auth/logout');
  } catch {
    // ignore
  }
}

export type VaultEntry = {
  id: string;
  ownerUid?: string;
  ownerEmail?: string | null;
  canEdit?: boolean;
  isShared?: boolean;
  sharedWith?: string[];
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

export async function listEntries() {
  const { data } = await api.get('/vault');
  return data.entries as VaultEntry[];
}

export async function createEntry(payload: Omit<VaultEntry, 'id' | 'createdAt' | 'updatedAt'>) {
  const { data } = await api.post('/vault', payload);
  return data.id as string;
}

export async function updateEntry(
  id: string,
  payload: Partial<Omit<VaultEntry, 'id' | 'createdAt' | 'updatedAt'>>
) {
  await api.put(`/vault/${id}`, payload);
}

export async function updateEntryShare(id: string, uids: string[]) {
  await api.put(`/vault/${id}/share`, { uids });
}

export async function deleteEntry(id: string) {
  await api.delete(`/vault/${id}`);
}

// Compartilhamento
export type ShareInvite = {
  id: string;
  fromUid: string;
  fromEmail?: string | null;
  toEmail?: string | null;
  toUid?: string | null;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  acceptedAt?: string | null;
  declinedAt?: string | null;
};

export type ShareConnection = { uid: string; email?: string | null; inviteId: string };

export async function sendInvite(toEmail: string) {
  const { data } = await api.post('/sharing/invites', { toEmail });
  return data as { ok: boolean; inviteId: string; reused?: boolean };
}

export async function listInvites() {
  const { data } = await api.get('/sharing/invites');
  return data as { sent: ShareInvite[]; received: ShareInvite[] };
}

export async function acceptInvite(inviteId: string) {
  const { data } = await api.post(`/sharing/invites/${inviteId}/accept`);
  return data as { ok: boolean };
}

export async function declineInvite(inviteId: string) {
  const { data } = await api.post(`/sharing/invites/${inviteId}/decline`);
  return data as { ok: boolean };
}

export async function listConnections() {
  const { data } = await api.get('/sharing/connections');
  return data as { connections: ShareConnection[] };
}

// Notas
export async function getNotes() {
  const { data } = await api.get('/notes');
  return data as { notes: string; updatedAt: string | null };
}

export async function saveNotes(notes: string) {
  const { data } = await api.put('/notes', { notes });
  return data as { ok: boolean; updatedAt: string };
}

// Google Drive (armazenamento emergencial)
export type DriveFile = {
  id: string;
  name: string;
  webViewLink?: string;
  webContentLink?: string;
  mimeType?: string;
  size?: string;
  modifiedTime?: string;
};

export async function getDriveSettings() {
  const { data } = await api.get('/drive/settings');
  return data as { folderId: string | null; enabled: boolean; mode?: string; uploadEnabled?: boolean; openUrl?: string | null };
}

export async function setDriveFolder(folder: string) {
  const { data } = await api.post('/drive/settings', { folder });
  return data as { ok: boolean; folderId: string };
}

export async function listDriveFiles() {
  const { data } = await api.get('/drive/files');
  return data as { files: DriveFile[]; needsSetup?: boolean };
}

export async function uploadDriveFile(file: File) {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post('/drive/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data as { ok: boolean; file: DriveFile };
}

export async function deleteDriveFile(fileId: string) {
  const { data } = await api.delete(`/drive/files/${fileId}`);
  return data as { ok: boolean };
}
