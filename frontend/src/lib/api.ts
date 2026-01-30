import axios from 'axios';

const baseURL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || '/api';

let csrfToken: string | null = null;

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  // csurf expects this header for state-changing methods
  if (csrfToken && config.method && ['post', 'put', 'patch', 'delete'].includes(config.method)) {
    config.headers = config.headers ?? {};
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  return config;
});

export async function initCsrf() {
  const { data } = await api.get('/auth/csrf');
  csrfToken = data.csrfToken;
  return csrfToken;
}

export type SessionUser = { uid: string; email?: string; role?: string };

export async function createSession(idToken: string) {
  const { data } = await api.post('/auth/session', { idToken });
  return data.user as SessionUser;
}

export async function me() {
  const { data } = await api.get('/auth/me');
  return data.user as SessionUser;
}

export async function logout() {
  await api.post('/auth/logout');
}

export type VaultEntry = {
  id: string;
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

export async function updateEntry(id: string, payload: Partial<Omit<VaultEntry, 'id' | 'createdAt' | 'updatedAt'>>) {
  await api.put(`/vault/${id}`, payload);
}

export async function deleteEntry(id: string) {
  await api.delete(`/vault/${id}`);
}
