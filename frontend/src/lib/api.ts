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

  // csurf expects this header for state-changing methods.
  // Even when using Bearer auth, some deployments may still enforce CSRF.
  if (csrfToken && config.method && ['post', 'put', 'patch', 'delete'].includes(config.method)) {
    config.headers = config.headers ?? {};
    (config.headers as any)['X-CSRF-Token'] = csrfToken;
  }
  return config;
});

export async function initCsrf() {
  try {
    const { data } = await api.get('/auth/csrf');
    csrfToken = data.csrfToken;
    return csrfToken;
  } catch {
    return null;
  }
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

  // Best-effort CSRF token fetch (some deployments still require it)
  await initCsrf();

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
  entryType?: string | null;
  name: string;
  url?: string | null;
  ip?: string | null;
  username?: string | null;
  password?: string | null;
  email?: string | null;
  connectionData?: string | null;
  connectionJson?: any | null;
  sapConnection?: string | null;
  sapJson?: any | null;
  vpnConnection?: string | null;
  vpnJson?: any | null;
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

export async function updateEntryShare(id: string, payload: { uids: string[]; emails?: string[] }) {
  await api.put(`/vault/${id}/share`, payload);
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
  iconLink?: string;
  size?: string;
  modifiedTime?: string;
};

export type DriveItem = DriveFile & { isFolder?: boolean };

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

export async function browseDrive(parentId?: string | null) {
  const { data } = await api.get('/drive/browse', { params: { parentId: parentId || undefined } });
  return data as { items: DriveItem[]; needsSetup?: boolean; parentId?: string | null; rootFolderId?: string | null };
}

export async function uploadDriveFile(file: File) {
  // JSON upload (base64) to avoid multipart parsing deps.
  // Backend may reply with 501 if upload is not configured.
  const buf = await file.arrayBuffer();
  const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
  const { data } = await api.post('/drive/upload', {
    fileName: file.name,
    mimeType: file.type || 'application/octet-stream',
    dataBase64: b64,
  });
  return data as { ok: boolean; file: DriveFile };
}

// Notes Items
export type NoteItem = { id: string; title: string; content: string; createdAt: string; updatedAt: string };

export async function listNoteItems() {
  const { data } = await api.get('/notes/items');
  return data as { items: NoteItem[] };
}

export async function createNoteItem(title: string, content: string) {
  const { data } = await api.post('/notes/items', { title, content });
  return data as { ok: boolean; id: string };
}

export async function updateNoteItem(id: string, patch: Partial<Pick<NoteItem, 'title' | 'content'>>) {
  const { data } = await api.put(`/notes/items/${id}`, patch);
  return data as { ok: boolean };
}

export async function deleteNoteItem(id: string) {
  const { data } = await api.delete(`/notes/items/${id}`);
  return data as { ok: boolean };
}

export async function deleteDriveFile(fileId: string) {
  const { data } = await api.delete(`/drive/files/${fileId}`);
  return data as { ok: boolean };
}

// Projetos / Kanban
export type Project = {
  id: string;
  ownerEmail?: string | null;
  sharedWith?: string[];
  isOwner?: boolean;
  canEdit?: boolean;
  canView?: boolean;
  projectType?: 'sap' | 'general';
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  driveFolderOverrideId?: string | null;
  hourlyRate?: number | null;
};

export type KanbanColumn = { id: string; title: string; wipLimit?: number | null };
export type KanbanCard = {
  id: string;
  columnId: string;
  title: string;
  description?: string | null;
  estimateHours?: number | null;
  type?: 'sap' | 'general' | 'note' | null;
  order?: number | null;
  priority?: 'low' | 'med' | 'high' | 'urgent' | null;
  dueDate?: string | null;
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
export type ProjectBoard = { columns: KanbanColumn[]; cards: KanbanCard[] };

export async function listProjects() {
  const { data } = await api.get('/projects');
  return data as { projects: Project[] };
}

export async function createProject(
  name: string,
  description?: string | null,
  projectType: 'sap' | 'general' = 'sap',
  hourlyRate?: number | null
) {
  const { data } = await api.post('/projects', { name, description, projectType, hourlyRate });
  return data as { ok: boolean; id: string; project?: Project };
}


export async function updateProject(
  id: string,
  patch: Partial<Pick<Project, 'name' | 'description' | 'driveFolderOverrideId' | 'hourlyRate'>>
) {
  const { data } = await api.put(`/projects/${id}`, patch);
  return data as { ok: boolean };
}

export async function shareProject(
  id: string,
  payload: { uids: string[]; emails?: string[]; access?: 'edit' | 'view' }
) {
  const { data } = await api.put(`/projects/${id}/share`, payload);
  return data as {
    ok: boolean;
    sharedWith: string[];
    sharedWithView?: string[];
    sharedEmails?: string[];
    sharedViewEmails?: string[];
    unresolvedEmails: string[];
  };
}

export async function deleteProject(id: string) {
  const { data } = await api.delete(`/projects/${id}`);
  return data as { ok: boolean };
}

export async function getProjectBoard(id: string) {
  const { data } = await api.get(`/projects/${id}/board`);
  return data as { board: ProjectBoard; meta?: { isOwner: boolean; canEdit: boolean; ownerEmail?: string | null } };
}

export async function saveProjectBoard(id: string, board: ProjectBoard) {
  const { data } = await api.put(`/projects/${id}/board`, { board });
  return data as { ok: boolean };
}
